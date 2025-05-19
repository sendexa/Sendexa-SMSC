import { logHelpers } from '../utils/logger';
import { NCAAuditLogger } from './audit-logger';

export interface DNDEntry {
  msisdn: string;
  reason: string;
  addedBy: string;
  addedAt: Date;
  expiresAt?: Date;
  category: 'OPT_OUT' | 'BLOCKED' | 'SPAM' | 'COMPLAINT';
}

export class DNDManager {
  private static instance: DNDManager;
  private dndList: Map<string, DNDEntry>;
  private auditLogger: NCAAuditLogger;

  private constructor() {
    this.dndList = new Map();
    this.auditLogger = NCAAuditLogger.getInstance();
  }

  public static getInstance(): DNDManager {
    if (!DNDManager.instance) {
      DNDManager.instance = new DNDManager();
    }
    return DNDManager.instance;
  }

  /**
   * Check if a number is in the DND list
   */
  public isDND(msisdn: string): boolean {
    const entry = this.dndList.get(msisdn);
    if (!entry) return false;

    // Check if entry has expired
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.removeDND(msisdn, 'SYSTEM');
      return false;
    }

    return true;
  }

  /**
   * Add a number to the DND list
   */
  public addDND(entry: DNDEntry): void {
    try {
      this.dndList.set(entry.msisdn, entry);

      // Log the addition
      this.auditLogger.logDNDUpdate({
        timestamp: new Date().toISOString(),
        action: 'ADD_DND',
        details: {
          msisdn: entry.msisdn,
          category: entry.category,
          reason: entry.reason
        },
        status: 'success',
        userId: entry.addedBy
      });

      logHelpers.smpp('Number added to DND list', {
        msisdn: entry.msisdn,
        category: entry.category
      });
    } catch (error) {
      this.auditLogger.logDNDUpdate({
        timestamp: new Date().toISOString(),
        action: 'ADD_DND',
        details: {
          msisdn: entry.msisdn,
          category: entry.category,
          reason: entry.reason
        },
        status: 'failure',
        errorMessage: (error as Error).message,
        userId: entry.addedBy
      });

      throw error;
    }
  }

  /**
   * Remove a number from the DND list
   */
  public removeDND(msisdn: string, removedBy: string): void {
    try {
      const entry = this.dndList.get(msisdn);
      if (entry) {
        this.dndList.delete(msisdn);

        // Log the removal
        this.auditLogger.logDNDUpdate({
          timestamp: new Date().toISOString(),
          action: 'REMOVE_DND',
          details: {
            msisdn,
            previousCategory: entry.category
          },
          status: 'success',
          userId: removedBy
        });

        logHelpers.smpp('Number removed from DND list', {
          msisdn,
          previousCategory: entry.category
        });
      }
    } catch (error) {
      this.auditLogger.logDNDUpdate({
        timestamp: new Date().toISOString(),
        action: 'REMOVE_DND',
        details: { msisdn },
        status: 'failure',
        errorMessage: (error as Error).message,
        userId: removedBy
      });

      throw error;
    }
  }

  /**
   * Get DND entry details
   */
  public getDNDEntry(msisdn: string): DNDEntry | undefined {
    const entry = this.dndList.get(msisdn);
    if (entry && entry.expiresAt && entry.expiresAt < new Date()) {
      this.removeDND(msisdn, 'SYSTEM');
      return undefined;
    }
    return entry;
  }

  /**
   * Get all DND entries
   */
  public getAllDNDEntries(): DNDEntry[] {
    const entries: DNDEntry[] = [];
    for (const [msisdn, entry] of this.dndList.entries()) {
      if (!entry.expiresAt || entry.expiresAt >= new Date()) {
        entries.push(entry);
      } else {
        this.removeDND(msisdn, 'SYSTEM');
      }
    }
    return entries;
  }

  /**
   * Clean expired entries
   */
  public cleanExpiredEntries(): void {
    const now = new Date();
    for (const [msisdn, entry] of this.dndList.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.removeDND(msisdn, 'SYSTEM');
      }
    }
  }

  /**
   * Export DND list for reporting
   */
  public exportDNDList(): string {
    const entries = this.getAllDNDEntries();
    return JSON.stringify(entries, null, 2);
  }
}
