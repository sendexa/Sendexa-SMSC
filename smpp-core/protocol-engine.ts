export interface DecodedPDU {
  command_length: number;
  command_id: number;
  command_status: number;
  sequence_number: number;
  system_id: string;
  password: string;
  source_addr: string;
  destination_addr: string;
  short_message: string;
  command: string;
}

export interface EncodedPDU {
  command: string;
  sequence_number: number;
  [key: string]: unknown;
}

export class PDUProcessor {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  decode(buffer: Buffer): DecodedPDU {
    // Basic PDU decoding (simplified for example)
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    const commandLength = view.getUint32(0, false);
    const commandId = view.getUint32(4, false);
    const commandStatus = view.getUint32(8, false);
    const sequenceNumber = view.getUint32(12, false);

    let offset = 16;
    let systemId = '';
    let password = '';
    let sourceAddr = '';
    let destinationAddr = '';
    let shortMessage = '';

    // Parse variable length fields based on command_id
    switch (commandId) {
      case 0x00000002: { // bind_transceiver
        systemId = this.readCString(view, offset);
        offset += systemId.length + 1;
        password = this.readCString(view, offset);
        break;
      }
      case 0x00000004: { // submit_sm
        sourceAddr = this.readCString(view, offset);
        offset += sourceAddr.length + 1;
        destinationAddr = this.readCString(view, offset);
        offset += destinationAddr.length + 1;
        const smLength = view.getUint8(offset++);
        shortMessage = this.decoder.decode(buffer.subarray(offset, offset + smLength));
        break;
      }
    }

    return {
      command_length: commandLength,
      command_id: commandId,
      command_status: commandStatus,
      sequence_number: sequenceNumber,
      system_id: systemId,
      password: password,
      source_addr: sourceAddr,
      destination_addr: destinationAddr,
      short_message: shortMessage,
      command: this.getCommandName(commandId)
    };
  }

  encode(pdu: EncodedPDU): Buffer {
    // Basic PDU encoding (simplified for example)
    const buffers: Buffer[] = [];
    
    // Placeholder for command length (will be updated later)
    buffers.push(Buffer.alloc(4));
    
    // Command ID
    const commandId = pdu.command_id as number;
    buffers.push(Buffer.from([
      (commandId >> 24) & 0xFF,
      (commandId >> 16) & 0xFF,
      (commandId >> 8) & 0xFF,
      commandId & 0xFF
    ]));
    
    // Command status
    const commandStatus = pdu.command_status as number;
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
      1: 'bind_receiver',
      2: 'bind_transceiver',
      3: 'bind_transmitter',
      4: 'submit_sm',
      5: 'deliver_sm',
      6: 'unbind',
      7: 'replace_sm',
      8: 'cancel_sm',
      9: 'bind_transceiver_resp',
      11: 'enquire_link',
      12: 'enquire_link_resp',
    };
    return commands[commandId] || 'unknown';
  }
}