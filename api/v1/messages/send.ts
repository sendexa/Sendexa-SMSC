import express, { Request, Response, NextFunction, Router } from 'express';
import { validateNumber } from '../../../services/number-validator/validate';
import { contentFilter } from '../../../nca-compliance/content-filter';
import { queue } from '../../../services/message-queue/queue';

interface SendSMSBody {
  clientid: string;
  clientsecret: string;
  from: string;
  to: string;
  content: string;
}

const router: Router = express.Router();

router.post('/send', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const { clientid, clientsecret, from, to, content } = req.body as SendSMSBody;

      if (!clientid || !clientsecret || !from || !to || !content) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required parameters',
        });
      }

      const isValidClient = await authenticateClient(clientid, clientsecret);
      if (!isValidClient) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid client credentials',
        });
      }

      const normalizedTo = validateNumber(to);
      if (!normalizedTo) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid recipient number',
        });
      }

      const contentCheck = await contentFilter(content);
      if (!contentCheck.allowed) {
        return res.status(403).json({
          status: 'error',
          message: contentCheck.reason || 'Message content not allowed',
        });
      }

      const telco = determineTelco(normalizedTo);

      const job = await queue.add('send-message', {
        telco,
        from,
        to: normalizedTo,
        content,
        clientId: clientid,
        timestamp: new Date(),
      });

      const messageId = job.id?.toString() ?? '';

      res.json({
        status: 'success',
        messageId,
        telco,
        to: normalizedTo,
      });
    } catch (error) {
      next(error); // Pass errors to Express error handler
    }
  })();
});

async function authenticateClient(clientId: string, clientSecret: string): Promise<boolean> {
  return clientId === 'oqbznbkr' && clientSecret === 'fafteobz';
}

function determineTelco(msisdn: string): string {
  const prefixes: Record<string, string[]> = {
    mtn: ['24', '25', '26', '27', '28', '29', '54', '55', '56', '57', '58', '59'],
    vodafone: ['20', '30', '50'],
    airteltigo: ['23', '53', '52'],
    glo: ['23', '53', '52'],
  };

  const prefix = msisdn.slice(0, 2);
  for (const [telco, telcoPrefixes] of Object.entries(prefixes)) {
    if (telcoPrefixes.includes(prefix)) {
      return telco;
    }
  }

  return 'unknown';
}

export default router;