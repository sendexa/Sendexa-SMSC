import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../middleware/auth';
import { 
  SendSMSRequest, 
  BatchSMSRequest, 
  PersonalizedBatchSMSRequest,
  MessageResponse,
  BatchMessageResponse,
  MessageStatusResponse,
  MessageStatus
} from '../types/messages';
import { queue } from '../../../services/message-queue/queue';

export const sendSMS = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { From, To, Content } = req.body as SendSMSRequest;
    
    // Validate sender ID length
    if (From.length > 11) {
      return res.status(400).json({ error: 'Sender ID must not exceed 11 characters' });
    }

    // Validate phone number format (international format)
    if (!/^[0-9]{10,15}$/.test(To)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const messageId = uuidv4();
    const response: MessageResponse = {
      rate: 0.030, // This should be calculated based on your pricing
      messageId,
      status: MessageStatus.REQUEST_SUBMITTED,
      statusDescription: 'Request submitted successfully',
      networkId: '62001' // This should be determined based on the recipient's network
    };

    // Add message to queue
    await queue.add('send-sms', {
      messageId,
      from: From,
      to: To,
      content: Content,
      clientId: req.clientId
    });

    res.json(response);
  } catch {
    res.status(500).json({ error: 'Failed to process SMS request' });
  }
};

export const sendBatchSMS = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { From, Recipients, Content } = req.body as BatchSMSRequest;
    
    if (From.length > 11) {
      return res.status(400).json({ error: 'Sender ID must not exceed 11 characters' });
    }

    const batchId = uuidv4();
    const messages = Recipients.map(recipient => {
      const messageId = uuidv4();
      return {
        recipient,
        content: Content,
        messageId
      };
    });

    // Add batch to queue
    await queue.add('send-batch-sms', {
      batchId,
      from: From,
      messages,
      clientId: req.clientId
    });

    const response: BatchMessageResponse = {
      batchId,
      status: MessageStatus.REQUEST_SUBMITTED,
      data: messages
    };

    res.json(response);
  } catch {
    res.status(500).json({ error: 'Failed to process batch SMS request' });
  }
};

export const sendPersonalizedBatchSMS = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { From, personalizedRecipients } = req.body as PersonalizedBatchSMSRequest;
    
    if (From.length > 11) {
      return res.status(400).json({ error: 'Sender ID must not exceed 11 characters' });
    }

    const batchId = uuidv4();
    const messages = personalizedRecipients.map(recipient => {
      const messageId = uuidv4();
      return {
        recipient: recipient.To,
        content: recipient.Content,
        messageId
      };
    });

    // Add batch to queue
    await queue.add('send-personalized-batch-sms', {
      batchId,
      from: From,
      messages,
      clientId: req.clientId
    });

    const response: BatchMessageResponse = {
      batchId,
      status: MessageStatus.REQUEST_SUBMITTED,
      data: messages
    };

    res.json(response);
  } catch {
    res.status(500).json({ error: 'Failed to process personalized batch SMS request' });
  }
};

export const getMessageStatus = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    
    // TODO: Implement actual message status retrieval from database
    // This is a mock response
    const response: MessageStatusResponse = {
      rate: 0.030,
      messageId,
      status: 'Delivered',
      updateTime: new Date().toISOString(),
      time: new Date().toISOString(),
      to: '233501234567',
      from: 'Sendexa',
      content: 'Hello from Sendexa'
    };

    res.json(response);
  } catch {
    res.status(500).json({ error: 'Failed to retrieve message status' });
  }
}; 