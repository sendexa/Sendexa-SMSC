import express from 'express';
import { logger } from '../../utils/logger';
import { validateNumber } from '../../services/number-validator/validate';
import { contentFilter } from '../../nca-compliance/content-filter';
import { queue } from '../../services/message-queue/queue';

const router = express.Router();

router.get('/send', async (req, res) => {
  try {
    // Validate required parameters
    const { clientid, clientsecret, from, to, content } = req.query;
    
    if (!clientid || !clientsecret || !from || !to || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameters'
      });
    }

    // Authenticate client (simplified example)
    const isValidClient = await authenticateClient(clientid as string, clientsecret as string);
    if (!isValidClient) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid client credentials'
      });
    }

    // Validate phone number
    const normalizedTo = validateNumber(to as string);
    if (!normalizedTo) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid recipient number'
      });
    }

    // Content filtering
    const contentCheck = await contentFilter(content as string);
    if (!contentCheck.allowed) {
      return res.status(403).json({
        status: 'error',
        message: contentCheck.reason || 'Message content not allowed'
      });
    }

    // Determine telco based on number prefix
    const telco = determineTelco(normalizedTo);

    // Add to message queue
    const messageId = await queue.add({
      telco,
      from: from as string,
      to: normalizedTo,
      content: content as string,
      clientId: clientid as string,
      timestamp: new Date()
    });

    res.json({
      status: 'success',
      messageId,
      telco,
      to: normalizedTo
    });

  } catch (error) {
    logger.error(`API error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

async function authenticateClient(clientId: string, clientSecret: string): Promise<boolean> {
  // In a real implementation, check against your database
  return clientId === 'oqbznbkr' && clientSecret === 'fafteobz'; // Example from Hubtel
}

function determineTelco(msisdn: string): string {
  // Ghana number prefixes
  const prefixes = {
    mtn: ['24', '25', '26', '27', '28', '29', '54', '55', '56', '57', '58', '59'],
    vodafone: ['20', '30', '50'],
    airteltigo: ['23', '53', '52', '57'],
    glo: ['23', '53', '52', '57'] // Note: Glo may share prefixes
  };

  const prefix = msisdn.substring(0, 2);
  for (const [telco, telcoPrefixes] of Object.entries(prefixes)) {
    if (telcoPrefixes.includes(prefix)) {
      return telco;
    }
  }

  return 'unknown';
}

export default router;