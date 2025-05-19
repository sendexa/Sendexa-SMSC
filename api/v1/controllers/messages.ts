import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../utils/logger';
import { queue } from '../../../services/message-queue/queue';
import { MessageStatus, SendSmsRequest, BatchSmsRequest, PersonalizedBatchSmsRequest } from '../types/messages';
import { TelcoRegistry } from '../../../configs/telcos';

interface AuthenticatedRequest extends Request {
  clientId?: string;
  clientSecret?: string;
}

export class MessagesController {
  async sendSms(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { from, to, content } = req.body as SendSmsRequest;
      const clientId = req.clientId!;
      const clientSecret = req.clientSecret!;

      // Validate sender ID
      if (!this.isValidSenderId(from)) {
        res.status(400).json({
          error: 'Invalid sender ID',
          message: 'Sender ID must be alphanumeric and between 3-11 characters'
        });
        return;
      }

      // Validate phone number
      if (!this.isValidPhoneNumber(to)) {
        res.status(400).json({
          error: 'Invalid phone number',
          message: 'Phone number must be in international format (e.g., 233xxxxxxxxx)'
        });
        return;
      }

      // Validate content
      if (!this.isValidContent(content)) {
        res.status(400).json({
          error: 'Invalid content',
          message: 'Message content cannot be empty and must be less than 160 characters'
        });
        return;
      }

      const messageId = uuidv4();
      const telco = TelcoRegistry.getTelcoByNumber(to);
      const config = TelcoRegistry.getConfig(telco);

      // Queue the message
      await queue.add('send-sms', {
        messageId,
        from,
        to,
        content,
        clientId,
        clientSecret
      });

      res.json({
        rate: config.rate,
        messageId,
        status: MessageStatus.SUBMITTED,
        statusDescription: 'Request submitted successfully',
        networkId: config.networkId
      });
    } catch (error) {
      logger.error('Error sending SMS', error as Error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process SMS request'
      });
    }
  }

  async sendBatchSms(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { from, recipients, content } = req.body as BatchSmsRequest;
      const clientId = req.clientId!;
      const clientSecret = req.clientSecret!;

      // Validate sender ID
      if (!this.isValidSenderId(from)) {
        res.status(400).json({
          error: 'Invalid sender ID',
          message: 'Sender ID must be alphanumeric and between 3-11 characters'
        });
        return;
      }

      // Validate recipients
      if (!Array.isArray(recipients) || recipients.length === 0) {
        res.status(400).json({
          error: 'Invalid recipients',
          message: 'Recipients must be a non-empty array'
        });
        return;
      }

      // Validate each recipient
      for (const to of recipients) {
        if (!this.isValidPhoneNumber(to)) {
          res.status(400).json({
            error: 'Invalid phone number',
            message: `Invalid phone number: ${to}. Must be in international format (e.g., 233xxxxxxxxx)`
          });
          return;
        }
      }

      // Validate content
      if (!this.isValidContent(content)) {
        res.status(400).json({
          error: 'Invalid content',
          message: 'Message content cannot be empty and must be less than 160 characters'
        });
        return;
      }

      const batchId = uuidv4();
      const messages = recipients.map(to => ({
        recipient: to,
        content,
        messageId: uuidv4()
      }));

      // Queue the batch
      await queue.add('send-batch-sms', {
        batchId,
        from,
        messages,
        clientId,
        clientSecret
      });

      res.json({
        batchId,
        status: MessageStatus.SUBMITTED,
        data: messages
      });
    } catch (error) {
      logger.error('Error sending batch SMS', error as Error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process batch SMS request'
      });
    }
  }

  async sendPersonalizedBatchSms(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { from, personalizedRecipients } = req.body as PersonalizedBatchSmsRequest;
      const clientId = req.clientId!;
      const clientSecret = req.clientSecret!;

      // Validate sender ID
      if (!this.isValidSenderId(from)) {
        res.status(400).json({
          error: 'Invalid sender ID',
          message: 'Sender ID must be alphanumeric and between 3-11 characters'
        });
        return;
      }

      // Validate recipients
      if (!Array.isArray(personalizedRecipients) || personalizedRecipients.length === 0) {
        res.status(400).json({
          error: 'Invalid recipients',
          message: 'Recipients must be a non-empty array'
        });
        return;
      }

      // Validate each recipient and content
      for (const recipient of personalizedRecipients) {
        if (!this.isValidPhoneNumber(recipient.to)) {
          res.status(400).json({
            error: 'Invalid phone number',
            message: `Invalid phone number: ${recipient.to}. Must be in international format (e.g., 233xxxxxxxxx)`
          });
          return;
        }

        if (!this.isValidContent(recipient.content)) {
          res.status(400).json({
            error: 'Invalid content',
            message: `Invalid content for recipient ${recipient.to}. Content cannot be empty and must be less than 160 characters`
          });
          return;
        }
      }

      const batchId = uuidv4();
      const messages = personalizedRecipients.map(recipient => ({
        recipient: recipient.to,
        content: recipient.content,
        messageId: uuidv4()
      }));

      // Queue the batch
      await queue.add('send-batch-sms', {
        batchId,
        from,
        messages,
        clientId,
        clientSecret
      });

      res.json({
        batchId,
        status: MessageStatus.SUBMITTED,
        data: messages
      });
    } catch (error) {
      logger.error('Error sending personalized batch SMS', error as Error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process personalized batch SMS request'
      });
    }
  }

  async getMessageStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const clientId = req.clientId!;

      // TODO: Implement actual message status retrieval from database
      // For now, return a mock response
      res.json({
        rate: 0.030,
        messageId,
        status: MessageStatus.DELIVERED,
        updateTime: new Date().toISOString(),
        time: new Date().toISOString(),
        to: '233501234567', // This should come from the database
        from: 'Sendexa', // This should come from the database
        content: 'Test message' // This should come from the database
      });
    } catch (error) {
      logger.error('Error getting message status', error as Error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve message status'
      });
    }
  }

  private isValidSenderId(senderId: string): boolean {
    return /^[a-zA-Z0-9]{3,11}$/.test(senderId);
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    return /^233[0-9]{9}$/.test(phoneNumber);
  }

  private isValidContent(content: string): boolean {
    return content.length > 0 && content.length <= 160;
  }
} 