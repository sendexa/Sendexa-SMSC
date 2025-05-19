export interface DecodedPDU {
  command_length: number;
  command_id: number;
  command_status: number;
  sequence_number: number;
  system_id?: string;
  password?: string;
  source_addr?: string;
  destination_addr?: string;
  short_message?: string;
  command: string;
  interface_version?: number;
  addr_ton?: number;
  addr_npi?: number;
  dest_addr_ton?: number;
  dest_addr_npi?: number;
  esm_class?: number;
  protocol_id?: number;
  priority_flag?: number;
  schedule_delivery_time?: string;
  validity_period?: string;
  registered_delivery?: number;
  replace_if_present_flag?: number;
  data_coding?: number;
  sm_default_msg_id?: number;
  message_id?: string;
  message_state?: number;
  error_code?: number;
  service_type?: string;
  [key: string]: unknown;
}

export interface EncodedPDU {
  command: string;
  sequence_number: number;
  command_id?: number;
  command_status?: number;
  [key: string]: unknown;
}

export class PDUProcessor {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  private readonly COMMAND_IDS = {
    BIND_RECEIVER: 0x00000001,
    BIND_TRANSMITTER: 0x00000002,
    BIND_TRANSCEIVER: 0x00000009,
    BIND_RECEIVER_RESP: 0x80000001,
    BIND_TRANSMITTER_RESP: 0x80000002,
    BIND_TRANSCEIVER_RESP: 0x80000009,
    UNBIND: 0x00000006,
    UNBIND_RESP: 0x80000006,
    SUBMIT_SM: 0x00000004,
    SUBMIT_SM_RESP: 0x80000004,
    DELIVER_SM: 0x00000005,
    DELIVER_SM_RESP: 0x80000005,
    ENQUIRE_LINK: 0x00000015,
    ENQUIRE_LINK_RESP: 0x80000015,
    GENERIC_NACK: 0x80000000
  };

  decode(buffer: Buffer): DecodedPDU {
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    let offset = 0;

    const commandLength = view.getUint32(offset, false);
    offset += 4;

    const commandId = view.getUint32(offset, false);
    offset += 4;

    const commandStatus = view.getUint32(offset, false);
    offset += 4;

    const sequenceNumber = view.getUint32(offset, false);
    offset += 4;

    const pdu: DecodedPDU = {
      command_length: commandLength,
      command_id: commandId,
      command_status: commandStatus,
      sequence_number: sequenceNumber,
      command: this.getCommandName(commandId)
    };

    // Parse variable length fields based on command_id
    switch (commandId) {
      case this.COMMAND_IDS.BIND_RECEIVER:
      case this.COMMAND_IDS.BIND_TRANSMITTER:
      case this.COMMAND_IDS.BIND_TRANSCEIVER:
        pdu.system_id = this.readCString(view, offset);
        offset += pdu.system_id.length + 1;
        pdu.password = this.readCString(view, offset);
        offset += pdu.password.length + 1;
        pdu.interface_version = view.getUint8(offset++);
        pdu.addr_ton = view.getUint8(offset++);
        pdu.addr_npi = view.getUint8(offset++);
        pdu.source_addr = this.readCString(view, offset);
        break;

      case this.COMMAND_IDS.SUBMIT_SM: {
        pdu.service_type = this.readCString(view, offset);
        offset += pdu.service_type.length + 1;
        pdu.source_addr_ton = view.getUint8(offset++);
        pdu.source_addr_npi = view.getUint8(offset++);
        pdu.source_addr = this.readCString(view, offset);
        offset += pdu.source_addr.length + 1;
        pdu.dest_addr_ton = view.getUint8(offset++);
        pdu.dest_addr_npi = view.getUint8(offset++);
        pdu.destination_addr = this.readCString(view, offset);
        offset += pdu.destination_addr.length + 1;
        pdu.esm_class = view.getUint8(offset++);
        pdu.protocol_id = view.getUint8(offset++);
        pdu.priority_flag = view.getUint8(offset++);
        pdu.schedule_delivery_time = this.readCString(view, offset);
        offset += pdu.schedule_delivery_time.length + 1;
        pdu.validity_period = this.readCString(view, offset);
        offset += pdu.validity_period.length + 1;
        pdu.registered_delivery = view.getUint8(offset++);
        pdu.replace_if_present_flag = view.getUint8(offset++);
        pdu.data_coding = view.getUint8(offset++);
        pdu.sm_default_msg_id = view.getUint8(offset++);
        const smLength = view.getUint8(offset++);
        pdu.short_message = this.decoder.decode(buffer.subarray(offset, offset + smLength));
        break;
      }

      case this.COMMAND_IDS.DELIVER_SM: {
        // Similar to SUBMIT_SM but for delivery reports
        pdu.service_type = this.readCString(view, offset);
        offset += pdu.service_type.length + 1;
        pdu.source_addr_ton = view.getUint8(offset++);
        pdu.source_addr_npi = view.getUint8(offset++);
        pdu.source_addr = this.readCString(view, offset);
        offset += pdu.source_addr.length + 1;
        pdu.dest_addr_ton = view.getUint8(offset++);
        pdu.dest_addr_npi = view.getUint8(offset++);
        pdu.destination_addr = this.readCString(view, offset);
        offset += pdu.destination_addr.length + 1;
        pdu.esm_class = view.getUint8(offset++);
        pdu.protocol_id = view.getUint8(offset++);
        pdu.priority_flag = view.getUint8(offset++);
        pdu.registered_delivery = view.getUint8(offset++);
        pdu.data_coding = view.getUint8(offset++);
        const dlrLength = view.getUint8(offset++);
        pdu.short_message = this.decoder.decode(buffer.subarray(offset, offset + dlrLength));
        break;
      }
    }

    return pdu;
  }

  encode(pdu: EncodedPDU): Buffer {
    const buffers: Buffer[] = [];
    
    // Placeholder for command length
    buffers.push(Buffer.alloc(4));
    
    // Command ID
    const commandId = this.getCommandId(pdu.command);
    buffers.push(Buffer.from([
      (commandId >> 24) & 0xFF,
      (commandId >> 16) & 0xFF,
      (commandId >> 8) & 0xFF,
      commandId & 0xFF
    ]));
    
    // Command status
    const commandStatus = pdu.command_status || 0;
    buffers.push(Buffer.from([
      (commandStatus >> 24) & 0xFF,
      (commandStatus >> 16) & 0xFF,
      (commandStatus >> 8) & 0xFF,
      commandStatus & 0xFF
    ]));
    
    // Sequence number
    buffers.push(Buffer.from([
      (pdu.sequence_number >> 24) & 0xFF,
      (pdu.sequence_number >> 16) & 0xFF,
      (pdu.sequence_number >> 8) & 0xFF,
      pdu.sequence_number & 0xFF
    ]));
    
    // Variable parts based on command
    switch (pdu.command) {
      case 'bind_transceiver_resp':
        buffers.push(Buffer.from(pdu.system_id + '\0', 'ascii'));
        break;
      case 'submit_sm_resp':
        buffers.push(Buffer.from(pdu.message_id + '\0', 'ascii'));
        break;
      case 'deliver_sm_resp':
        buffers.push(Buffer.from(pdu.message_id + '\0', 'ascii'));
        break;
    }
    
    // Combine all buffers
    const result = Buffer.concat(buffers);
    
    // Update command length
    result.writeUInt32BE(result.length, 0);
    
    return result;
  }

  private readCString(view: DataView, offset: number): string {
    let str = '';
    while (true) {
      const char = view.getUint8(offset++);
      if (char === 0) break;
      str += String.fromCharCode(char);
    }
    return str;
  }

  private getCommandName(commandId: number): string {
    const commands: Record<number, string> = {
      [this.COMMAND_IDS.BIND_RECEIVER]: 'bind_receiver',
      [this.COMMAND_IDS.BIND_TRANSMITTER]: 'bind_transmitter',
      [this.COMMAND_IDS.BIND_TRANSCEIVER]: 'bind_transceiver',
      [this.COMMAND_IDS.BIND_RECEIVER_RESP]: 'bind_receiver_resp',
      [this.COMMAND_IDS.BIND_TRANSMITTER_RESP]: 'bind_transmitter_resp',
      [this.COMMAND_IDS.BIND_TRANSCEIVER_RESP]: 'bind_transceiver_resp',
      [this.COMMAND_IDS.UNBIND]: 'unbind',
      [this.COMMAND_IDS.UNBIND_RESP]: 'unbind_resp',
      [this.COMMAND_IDS.SUBMIT_SM]: 'submit_sm',
      [this.COMMAND_IDS.SUBMIT_SM_RESP]: 'submit_sm_resp',
      [this.COMMAND_IDS.DELIVER_SM]: 'deliver_sm',
      [this.COMMAND_IDS.DELIVER_SM_RESP]: 'deliver_sm_resp',
      [this.COMMAND_IDS.ENQUIRE_LINK]: 'enquire_link',
      [this.COMMAND_IDS.ENQUIRE_LINK_RESP]: 'enquire_link_resp',
      [this.COMMAND_IDS.GENERIC_NACK]: 'generic_nack'
    };
    return commands[commandId] || 'unknown';
  }

  private getCommandId(commandName: string): number {
    const commandIds: Record<string, number> = {
      'bind_receiver': this.COMMAND_IDS.BIND_RECEIVER,
      'bind_transmitter': this.COMMAND_IDS.BIND_TRANSMITTER,
      'bind_transceiver': this.COMMAND_IDS.BIND_TRANSCEIVER,
      'bind_receiver_resp': this.COMMAND_IDS.BIND_RECEIVER_RESP,
      'bind_transmitter_resp': this.COMMAND_IDS.BIND_TRANSMITTER_RESP,
      'bind_transceiver_resp': this.COMMAND_IDS.BIND_TRANSCEIVER_RESP,
      'unbind': this.COMMAND_IDS.UNBIND,
      'unbind_resp': this.COMMAND_IDS.UNBIND_RESP,
      'submit_sm': this.COMMAND_IDS.SUBMIT_SM,
      'submit_sm_resp': this.COMMAND_IDS.SUBMIT_SM_RESP,
      'deliver_sm': this.COMMAND_IDS.DELIVER_SM,
      'deliver_sm_resp': this.COMMAND_IDS.DELIVER_SM_RESP,
      'enquire_link': this.COMMAND_IDS.ENQUIRE_LINK,
      'enquire_link_resp': this.COMMAND_IDS.ENQUIRE_LINK_RESP,
      'generic_nack': this.COMMAND_IDS.GENERIC_NACK
    };
    return commandIds[commandName] || 0;
  }
}