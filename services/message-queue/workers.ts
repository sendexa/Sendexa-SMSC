import { Worker } from 'bullmq';
import { logger } from '../../utils/logger';
import { redisConfig } from '../../configs/system';

export function createWorkers(): void {
  const worker = new Worker('sms-messages', async job => {
    try {
      const { telco } = job.data;

      logger.info(`Processing message via ${telco}`);
      
      // In a real implementation, this would connect to the actual telco SMPP server
      // For now, we'll just simulate success
      await simulateSMPPSubmission(telco);
      
      return { status: 'delivered' };
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
}

async function simulateSMPPSubmission(telco: string): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Simulate 10% failure rate for testing
  if (Math.random() < 0.1) {
    throw new Error(`Simulated ${telco} SMPP submission failure`);
  }
  
  // In a real implementation, this would use an SMPP client library
  // to connect to the telco's SMSC and submit the message
}