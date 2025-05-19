import { Request, Response, NextFunction } from 'express';
import { Buffer } from 'buffer';
import { logger } from '../../../utils/logger';

export interface AuthenticatedRequest extends Request {
  clientId?: string;
  clientSecret?: string;
}

export function authenticateRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    // For GET requests, check query parameters
    if (req.method === 'GET') {
      const { clientid, clientsecret } = req.query;
      
      if (!clientid || !clientsecret) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'clientid and clientsecret are required'
        });
        return;
      }

      req.clientId = clientid as string;
      req.clientSecret = clientsecret as string;
    } 
    // For POST requests, check Authorization header
    else if (req.method === 'POST') {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Basic authentication is required'
        });
        return;
      }

      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [clientId, clientSecret] = credentials.split(':');

      if (!clientId || !clientSecret) {
        res.status(401).json({
          error: 'Invalid credentials',
          message: 'Invalid clientId or clientSecret format'
        });
        return;
      }

      req.clientId = clientId;
      req.clientSecret = clientSecret;
    }

    // Validate credentials against database/storage
    // TODO: Implement actual credential validation
    // For now, we'll just log the attempt
    logger.info('Authentication attempt', {
      clientId: req.clientId,
      method: req.method,
      path: req.path
    });

    next();
  } catch (error) {
    logger.error('Authentication error', error as Error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error processing authentication'
    });
  }
}

export const validateClientCredentials = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { clientid, clientsecret } = req.query;

  if (!clientid || !clientsecret) {
    return res.status(401).json({ error: 'Client credentials required' });
  }

  req.clientId = clientid as string;
  req.clientSecret = clientsecret as string;
  next();
}; 