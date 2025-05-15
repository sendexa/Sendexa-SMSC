import { logger } from '../../../utils/logger';

export class VodafoneDlrHandler {
  static parse(dlrData: any): any {
    try {
      // Vodafone specific DLR format
      const statusMap: Record<string, string> = {
        '0': 'DELIVERED',
        '1': 'BUFFERED',
        '2': 'FAILED',
        '3': 'EXPIRED',
        '4': 'REJECTED'
      };

      const status = statusMap[dlrData.stat] || 'UNKNOWN';
      const timestamp = dlrData.done_date || new Date().toISOString();

      return {
        messageId: dlrData.msgid,
        status,
        telco: 'vodafone',
        timestamp,
        recipient: dlrData.to,
        submitDate: dlrData.submit_date,
        doneDate: dlrData.done_date,
        errorCode: dlrData.err,
        networkCode: dlrData.network,
        extra: {
          smscId: dlrData.smscid,
          sub: dlrData.sub,
          dlvrd: dlrData.dlvrd
        }
      };
    } catch (error) {
      logger.error(`Vodafone DLR parsing error: ${error.message}`);
      return null;
    }
  }

  static formatForStorage(dlrData: any): any {
    return {
      ...this.parse(dlrData),
      _telco: 'vodafone',
      _processedAt: new Date()
    };
  }
}