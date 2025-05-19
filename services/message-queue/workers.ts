import { Worker } from 'bullmq';
import { logger } from '../../utils/logger';
import { redisConfig } from '../../configs/system';
import { SmppClient } from '../../smpp-core/smpp-client';
import { MessageStatus } from '../../api/v1/types/messages';
import { TelcoRegistry } from '../../configs/telcos';

interface MessageData {
  messageId: string;
  from: string;
  to: string;
  content: string;
  clientId: string;
}

interface BatchMessageData {
  batchId: string;
  from: string;
  messages: {
    recipient: string;
    content: string;
    messageId: string;
  }[];
  clientId: string;
}

interface RateLimiter {
  minute: number;
  hour: number;
  day: number;
  lastReset: {
    minute: number;
    hour: number;
    day: number;
  };
  throughput: {
    count: number;
    lastReset: number;
  };
}


const clients: Map<string, SmppClient> = new Map();
const rateLimiters: Map<string, RateLimiter> = new Map();

function getTelcoForNumber(phoneNumber: string): string {
  return TelcoRegistry.getTelcoByNumber(phoneNumber);
}

function initializeRateLimiter(): RateLimiter {
  // const now = Date.now();
  const now = Date.now();
  
  return {
    minute: 0,
    hour: 0,
    day: 0,
    lastReset: {
      minute: now,
      hour: now,
      day: now
    },
    throughput: {
      count: 0,
      lastReset: now
    }
  };
}

function checkRateLimits(telco: string): boolean {
  const config = TelcoRegistry.getConfig(telco);
  const limits = config.ncaSettings.rateLimits;
  const now = Date.now();
  
  // Get or initialize rate limiter
  let limiter = rateLimiters.get(telco);
  if (!limiter) {
    limiter = initializeRateLimiter();
    rateLimiters.set(telco, limiter);
  }

  // Reset counters if needed
  if (now - limiter.lastReset.minute >= 60000) {
    limiter.minute = 0;
    limiter.lastReset.minute = now;
  }
  if (now - limiter.lastReset.hour >= 3600000) {
    limiter.hour = 0;
    limiter.lastReset.hour = now;
  }
  if (now - limiter.lastReset.day >= 86400000) {
    limiter.day = 0;
    limiter.lastReset.day = now;
  }

  // Check throughput (messages per second)
  if (now - limiter.throughput.lastReset >= 1000) {
    limiter.throughput.count = 0;
    limiter.throughput.lastReset = now;
  }

  // Check all limits
  if (limiter.minute >= limits.messagesPerMinute) {
    logger.warn(`Minute rate limit exceeded for ${telco}`);
    return false;
  }
  if (limiter.hour >= limits.messagesPerHour) {
    logger.warn(`Hour rate limit exceeded for ${telco}`);
    return false;
  }
  if (limiter.day >= limits.messagesPerDay) {
    logger.warn(`Day rate limit exceeded for ${telco}`);
    return false;
  }
  if (limiter.throughput.count >= config.throughput) {
    logger.warn(`Throughput limit exceeded for ${telco}`);
    return false;
  }

  // Update counters
  limiter.minute++;
  limiter.hour++;
  limiter.day++;
  limiter.throughput.count++;

  return true;
}

export function createWorkers(): void {
  // Worker for single messages
  const singleMessageWorker = new Worker('send-sms', async job => {
    try {
      const data = job.data as MessageData;
      const { messageId, from, to, content } = data;

      logger.info(`Processing message ${messageId} to ${to}`);
      
      const telco = getTelcoForNumber(to);
      const config = TelcoRegistry.getConfig(telco);

      // Check rate limits
      if (!checkRateLimits(telco)) {
        throw new Error(`Rate limit exceeded for ${telco}`);
      }

      // Check content length
      if (content.length > config.ncaSettings.templates.maxLength) {
        throw new Error(`Message content exceeds maximum length of ${config.ncaSettings.templates.maxLength} characters`);
      }

      const client = await getOrCreateClient(telco);
      
      const result = await client.submitMessage({
        source: from,
        destination: to,
        message: content,
        messageId,
        dataCoding: 0, // GSM 7-bit default alphabet
        registeredDelivery: config.registeredDelivery,
        ...config.specificParams
      });
      
      return { 
        status: MessageStatus.SENT_TO_TELCO, 
        messageId: result.messageId,
        telco,
        config: {
          throughput: config.throughput,
          maxConnections: config.maxConnections
        }
      };
    } catch (error) {
      logger.error(`Message processing failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }, {
    connection: redisConfig,
    concurrency: 10
  });

  // Worker for batch messages
  const batchMessageWorker = new Worker('send-batch-sms', async job => {
    try {
      const data = job.data as BatchMessageData;
      const { batchId, from, messages } = data;

      logger.info(`Processing batch ${batchId} with ${messages.length} messages`);
      
      // Group messages by telco for better throughput
      const messagesByTelco = messages.reduce((acc, msg) => {
        const telco = getTelcoForNumber(msg.recipient);
        if (!acc[telco]) acc[telco] = [];
        acc[telco].push(msg);
        return acc;
      }, {} as Record<string, typeof messages>);

      const results = await Promise.all(
        Object.entries(messagesByTelco).map(async ([telco, telcoMessages]) => {
          const config = TelcoRegistry.getConfig(telco);

          // Check rate limits for the batch
          if (!checkRateLimits(telco)) {
            throw new Error(`Rate limit exceeded for ${telco}`);
          }

          const client = await getOrCreateClient(telco);
          
          // Process messages in chunks based on throughput
          const chunkSize = Math.min(config.throughput, telcoMessages.length);
          const chunks = [];
          
          for (let i = 0; i < telcoMessages.length; i += chunkSize) {
            const chunk = telcoMessages.slice(i, i + chunkSize);
            const chunkResults = await Promise.all(
              chunk.map(msg => 
                client.submitMessage({
                  source: from,
                  destination: msg.recipient,
                  message: msg.content,
                  messageId: msg.messageId,
                  dataCoding: 0,
                  registeredDelivery: config.registeredDelivery,
                  ...config.specificParams
                })
              )
            );
            chunks.push(chunkResults);
            
            // Add a small delay between chunks to respect throughput
            if (i + chunkSize < telcoMessages.length) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          return chunks.flat();
        })
      );
      
      return {
        status: MessageStatus.SENT_TO_TELCO,
        batchId,
        results: results.flat().map(r => ({
          messageId: r.messageId,
          status: r.status
        }))
      };
    } catch (error) {
      logger.error(`Batch processing failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }, {
    connection: redisConfig,
    concurrency: 5
  });

  // Event handlers for single message worker
  singleMessageWorker.on('completed', job => {
    logger.info(`Message ${job.id} completed`);
  });

  singleMessageWorker.on('failed', (job, err) => {
    logger.error(`Message ${job?.id} failed: ${err.message}`);
  });

  // Event handlers for batch message worker
  batchMessageWorker.on('completed', job => {
    logger.info(`Batch ${job.id} completed`);
  });

  batchMessageWorker.on('failed', (job, err) => {
    logger.error(`Batch ${job?.id} failed: ${err.message}`);
  });

  // Cleanup on process exit
  process.on('SIGTERM', async () => {
    await cleanupClients();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await cleanupClients();
    process.exit(0);
  });
}

async function getOrCreateClient(telco: string): Promise<SmppClient> {
  if (clients.has(telco)) {
    const client = clients.get(telco)!;
    if (client.isConnected()) {
      return client;
    }
    // Client exists but disconnected, remove it
    clients.delete(telco);
  }

  const config = TelcoRegistry.getConfig(telco);
  const client = new SmppClient({
    host: config.host,
    port: config.port,
    systemId: config.systemId,
    password: config.password
  });

  try {
    await client.connect();
    clients.set(telco, client);
    return client;
  } catch (error) {
    logger.error(`Failed to connect to ${telco} SMSC: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function cleanupClients(): Promise<void> {
  const disconnectPromises = Array.from(clients.values()).map(client => client.disconnect());
  await Promise.all(disconnectPromises);
  clients.clear();
}