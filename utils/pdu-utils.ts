import { logHelpers } from './logger';

// SMPP PDU Command IDs
export enum CommandId {
  GENERIC_NACK = 0x80000000,
  BIND_RECEIVER = 0x00000001,
  BIND_RECEIVER_RESP = 0x80000001,
  BIND_TRANSMITTER = 0x00000002,
  BIND_TRANSMITTER_RESP = 0x80000002,
  QUERY_SM = 0x00000003,
  QUERY_SM_RESP = 0x80000003,
  SUBMIT_SM = 0x00000004,
  SUBMIT_SM_RESP = 0x80000004,
  DELIVER_SM = 0x00000005,
  DELIVER_SM_RESP = 0x80000005,
  UNBIND = 0x00000006,
  UNBIND_RESP = 0x80000006,
  REPLACE_SM = 0x00000007,
  REPLACE_SM_RESP = 0x80000007,
  CANCEL_SM = 0x00000008,
  CANCEL_SM_RESP = 0x80000008,
  BIND_TRANSCEIVER = 0x00000009,
  BIND_TRANSCEIVER_RESP = 0x80000009,
  OUTBIND = 0x0000000B,
  ENQUIRE_LINK = 0x00000015,
  ENQUIRE_LINK_RESP = 0x80000015,
  SUBMIT_MULTI = 0x00000021,
  SUBMIT_MULTI_RESP = 0x80000021,
  ALERT_NOTIFICATION = 0x00000102,
  DATA_SM = 0x00000103,
  DATA_SM_RESP = 0x80000103
}

// SMPP Command Status Codes
export enum CommandStatus {
  ESME_ROK = 0x00000000,           // No Error
  ESME_RINVMSGLEN = 0x00000001,    // Message Length is invalid
  ESME_RINVCMDLEN = 0x00000002,    // Command Length is invalid
  ESME_RINVCMDID = 0x00000003,     // Invalid Command ID
  ESME_RINVBNDSTS = 0x00000004,    // Incorrect BIND Status for given command
  ESME_RALYBND = 0x00000005,       // ESME Already in Bound State
  ESME_RINVPRTFLG = 0x00000006,    // Invalid Priority Flag
  ESME_RINVREGDLVFLG = 0x00000007, // Invalid Registered Delivery Flag
  ESME_RSYSERR = 0x00000008,       // System Error
  ESME_RINVSRCADR = 0x0000000A,    // Invalid Source Address
  ESME_RINVDSTADR = 0x0000000B,    // Invalid Dest Addr
  ESME_RINVMSGID = 0x0000000C,     // Message ID is invalid
  ESME_RBINDFAIL = 0x0000000D,     // Bind Failed
  ESME_RINVPASWD = 0x0000000E,     // Invalid Password
  ESME_RINVSYSID = 0x0000000F,     // Invalid System ID
  ESME_RINVESMCLASS = 0x00000033,  // Invalid esm_class field data
  ESME_RCNTSUBDL = 0x00000034,     // Cannot Submit to Distribution List
  ESME_RSUBMITFAIL = 0x00000045,   // submit_sm or submit_multi failed
  ESME_RINVSRCTON = 0x00000048,    // Invalid Source address TON
  ESME_RINVSRCNPI = 0x00000049,    // Invalid Source address NPI
  ESME_RINVDSTTON = 0x00000050,    // Invalid Destination address TON
  ESME_RINVDSTNPI = 0x00000051,    // Invalid Destination address NPI
  ESME_RINVSYSTYP = 0x00000053,    // Invalid system_type field
  ESME_RINVREPFLAG = 0x00000054,   // Invalid replace_if_present flag
  ESME_RINVNUMMSGS = 0x00000055,   // Invalid number of messages
  ESME_RTHROTTLED = 0x00000058,    // Throttling error (ESME has exceeded allowed message limits)
  ESME_RINVSCHED = 0x00000061,     // Invalid Scheduled Delivery Time
  ESME_RINVEXPIRY = 0x00000062,    // Invalid message validity period (Expiry time)
  ESME_RINVDFTMSGID = 0x00000063,  // Predefined Message Invalid or Not Found
  ESME_RX_T_APPN = 0x00000064,     // ESME Receiver Temporary App Error Code
  ESME_RX_P_APPN = 0x00000065,     // ESME Receiver Permanent App Error Code
  ESME_RX_R_APPN = 0x00000066,     // ESME Receiver Reject Message Error Code
  ESME_RQUERYFAIL = 0x00000067,    // query_sm request failed
  ESME_RINVOPTPARAMVAL = 0x000000C0, // Invalid Optional Parameter Value
  ESME_RINVOPTPARAMLEN = 0x000000C1, // Invalid Optional Parameter Length
  ESME_RINVOPTPARAMSTREAM = 0x000000C2, // Expected Optional Parameter Missing
  ESME_RINVOPTPARAMTOTLEN = 0x000000C3, // Invalid Optional Parameter Total Length
  ESME_RRETRYFAILED = 0x000000FE,  // Retry Failed
  ESME_RUNKNOWNERR = 0x000000FF    // Unknown Error
}

// SMPP TON (Type of Number) values
export enum TON {
  UNKNOWN = 0x00,
  INTERNATIONAL = 0x01,
  NATIONAL = 0x02,
  NETWORK_SPECIFIC = 0x03,
  SUBSCRIBER_NUMBER = 0x04,
  ALPHANUMERIC = 0x05,
  ABBREVIATED = 0x06,
  RESERVED = 0x07
}

// SMPP NPI (Numbering Plan Indicator) values
export enum NPI {
  UNKNOWN = 0x00,
  ISDN = 0x01,
  DATA = 0x03,
  TELEX = 0x04,
  LAND_MOBILE = 0x06,
  NATIONAL = 0x08,
  PRIVATE = 0x09,
  ERMES = 0x0A,
  INTERNET = 0x0E,
  WAP = 0x12,
  RESERVED = 0x13
}

// SMPP Data Coding Scheme values
export enum DataCoding {
  DEFAULT = 0x00,
  IA5 = 0x01,
  OCTET_UNSPECIFIED = 0x02,
  LATIN1 = 0x03,
  OCTET_UNSPECIFIED_COMMON = 0x04,
  JIS = 0x05,
  CYRILLIC = 0x06,
  LATIN_HEBREW = 0x07,
  UCS2 = 0x08,
  PICTOGRAM = 0x09,
  ISO_2022_JP = 0x0A,
  EXTENDED_KANJI_JIS = 0x0B,
  KS_C = 0x0C,
  RESERVED = 0x0D
}

// SMPP Message State values
export enum MessageState {
  ENROUTE = 1,
  DELIVERED = 2,
  EXPIRED = 3,
  DELETED = 4,
  UNDELIVERABLE = 5,
  ACCEPTED = 6,
  UNKNOWN = 7,
  REJECTED = 8,
  SKIPPED = 9
}

// Helper function to get command name from command ID
export function getCommandName(commandId: number): string {
  return CommandId[commandId] || 'UNKNOWN';
}

// Helper function to get status description from status code
export function getStatusDescription(statusCode: number): string {
  return CommandStatus[statusCode] || 'UNKNOWN_STATUS';
}

// Helper function to validate PDU length
export function validatePDULength(pdu: Buffer): boolean {
  if (pdu.length < 16) {
    logHelpers.smpp('PDU too short', { length: pdu.length });
    return false;
  }

  const declaredLength = pdu.readUInt32BE(0);
  if (declaredLength !== pdu.length) {
    logHelpers.smpp('PDU length mismatch', {
      declared: declaredLength,
      actual: pdu.length
    });
    return false;
  }

  return true;
}

// Helper function to validate command ID
export function validateCommandId(commandId: number): boolean {
  return Object.values(CommandId).includes(commandId);
}

// Helper function to validate command status
export function validateCommandStatus(status: number): boolean {
  return Object.values(CommandStatus).includes(status);
}

// Helper function to validate TON
export function validateTON(ton: number): boolean {
  return Object.values(TON).includes(ton);
}

// Helper function to validate NPI
export function validateNPI(npi: number): boolean {
  return Object.values(NPI).includes(npi);
}

// Helper function to validate data coding
export function validateDataCoding(coding: number): boolean {
  return Object.values(DataCoding).includes(coding);
}

// Helper function to validate message state
export function validateMessageState(state: number): boolean {
  return Object.values(MessageState).includes(state);
}

// Helper function to format address with TON and NPI
export function formatAddress(address: string, ton: TON, npi: NPI): string {
  return `${ton}:${npi}:${address}`;
}

// Helper function to parse address with TON and NPI
export function parseAddress(formattedAddress: string): { address: string; ton: TON; npi: NPI } {
  const [ton, npi, address] = formattedAddress.split(':');
  return {
    address,
    ton: parseInt(ton) as TON,
    npi: parseInt(npi) as NPI
  };
}

// Helper function to encode message for specific data coding
export function encodeMessage(message: string, dataCoding: DataCoding): Buffer {
  switch (dataCoding) {
    case DataCoding.UCS2:
      return Buffer.from(message, 'ucs2');
    case DataCoding.LATIN1:
      return Buffer.from(message, 'latin1');
    case DataCoding.IA5:
      return Buffer.from(message, 'ascii');
    default:
      return Buffer.from(message, 'utf8');
  }
}

// Helper function to decode message from specific data coding
export function decodeMessage(message: Buffer, dataCoding: DataCoding): string {
  switch (dataCoding) {
    case DataCoding.UCS2:
      return message.toString('ucs2');
    case DataCoding.LATIN1:
      return message.toString('latin1');
    case DataCoding.IA5:
      return message.toString('ascii');
    default:
      return message.toString('utf8');
  }
}
