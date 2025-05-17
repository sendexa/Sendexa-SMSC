import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { SmppServer } from './smpp-core/smpp-server';
import apiRouter from './api/v1/messages/send';
import { logger } from './utils/logger';
import { queue } from './services/message-queue/queue';
import { createWorkers } from './services/message-queue/workers';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Basic security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON body

// Routes
app.use('/v1/messages', apiRouter);

// Start SMPP server
const smppServer = new SmppServer();
smppServer.start();

// Start message queue workers
createWorkers();

// Start HTTP server
app.listen(port, () => {
  logger.info(`HTTP server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down servers...');
  smppServer.stop();
  await queue.close();
  process.exit(0);
});
