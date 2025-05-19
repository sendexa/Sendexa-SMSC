import net from 'net';
import { EventEmitter } from 'events';
import { PDUProcessor, DecodedPDU } from './protocol-engine';
import { logger } from '../utils/logger';

interface SmppClientConfig {
  host: string;
  port: number;
  systemId: string;
  password: string;
}

interface MessageSubmitOptions {
  source: string;
  destination: string;
  message: string;
  messageId: string;
  dataCoding: number;
  registeredDelivery: number;
}

interface MessageSubmitResult {
  messageId: string;
  status: number;
}

export class SmppClient extends EventEmitter {
  private socket: net.Socket | null = null;
  private pduProcessor: PDUProcessor;
  private config: SmppClientConfig;
  private connected: boolean = false;
  private sequenceNumber: number = 0;
  private pendingResponses: Map<number, (response: DecodedPDU) => void> = new Map();

  constructor(config: SmppClientConfig) {
    super();
    this.config = config;
    this.pduProcessor = new PDUProcessor();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();

      this.socket.on('connect', async () => {
        try {
          await this.bind();
          this.connected = true;
          this.startEnquireLinkTimer();
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      this.socket.on('data', (data) => {
        try {
          const pdu = this.pduProcessor.decode(data);
          this.handlePDU(pdu);
        } catch (error) {
          logger.error(`Error processing PDU: ${error instanceof Error ? error.message : String(error)}`);
        }
      });

      this.socket.on('error', (error) => {
        logger.error(`Socket error: ${error.message}`);
        this.cleanup();
        this.emit('error', error);
      });

      this.socket.on('close', () => {
        this.cleanup();
        this.emit('close');
      });

      this.socket.connect(this.config.port, this.config.host);
    });
  }

  async disconnect(): Promise<void> {
    if (!this.socket || !this.connected) {
      return;
    }

    try {
      await this.unbind();
    } catch (error) {
      logger.error(`Error during unbind: ${error instanceof Error ? error.message : String(error)}`);
    }

    this.socket.end();
    this.cleanup();
  }

  isConnected(): boolean {
    return this.connected;
  }

  async submitMessage(options: MessageSubmitOptions): Promise<MessageSubmitResult> {
    if (!this.socket || !this.connected) {
      throw new Error('Not connected to SMSC');
    }

    const sequenceNumber = this.getNextSequenceNumber();
    const pdu = {
      command: 'submit_sm',
      sequence_number: sequenceNumber,
      source_addr: options.source,
      destination_addr: options.destination,
      short_message: options.message,
      data_coding: options.dataCoding,
      registered_delivery: options.registeredDelivery
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingResponses.delete(sequenceNumber);
        reject(new Error('Submit SM timeout'));
      }, 30000); // 30 second timeout

      this.pendingResponses.set(sequenceNumber, (response) => {
        clearTimeout(timeout);
        this.pendingResponses.delete(sequenceNumber);

        if (response.command_status !== 0) {
          reject(new Error(`Submit SM failed with status: ${response.command_status}`));
          return;
        }

        resolve({
          messageId: response.message_id || options.messageId,
          status: response.command_status
        });
      });

      const encodedPdu = this.pduProcessor.encode(pdu);
      this.socket!.write(encodedPdu);
    });
  }

  private async bind(): Promise<void> {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    const sequenceNumber = this.getNextSequenceNumber();
    const pdu = {
      command: 'bind_transceiver',
      sequence_number: sequenceNumber,
      system_id: this.config.systemId,
      password: this.config.password
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingResponses.delete(sequenceNumber);
        reject(new Error('Bind timeout'));
      }, 30000); // 30 second timeout

      this.pendingResponses.set(sequenceNumber, (response) => {
        clearTimeout(timeout);
        this.pendingResponses.delete(sequenceNumber);

        if (response.command_status !== 0) {
          reject(new Error(`Bind failed with status: ${response.command_status}`));
          return;
        }

        resolve();
      });

      const encodedPdu = this.pduProcessor.encode(pdu);
      this.socket!.write(encodedPdu);
    });
  }

  private async unbind(): Promise<void> {
    if (!this.socket || !this.connected) {
      return;
    }

    const sequenceNumber = this.getNextSequenceNumber();
    const pdu = {
      command: 'unbind',
      sequence_number: sequenceNumber
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingResponses.delete(sequenceNumber);
        reject(new Error('Unbind timeout'));
      }, 30000); // 30 second timeout

      this.pendingResponses.set(sequenceNumber, (response) => {
        clearTimeout(timeout);
        this.pendingResponses.delete(sequenceNumber);

        if (response.command_status !== 0) {
          reject(new Error(`Unbind failed with status: ${response.command_status}`));
          return;
        }

        resolve();
      });

      const encodedPdu = this.pduProcessor.encode(pdu);
      this.socket!.write(encodedPdu);
    });
  }

  private handlePDU(pdu: DecodedPDU): void {
    // Handle enquire link
    if (pdu.command === 'enquire_link') {
      this.sendResponse(pdu, 'enquire_link_resp');
      return;
    }

    // Handle delivery reports
    if (pdu.command === 'deliver_sm') {
      this.sendResponse(pdu, 'deliver_sm_resp');
      this.emit('delivery_report', {
        messageId: pdu.message_id,
        status: pdu.message_state,
        errorCode: pdu.error_code
      });
      return;
    }

    // Handle pending responses
    const pendingResponse = this.pendingResponses.get(pdu.sequence_number);
    if (pendingResponse) {
      pendingResponse(pdu);
    }
  }

  private sendResponse(originalPdu: DecodedPDU, command: string, options: Record<string, unknown> = {}): void {
    if (!this.socket) {
      return;
    }

    const response = this.pduProcessor.encode({
      command,
      sequence_number: originalPdu.sequence_number,
      ...options
    });
    this.socket.write(response);
  }

  private getNextSequenceNumber(): number {
    this.sequenceNumber = (this.sequenceNumber + 1) % 0x7FFFFFFF;
    return this.sequenceNumber;
  }

  private startEnquireLinkTimer(): void {
    setInterval(() => {
      if (this.socket && this.connected) {
        const pdu = {
          command: 'enquire_link',
          sequence_number: this.getNextSequenceNumber()
        };
        const encodedPdu = this.pduProcessor.encode(pdu);
        this.socket!.write(encodedPdu);
      }
    }, 30000); // 30 seconds
  }

  private cleanup(): void {
    this.connected = false;
    this.pendingResponses.clear();
    this.socket = null;
  }
} 