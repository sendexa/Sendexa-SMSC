import { Request, Response, NextFunction } from 'express';
import { Buffer } from 'buffer';

export interface AuthenticatedRequest extends Request {
  clientId?: string;
  clientSecret?: string;
}

export const basicAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [clientId, clientSecret] = credentials.split(':');

    if (!clientId || !clientSecret) {
      return res.status(401).json({ error: 'Invalid credentials format' });
    }

    req.clientId = clientId;
    req.clientSecret = clientSecret;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid authentication credentials' });
  }
};

export const validateClientCredentials = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { clientid, clientsecret } = req.query;

  if (!clientid || !clientsecret) {
    return res.status(401).json({ error: 'Client credentials required' });
  }

  req.clientId = clientid as string;
  req.clientSecret = clientsecret as string;
  next();
}; 