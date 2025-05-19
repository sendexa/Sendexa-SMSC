import { Worker } from 'bullmq';
import { logger } from '../../utils/logger';
// Update the import to match the actual export from '../../configs/system'
import { redisConfig } from '../../configs/system';
// Or, if it's a named export with a different name, use:
// import { correctExportName as redisConfig } from '../../configs/system';
import { MTNConfig } from '../../countries/ghana/mtn/config';
import { VodafoneConfig } from '../../countries/ghana/vodafone/config';
import { AirtelTigoConfig } from '../../countries/ghana/airteltigo/config';
import { GloConfig } from '../../countries/ghana/glo/config';
import { SmppClient } from '../../smpp-core/smpp-client';
import { MessageStatus } from '../../api/v1/types/messages';

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

const telcoConfigs = {
  mtn: MTNConfig,
  vodafone: VodafoneConfig,
  airteltigo: AirtelTigoConfig,
  glo: GloConfig
};

const clients: Map<string, SmppClient> = new Map();

// Telco routing based on phone number prefix
const telcoRouting: Record<string, string> = {
  '23320': 'mtn',
  '23324': 'mtn',
  '23354': 'mtn',
  '23355': 'mtn',
  '23359': 'mtn',
  '23325': 'vodafone',
  '23350': 'vodafone',
  '23326': 'airteltigo',
  '23327': 'airteltigo',
  '23356': 'airteltigo',
  '23357': 'airteltigo',
  '23323': 'glo'
};

function getTelcoForNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Check each prefix
  for (const [prefix, telco] of Object.entries(telcoRouting)) {
    if (cleanNumber.startsWith(prefix)) {
      return telco;
    }
  }
  
  // Default to MTN if no match found
  return 'mtn';
}

export function createWorkers(): void {
  // Worker for single messages
  const singleMessageWorker = new Worker('send-sms', async job => {
    try {
      const data = job.data as MessageData;
      const { messageId, from, to, content } = data;

      logger.info(`Processing message ${messageId} to ${to}`);
      
      const telco = getTelcoForNumber(to);
      const client = await getOrCreateClient(telco);
      
      const result = await client.submitMessage({
        source: from,
        destination: to,
        message: content,
        messageId,
        dataCoding: 0, // GSM 7-bit default alphabet
        registeredDelivery: 1 // Request delivery receipt
      });
      
      return { 
        status: MessageStatus.SENT_TO_TELCO, 
        messageId: result.messageId,
        telco
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
      
      const results = await Promise.all(
        messages.map(async (msg) => {
          const telco = getTelcoForNumber(msg.recipient);
          const client = await getOrCreateClient(telco);
          
          return client.submitMessage({
            source: from,
            destination: msg.recipient,
            message: msg.content,
            messageId: msg.messageId,
            dataCoding: 0,
            registeredDelivery: 1
          });
        })
      );
      
      return {
        status: MessageStatus.SENT_TO_TELCO,
        batchId,
        results: results.map(r => ({
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

  const config = telcoConfigs[telco as keyof typeof telcoConfigs];
  if (!config) {
    throw new Error(`No configuration found for telco: ${telco}`);
  }

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