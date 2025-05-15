import { logger } from '../../../utils/logger';

export class AirtelTigoDlrHandler {
  static parse(dlrData: any): any {
    try {
      // AirtelTigo specific DLR format
      const statusMap: Record<string, string> = {
        'DELIVRD': 'DELIVERED',
        'BUFFERED': 'BUFFERED',
        'FAILED': 'FAILED',
        'EXPIRED': 'EXPIRED',
        'REJECTD': 'REJECTED'
      };

      const status = statusMap[dlrData.status] || 'UNKNOWN';
      const timestamp = dlrData.done_date || new Date().toISOString();

      return {
        messageId: dlrData.message_id,
        status,
        telco: 'airteltigo',
        timestamp,
        recipient: dlrData.destination_addr,
        submitDate: dlrData.submit_date,
        doneDate: dlrData.done_date,
        errorCode: dlrData.error_code,
        networkCode: dlrData.network_code,
        extra: {
          smscId: dlrData.smsc_id,
          sub: dlrData.sub,
          dlvrd: dlrData.dlvrd,
          text: dlrData.text
        }
      };
    } catch (error) {
      logger.error(`AirtelTigo DLR parsing error: ${error.message}`);
      return null;
    }
  }

  static formatForStorage(dlrData: any): any {
    return {
      ...this.parse(dlrData),
      _telco: 'airteltigo',
      _processedAt: new Date()
    };
  }
}