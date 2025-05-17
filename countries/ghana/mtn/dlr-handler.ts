import { logger } from '../../../utils/logger';

export class MTNDlrHandler {
  static parse(dlrData: Record<string, unknown>): Record<string, unknown> {
    try {
      // MTN specific DLR format
      const statusMap: Record<string, string> = {
        '1': 'DELIVERED',
        '2': 'BUFFERED',
        '3': 'FAILED',
        '4': 'EXPIRED',
        '5': 'REJECTED'
      };

      const status = statusMap[dlrData.status as string] || 'UNKNOWN';
      const timestamp = dlrData.done_date as string || new Date().toISOString();

      return {
        messageId: dlrData.id,
        status,
        telco: 'mtn',
        timestamp,
        recipient: dlrData.destination_addr,
        submitDate: dlrData.submit_date,
        doneDate: dlrData.done_date,
        errorCode: dlrData.error_code,
        networkCode: dlrData.network_code,
        extra: {
          smscId: dlrData.smsc_id,
          sub: dlrData.sub,
          dlvrd: dlrData.dlvrd
        }
      };
    } catch (error) {
      if (typeof error === 'object' && error && 'message' in error) {
        logger.error(`MTN DLR parsing error: ${(error as { message: string }).message}`);
      } else {
        logger.error('MTN DLR parsing error: Unknown error');
      }
      return {};
    }
  }

  static formatForStorage(dlrData: Record<string, unknown>): Record<string, unknown> {
    return {
      ...this.parse(dlrData),
      _telco: 'mtn',
      _processedAt: new Date()
    };
  }
}