import { logger } from '../../../utils/logger';

export class GloDlrHandler {
  static parse(dlrData: any): any {
    try {
      // Glo specific DLR format
      const statusMap: Record<string, string> = {
        'D': 'DELIVERED',
        'B': 'BUFFERED',
        'F': 'FAILED',
        'E': 'EXPIRED',
        'R': 'REJECTED'
      };

      const status = statusMap[dlrData.stat] || 'UNKNOWN';
      const timestamp = dlrData.done_date || new Date().toISOString();

      return {
        messageId: dlrData.msg_id,
        status,
        telco: 'glo',
        timestamp,
        recipient: dlrData.to,
        submitDate: dlrData.submit_date,
        doneDate: dlrData.done_date,
        errorCode: dlrData.err_code,
        networkCode: dlrData.net_code,
        extra: {
          smscId: dlrData.smsc_id,
          sub: dlrData.sub,
          dlvrd: dlrData.dlvrd,
          attempt: dlrData.attempt
        }
      };
    } catch (error) {
      logger.error(`Glo DLR parsing error: ${error.message}`);
      return null;
    }
  }

  static formatForStorage(dlrData: any): any {
    return {
      ...this.parse(dlrData),
      _telco: 'glo',
      _processedAt: new Date()
    };
  }
}