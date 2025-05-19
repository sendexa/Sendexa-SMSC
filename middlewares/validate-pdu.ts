import { DecodedPDU } from '../smpp-core/protocol-engine';
import { logHelpers } from '../utils/logger';
import { validatePDULength, validateCommandId, validateCommandStatus, CommandStatus } from '../utils/pdu-utils';
import { validateTON, validateNPI, validateDataCoding } from '../utils/pdu-utils';

export interface ValidationResult {
  isValid: boolean;
  errorCode?: number;
  errorMessage?: string;
}

export class PDUValidationMiddleware {
  /**
   * Validate a PDU
   * @param pdu The PDU to validate
   * @returns ValidationResult object
   */
  public static validate(pdu: DecodedPDU): ValidationResult {
    try {
      // Validate command ID
      if (!validateCommandId(pdu.command_id)) {
        return {
          isValid: false,
          errorCode: CommandStatus.ESME_RINVCMDID,
          errorMessage: 'Invalid command ID'
        };
      }

      // Validate command status
      if (!validateCommandStatus(pdu.command_status)) {
        return {
          isValid: false,
          errorCode: CommandStatus.ESME_RINVCMDLEN,
          errorMessage: 'Invalid command status'
        };
      }

      // Validate source address TON and NPI if present
      if (
        typeof pdu.source_addr_ton === 'number' &&
        !validateTON(pdu.source_addr_ton)
      ) {
        return {
          isValid: false,
          errorCode: CommandStatus.ESME_RINVSRCTON,
          errorMessage: 'Invalid source address TON'
        };
      }

      if (
        typeof pdu.source_addr_npi === 'number' &&
        !validateNPI(pdu.source_addr_npi)
      ) {
        return {
          isValid: false,
          errorCode: CommandStatus.ESME_RINVSRCNPI,
          errorMessage: 'Invalid source address NPI'
        };
      }

      // Validate destination address TON and NPI if present
      if (
        typeof pdu.dest_addr_ton === 'number' &&
        !validateTON(pdu.dest_addr_ton)
      ) {
        return {
          isValid: false,
          errorCode: CommandStatus.ESME_RINVDSTTON,
          errorMessage: 'Invalid destination address TON'
        };
      }

      if (
        typeof pdu.dest_addr_npi === 'number' &&
        !validateNPI(pdu.dest_addr_npi)
      ) {
        return {
          isValid: false,
          errorCode: CommandStatus.ESME_RINVDSTNPI,
          errorMessage: 'Invalid destination address NPI'
        };
      }

      // Validate data coding if present
      if (pdu.data_coding !== undefined && !validateDataCoding(pdu.data_coding)) {
        return {
          isValid: false,
          errorCode: CommandStatus.ESME_RINVOPTPARAMVAL,
          errorMessage: 'Invalid data coding'
        };
      }

      // Validate message length if present
      if (pdu.short_message && pdu.short_message.length > 254) {
        return {
          isValid: false,
          errorCode: CommandStatus.ESME_RINVMSGLEN,
          errorMessage: 'Message too long'
        };
      }

      // Log successful validation
      logHelpers.smpp('PDU validation successful', {
        command: pdu.command,
        sequenceNumber: pdu.sequence_number
      });

      return { isValid: true };
    } catch (error) {
      logHelpers.error('Error validating PDU', error as Error);
      return {
        isValid: false,
        errorCode: CommandStatus.ESME_RSYSERR,
        errorMessage: 'System error during validation'
      };
    }
  }

  /**
   * Validate a raw PDU buffer
   * @param pduBuffer The raw PDU buffer to validate
   * @returns ValidationResult object
   */
  public static validateRawPDU(pduBuffer: Buffer): ValidationResult {
    try {
      if (!validatePDULength(pduBuffer)) {
        return {
          isValid: false,
          errorCode: CommandStatus.ESME_RINVCMDLEN,
          errorMessage: 'Invalid PDU length'
        };
      }

      return { isValid: true };
    } catch (error) {
      logHelpers.error('Error validating raw PDU', error as Error);
      return {
        isValid: false,
        errorCode: CommandStatus.ESME_RSYSERR,
        errorMessage: 'System error during validation'
      };
    }
  }
}
