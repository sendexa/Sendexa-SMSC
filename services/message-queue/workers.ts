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

interface MessageData {
  telco: string;
  source: string;
  destination: string;
  message: string;
  messageId: string;
  dataCoding: number;
  registeredDelivery: number;
}

const telcoConfigs = {
  mtn: MTNConfig,
  vodafone: VodafoneConfig,
  airteltigo: AirtelTigoConfig,
  glo: GloConfig
};

const clients: Map<string, SmppClient> = new Map();

export function createWorkers(): void {
  const worker = new Worker('sms-messages', async job => {
    try {
      const data = job.data as MessageData;
      const { telco, source, destination, message, messageId, dataCoding, registeredDelivery } = data;

      logger.info(`Processing message ${messageId} via ${telco}`);
      
      // Get or create SMPP client for the telco
      const client = await getOrCreateClient(telco);
      
      // Submit message to telco's SMSC
      const result = await client.submitMessage({
        source,
        destination,
        message,
        messageId,
        dataCoding,
        registeredDelivery
      });
      
      return { status: 'delivered', messageId: result.messageId };
    } catch (error) {
      let errorMsg = 'Unknown error';
      if (typeof error === 'object' && error && 'message' in error) {
        errorMsg = (error as { message: string }).message;
      }
      logger.error(`Message processing failed: ${errorMsg}`);
      throw error;
    }
  }, {
    connection: redisConfig,
    concurrency: 10
  });

  worker.on('completed', job => {
    logger.info(`Message ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Message ${job?.id} failed: ${err.message}`);
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