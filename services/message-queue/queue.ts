import { Queue } from 'bullmq';
import { redisConfig } from '../../configs/system';

export const queue = new Queue('sms-messages', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
}); 

// Worker setup would be in workers.ts