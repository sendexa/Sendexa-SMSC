import { Router } from 'express';
import { MessagesController } from '../controllers/messages';
import { authenticateRequest } from '../middleware/auth';

const router = Router();
const messagesController = new MessagesController();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /v1/messages/send - Send SMS via GET
router.get('/send', authenticateRequest, (req, res) => {
  const { from, to, content } = req.query;
  req.body = { from, to, content };
  messagesController.sendSms(req, res);
});

// POST /v1/messages/send - Send SMS via POST
router.post('/send', authenticateRequest, messagesController.sendSms.bind(messagesController));

// POST /v1/messages/batch/simple/send - Send batch SMS
router.post('/batch/simple/send', authenticateRequest, messagesController.sendBatchSms.bind(messagesController));

// POST /v1/messages/batch/personalized/send - Send personalized batch SMS
router.post('/batch/personalized/send', authenticateRequest, messagesController.sendPersonalizedBatchSms.bind(messagesController));

// GET /v1/messages/:messageId - Get message status
router.get('/:messageId', authenticateRequest, messagesController.getMessageStatus.bind(messagesController));

export default router; 