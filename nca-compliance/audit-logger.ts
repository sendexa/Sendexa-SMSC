import { createLogger, format, transports } from 'winston';
import { join } from 'path';
//import { logHelpers } from '../utils/logger';

export interface AuditLogEntry {
  timestamp: string;
  eventType: string;
  userId?: string;
  systemId?: string;
  ipAddress?: string;
  action: string;
  details: Record<string, unknown>;
  status: 'success' | 'failure';
  errorMessage?: string;
}

export class NCAAuditLogger {
  private static instance: NCAAuditLogger;
  private logger: import('winston').Logger;

  private constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
      defaultMeta: { service: 'nca-audit' },
      transports: [
        // Daily rotating file for audit logs
        new transports.DailyRotateFile({
          filename: join('logs', 'nca-audit-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: format.combine(
            format.timestamp(),
            format.json()
          )
        }),
        // Separate file for security events
        new transports.DailyRotateFile({
          filename: join('logs', 'nca-security-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: format.combine(
            format.timestamp(),
            format.json()
          )
        })
      ]
    });



    // Add console transport in development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        )
      }));
    }
  }

  public static getInstance(): NCAAuditLogger {
    if (!NCAAuditLogger.instance) {
      NCAAuditLogger.instance = new NCAAuditLogger();
    }
    return NCAAuditLogger.instance;
  }

  /**
   * Log an authentication event
   */
  public logAuthEvent(entry: Omit<AuditLogEntry, 'eventType'>): void {
    this.logger.info({
      ...entry,
      eventType: 'AUTHENTICATION'
    });
  }

  /**
   * Log a message submission event
   */
  public logMessageSubmission(entry: Omit<AuditLogEntry, 'eventType'>): void {
    this.logger.info({
      ...entry,
      eventType: 'MESSAGE_SUBMISSION'
    });
  }

  /**
   * Log a message delivery event
   */
  public logMessageDelivery(entry: Omit<AuditLogEntry, 'eventType'>): void {
    this.logger.info({
      ...entry,
      eventType: 'MESSAGE_DELIVERY'
    });
  }

  /**
   * Log a system configuration change
   */
  public logConfigChange(entry: Omit<AuditLogEntry, 'eventType'>): void {
    this.logger.info({
      ...entry,
      eventType: 'CONFIG_CHANGE'
    });
  }

  /**
   * Log a security event
   */
  public logSecurityEvent(entry: Omit<AuditLogEntry, 'eventType'>): void {
    this.logger.warn({
      ...entry,
      eventType: 'SECURITY'
    });
  }

  /**
   * Log a DND (Do Not Disturb) list update
   */
  public logDNDUpdate(entry: Omit<AuditLogEntry, 'eventType'>): void {
    this.logger.info({
      ...entry,
      eventType: 'DND_UPDATE'
    });
  }

  /**
   * Log a template registration/update
   */
  public logTemplateUpdate(entry: Omit<AuditLogEntry, 'eventType'>): void {
    this.logger.info({
      ...entry,
      eventType: 'TEMPLATE_UPDATE'
    });
  }

  /**
   * Log a content filtering event
   */
  public logContentFilter(entry: Omit<AuditLogEntry, 'eventType'>): void {
    this.logger.info({
      ...entry,
      eventType: 'CONTENT_FILTER'
    });
  }

  /**
   * Log a rate limiting event
   */
  public logRateLimit(entry: Omit<AuditLogEntry, 'eventType'>): void {
    this.logger.warn({
      ...entry,
      eventType: 'RATE_LIMIT'
    });
  }

  /**
   * Log a system error
   */
  public logError(entry: Omit<AuditLogEntry, 'eventType'>): void {
    this.logger.error({
      ...entry,
      eventType: 'SYSTEM_ERROR'
    });
  }
}
