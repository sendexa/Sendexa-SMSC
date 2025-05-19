import { Router } from 'express';
import { 
  sendSMS, 
  sendBatchSMS, 
  sendPersonalizedBatchSMS, 
  getMessageStatus 
} from '../controllers/messages';
import { basicAuth, validateClientCredentials } from '../middleware/auth';

const router = Router();

// GET /v1/messages/send
router.get('/send', validateClientCredentials, sendSMS);

// POST /v1/messages/send
router.post('/send', basicAuth, sendSMS);

// POST /v1/messages/batch/simple/send
router.post('/batch/simple/send', basicAuth, sendBatchSMS);

// POST /v1/messages/batch/personalized/send
router.post('/batch/personalized/send', basicAuth, sendPersonalizedBatchSMS);

// GET /v1/messages/:messageId
router.get('/:messageId', basicAuth, getMessageStatus);

export default router; 