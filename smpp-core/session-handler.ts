import { Socket } from 'net';
import { EventEmitter } from 'events';
import { PDUProcessor, DecodedPDU } from './protocol-engine';
import { logHelpers } from '../utils/logger';
import { MTNConfig } from '../countries/ghana/mtn/config';
import { VodafoneConfig } from '../countries/ghana/vodafone/config';
import { AirtelTigoConfig } from '../countries/ghana/airteltigo/config';
import { GloConfig } from '../countries/ghana/glo/config';

export enum SessionState {
  OPEN = 'OPEN',
  BOUND_RX = 'BOUND_RX',
  BOUND_TX = 'BOUND_TX',
  BOUND_TRX = 'BOUND_TRX',
  UNBOUND = 'UNBOUND',
  CLOSED = 'CLOSED'
}

export class SessionHandler extends EventEmitter {
  private socket: Socket;
  private pduProcessor: PDUProcessor;
  private systemId: string = '';
  private password: string = '';
  private state: SessionState = SessionState.OPEN;
  private telco: string = '';
  private enquireLinkTimer: NodeJS.Timeout | null = null;
  private readonly ENQUIRE_LINK_INTERVAL = 30000; // 30 seconds

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
        logHelpers.smpp(`Received PDU: ${pdu.command}`, { 
          sequenceNumber: pdu.sequence_number,
          commandStatus: pdu.command_status
        });
        this.handlePDU(pdu);
      } catch (error) {
        logHelpers.error('Error processing PDU', error as Error);
        this.sendGenericNack();
        this.socket.end();
      }
    });

    this.socket.on('close', () => {
      logHelpers.connection('Connection closed', { 
        systemId: this.systemId,
        telco: this.telco
      });
      this.cleanup();
    });

    this.socket.on('error', (err) => {
      logHelpers.error('Socket error', err);
      this.cleanup();
    });
  }

  private cleanup(): void {
    if (this.enquireLinkTimer) {
      clearInterval(this.enquireLinkTimer);
      this.enquireLinkTimer = null;
    }
    this.state = SessionState.CLOSED;
    this.emit('close');
  }

  private async handlePDU(pdu: DecodedPDU): Promise<void> {
    // Check if the command is allowed in current state
    if (!this.isCommandAllowed(pdu.command)) {
      logHelpers.smpp(`Command ${pdu.command} not allowed in state ${this.state}`, {
        sequenceNumber: pdu.sequence_number,
        currentState: this.state
      });
      this.sendGenericNack();
      return;
    }

    switch (pdu.command) {
      case 'bind_receiver':
        await this.handleBind(pdu, SessionState.BOUND_RX);
        break;
      case 'bind_transmitter':
        await this.handleBind(pdu, SessionState.BOUND_TX);
        break;
      case 'bind_transceiver':
        await this.handleBind(pdu, SessionState.BOUND_TRX);
        break;
      case 'submit_sm':
        await this.handleSubmit(pdu);
        break;
      case 'deliver_sm':
        await this.handleDeliver(pdu);
        break;
      case 'enquire_link':
        await this.handleEnquireLink(pdu);
        break;
      case 'unbind':
        await this.handleUnbind(pdu);
        break;
      default:
        logHelpers.smpp(`Unsupported PDU command: ${pdu.command}`, {
          sequenceNumber: pdu.sequence_number
        });
        this.sendGenericNack();
    }
  }

  private isCommandAllowed(command: string): boolean {
    const allowedCommands: Record<SessionState, string[]> = {
      [SessionState.OPEN]: ['bind_receiver', 'bind_transmitter', 'bind_transceiver'],
      [SessionState.BOUND_RX]: ['deliver_sm', 'enquire_link', 'unbind'],
      [SessionState.BOUND_TX]: ['submit_sm', 'enquire_link', 'unbind'],
      [SessionState.BOUND_TRX]: ['submit_sm', 'deliver_sm', 'enquire_link', 'unbind'],
      [SessionState.UNBOUND]: ['bind_receiver', 'bind_transmitter', 'bind_transceiver'],
      [SessionState.CLOSED]: []
    };

    return allowedCommands[this.state].includes(command);
  }

  private async handleBind(pdu: DecodedPDU, targetState: SessionState): Promise<void> {
    const { system_id, password } = pdu;
    
    const safeSystemId = system_id ?? '';
    const safePassword = password ?? '';
    if (await this.validateCredentials(safeSystemId, safePassword)) {
      this.systemId = safeSystemId;
      this.password = safePassword;
      this.state = targetState;
      this.sendResponse(pdu, `${pdu.command}_resp` as string, { system_id });
      logHelpers.auth(`Successful ${pdu.command}`, {
        systemId: this.systemId,
        telco: this.telco,
        newState: targetState
      });
      
      // Start enquire link timer
      this.startEnquireLinkTimer();
    } else {
      logHelpers.auth(`Bind failed`, {
        systemId: this.systemId,
        reason: 'Invalid credentials'
      });
      this.sendResponse(pdu, `${pdu.command}_resp` as string, { command_status: 0x0000000E }); // Invalid credentials
      this.socket.end();
    }
  }

  private async validateCredentials(systemId: string, password: string): Promise<boolean> {
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
    // Validate message parameters
    if (!this.validateMessageParameters(pdu)) {
      logHelpers.delivery('Invalid message parameters', {
        source: pdu.source_addr,
        destination: pdu.destination_addr,
        messageLength: pdu.short_message?.length
      });
      this.sendResponse(pdu, 'submit_sm_resp', { command_status: 0x0000000E });
      return;
    }

    // Process the submit_sm request
    const messageId = `ID${Date.now()}${Math.floor(Math.random() * 1000)}`;
    this.sendResponse(pdu, 'submit_sm_resp', { message_id: messageId });

    // Queue the message for delivery
    if (pdu.source_addr && pdu.destination_addr && pdu.short_message) {
      logHelpers.delivery('Message queued for delivery', {
        messageId,
        source: pdu.source_addr,
        destination: pdu.destination_addr,
        telco: this.telco,
        dataCoding: pdu.data_coding,
        registeredDelivery: pdu.registered_delivery
      });

      this.emit('message', {
        telco: this.telco,
        source: pdu.source_addr,
        destination: pdu.destination_addr,
        message: pdu.short_message,
        messageId,
        dataCoding: pdu.data_coding,
        registeredDelivery: pdu.registered_delivery
      });
    }
  }

  private validateMessageParameters(pdu: DecodedPDU): boolean {
    if (!pdu.source_addr || !pdu.destination_addr || !pdu.short_message) {
      return false;
    }

    // Validate source address format
    if (!this.isValidAddress(pdu.source_addr)) {
      return false;
    }

    // Validate destination address format
    if (!this.isValidAddress(pdu.destination_addr)) {
      return false;
    }

    // Validate message length
    if (pdu.short_message.length > 160) {
      return false;
    }

    return true;
  }

  private isValidAddress(address: string): boolean {
    // Basic validation - can be enhanced based on requirements
    return /^[0-9]{1,15}$/.test(address);
  }

  private async handleDeliver(pdu: DecodedPDU): Promise<void> {
    // Process delivery report
    const messageId = `ID${Date.now()}${Math.floor(Math.random() * 1000)}`;
    this.sendResponse(pdu, 'deliver_sm_resp', { message_id: messageId });

    logHelpers.delivery('Received delivery report', {
      messageId: pdu.message_id,
      status: pdu.message_state,
      errorCode: pdu.error_code,
      telco: this.telco
    });

    // Emit delivery report event
    this.emit('delivery_report', {
      telco: this.telco,
      messageId: pdu.message_id,
      status: pdu.message_state,
      errorCode: pdu.error_code
    });
  }

  private async handleEnquireLink(pdu: DecodedPDU): Promise<void> {
    logHelpers.smpp('Received enquire link', {
      sequenceNumber: pdu.sequence_number
    });
    this.sendResponse(pdu, 'enquire_link_resp');
  }

  private async handleUnbind(pdu: DecodedPDU): Promise<void> {
    logHelpers.connection('Unbind request received', {
      systemId: this.systemId,
      telco: this.telco
    });
    this.sendResponse(pdu, 'unbind_resp');
    this.state = SessionState.UNBOUND;
    this.socket.end();
  }

  private startEnquireLinkTimer(): void {
    if (this.enquireLinkTimer) {
      clearInterval(this.enquireLinkTimer);
    }

    this.enquireLinkTimer = setInterval(() => {
      if (this.state !== SessionState.CLOSED) {
        this.sendEnquireLink();
      }
    }, this.ENQUIRE_LINK_INTERVAL);
  }

  private sendEnquireLink(): void {
    const pdu: DecodedPDU = {
      command_length: 16,
      command_id: 0x00000015,
      command_status: 0,
      sequence_number: Math.floor(Math.random() * 0x7FFFFFFF),
      command: 'enquire_link'
    };
    logHelpers.smpp('Sending enquire link', {
      sequenceNumber: pdu.sequence_number
    });
    this.sendResponse(pdu, 'enquire_link');
  }

  private sendGenericNack(): void {
    const pdu: DecodedPDU = {
      command_length: 16,
      command_id: 0x80000000,
      command_status: 0x0000000E,
      sequence_number: 0,
      command: 'generic_nack'
    };
    logHelpers.smpp('Sending generic nack', {
      sequenceNumber: pdu.sequence_number
    });
    this.sendResponse(pdu, 'generic_nack');
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