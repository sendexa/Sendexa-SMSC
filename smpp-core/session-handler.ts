import { Socket } from 'net';
import { EventEmitter } from 'events';
import { PDUProcessor, DecodedPDU } from './protocol-engine';
import { logger } from '../utils/logger';
import { MTNConfig } from '../countries/ghana/mtn/config';
import { VodafoneConfig } from '../countries/ghana/vodafone/config';
import { AirtelTigoConfig } from '../countries/ghana/airteltigo/config';
import { GloConfig } from '../countries/ghana/glo/config';

export class SessionHandler extends EventEmitter {
  private socket: Socket;
  private pduProcessor: PDUProcessor;
  private systemId: string = '';
  private password: string = '';
  private bound: boolean = false;
  private telco: string = '';

  constructor(socket: Socket, pduProcessor: PDUProcessor) {
    super();
    this.socket = socket;
    this.pduProcessor = pduProcessor;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.socket.on('data', (data) => {
      try {
        const pdu = this.pduProcessor.decode(data);
        this.handlePDU(pdu);
      } catch (error) {
        logger.error(`Error processing PDU: ${(error instanceof Error ? error.message : String(error))}`);
        this.socket.end();
      }
    });
  }

  private async handlePDU(pdu: DecodedPDU): Promise<void> {
    switch (pdu.command) {
      case 'bind_transceiver':
        await this.handleBind(pdu);
        break;
      case 'submit_sm':
        await this.handleSubmit(pdu);
        break;
      case 'enquire_link':
        await this.handleEnquireLink(pdu);
        break;
      case 'unbind':
        await this.handleUnbind(pdu);
        break;
      default:
        logger.warn(`Unsupported PDU command: ${pdu.command}`);
        this.sendResponse(pdu, 'generic_nack');
    }
  }

  private async handleBind(pdu: DecodedPDU): Promise<void> {
    const { system_id, password } = pdu;
    
    // Validate credentials against telco configurations
    if (await this.validateCredentials(system_id, password)) {
      this.systemId = system_id;
      this.password = password;
      this.bound = true;
      this.sendResponse(pdu, 'bind_transceiver_resp', { system_id });
      logger.info(`Successful bind for system_id: ${system_id}`);
    } else {
      logger.warn(`Bind failed for system_id: ${system_id}`);
      this.sendResponse(pdu, 'bind_transceiver_resp', { command_status: 0x0000000E }); // Invalid credentials
      this.socket.end();
    }
  }

  private async validateCredentials(systemId: string, password: string): Promise<boolean> {
    // Check against all telco configurations
    const telcos = {
      mtn: MTNConfig,
      vodafone: VodafoneConfig,
      airteltigo: AirtelTigoConfig,
      glo: GloConfig
    };

    for (const [telcoName, config] of Object.entries(telcos)) {
      if (systemId === config.systemId && password === config.password) {
        this.telco = telcoName;
        return true;
      }
    }

    return false;
  }

  private async handleSubmit(pdu: DecodedPDU): Promise<void> {
    if (!this.bound) {
      this.sendResponse(pdu, 'submit_sm_resp', { command_status: 0x0000000E });
      return;
    }

    // Process the submit_sm request
    const messageId = `ID${Date.now()}${Math.floor(Math.random() * 1000)}`;
    this.sendResponse(pdu, 'submit_sm_resp', { message_id: messageId });

    // Queue the message for delivery
    this.emit('message', {
      telco: this.telco,
      source: pdu.source_addr,
      destination: pdu.destination_addr,
      message: pdu.short_message,
      messageId
    });
  }

  private async handleEnquireLink(pdu: DecodedPDU): Promise<void> {
    this.sendResponse(pdu, 'enquire_link_resp');
  }

  private async handleUnbind(pdu: DecodedPDU): Promise<void> {
    this.sendResponse(pdu, 'unbind_resp');
    this.socket.end();
  }

  private sendResponse(originalPdu: DecodedPDU, command: string, options: Record<string, unknown> = {}): void {
    const response = this.pduProcessor.encode({
      command,
      sequence_number: originalPdu.sequence_number,
      ...options
    });
    this.socket.write(response);
  }
}