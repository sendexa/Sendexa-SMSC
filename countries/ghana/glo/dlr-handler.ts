import { logger } from '../../../utils/logger';

export class GloDlrHandler {
  static parse(dlrData: Record<string, unknown>): Record<string, unknown> {
    try {
      // Glo specific DLR format
      const statusMap: Record<string, string> = {
        'D': 'DELIVERED',
        'B': 'BUFFERED',
        'F': 'FAILED',
        'E': 'EXPIRED',
        'R': 'REJECTED'
      };

      const status = statusMap[dlrData.stat as string] || 'UNKNOWN';
      const timestamp = dlrData.done_date as string || new Date().toISOString();

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
      if (typeof error === 'object' && error && 'message' in error) {
        logger.error(`Glo DLR parsing error: ${(error as { message: string }).message}`);
      } else {
        logger.error('Glo DLR parsing error: Unknown error');
      }
      return {};
    }
  }

  static formatForStorage(dlrData: Record<string, unknown>): Record<string, unknown> {
    return {
      ...this.parse(dlrData),
      _telco: 'glo',
      _processedAt: new Date()
    };
  }
}