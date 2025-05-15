import net from 'net';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { SessionHandler } from './session-handler';
import { PDUProcessor } from './protocol-engine';

export class SmppServer extends EventEmitter {
  private server: net.Server;
  private port: number;
  private sessions: Map<string, SessionHandler>;

  constructor(port: number = 2775) {
    super();
    this.port = port;
    this.sessions = new Map();
    this.server = net.createServer(this.handleConnection.bind(this));
  }

  start(): void {
    this.server.listen(this.port, () => {
      logger.info(`SMPP server listening on port ${this.port}`);
    });

    this.server.on('error', (err) => {
      logger.error(`Server error: ${err.message}`);
    });
  }

  stop(): void {
    this.server.close(() => {
      logger.info('SMPP server stopped');
    });
  }

  private handleConnection(socket: net.Socket): void {
    const sessionId = `${socket.remoteAddress}:${socket.remotePort}`;
    logger.info(`New connection from ${sessionId}`);

    const sessionHandler = new SessionHandler(socket, new PDUProcessor());
    this.sessions.set(sessionId, sessionHandler);

    socket.on('close', () => {
      logger.info(`Connection closed for ${sessionId}`);
      this.sessions.delete(sessionId);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error for ${sessionId}: ${err.message}`);
      this.sessions.delete(sessionId);
    });
  }
}