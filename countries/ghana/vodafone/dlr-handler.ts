import { logger } from '../../../utils/logger';

export class VodafoneDlrHandler {
  static parse(dlrData: Record<string, unknown>): Record<string, unknown> {
    try {
      // Vodafone specific DLR format
      const statusMap: Record<string, string> = {
        '0': 'DELIVERED',
        '1': 'BUFFERED',
        '2': 'FAILED',
        '3': 'EXPIRED',
        '4': 'REJECTED'
      };

      const status = statusMap[dlrData.stat as string] || 'UNKNOWN';
      const timestamp = dlrData.done_date as string || new Date().toISOString();

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
      if (typeof error === 'object' && error && 'message' in error) {
        logger.error(`Vodafone DLR parsing error: ${(error as { message: string }).message}`);
      } else {
        logger.error('Vodafone DLR parsing error: Unknown error');
      }
      return {};
    }
  }

  static formatForStorage(dlrData: Record<string, unknown>): Record<string, unknown> {
    return {
      ...this.parse(dlrData),
      _telco: 'vodafone',
      _processedAt: new Date()
    };
  }
}