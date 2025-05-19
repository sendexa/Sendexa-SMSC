import { logHelpers } from '../utils/logger';
import { getCurrentSMPPTime } from '../utils/time-utils';
import { TON, NPI, DataCoding } from '../utils/pdu-utils';
import { MSISDNNormalizationMiddleware } from './normalize-msisdn';

export interface MessageMetadata {
  messageId: string;
  timestamp: string;
  source: {
    address: string;
    ton: TON;
    npi: NPI;
    normalized?: string;
    countryCode?: string;
  };
  destination: {
    address: string;
    ton: TON;
    npi: NPI;
    normalized?: string;
    countryCode?: string;
  };
  dataCoding: DataCoding;
  messageLength: number;
  telco?: string;
  sessionId?: string;
  priority?: number;
  registeredDelivery?: number;
  validityPeriod?: string;
  scheduleDeliveryTime?: string;
  customTags?: Record<string, string>;
}

export class MetadataEnrichmentMiddleware {
  /**
   * Enrich message metadata
   * @param metadata Base message metadata
   * @returns Enriched MessageMetadata object
   */
  public static enrich(metadata: Partial<MessageMetadata>): MessageMetadata {
    try {
      const enriched: MessageMetadata = {
        messageId: metadata.messageId || this.generateMessageId(),
        timestamp: metadata.timestamp || getCurrentSMPPTime(),
        source: this.enrichAddress(metadata.source),
        destination: this.enrichAddress(metadata.destination),
        dataCoding: metadata.dataCoding || DataCoding.DEFAULT,
        messageLength: metadata.messageLength || 0,
        telco: metadata.telco,
        sessionId: metadata.sessionId,
        priority: metadata.priority || 0,
        registeredDelivery: metadata.registeredDelivery || 0,
        validityPeriod: metadata.validityPeriod,
        scheduleDeliveryTime: metadata.scheduleDeliveryTime,
        customTags: metadata.customTags || {}
      };

      // Add additional metadata based on telco
      if (enriched.telco) {
        enriched.customTags = {
          ...enriched.customTags,
          telco: enriched.telco,
          processingTime: new Date().toISOString()
        };
      }

      // Log the enrichment
      logHelpers.smpp('Message metadata enriched', {
        messageId: enriched.messageId,
        telco: enriched.telco,
        sessionId: enriched.sessionId
      });

      return enriched;
    } catch (error) {
      logHelpers.error('Error enriching message metadata', error as Error);
      throw error;
    }
  }

  /**
   * Enrich address information
   * @param address Address information to enrich
   * @returns Enriched address information
   */
  private static enrichAddress(address?: {
    address: string;
    ton: TON;
    npi: NPI;
  }): MessageMetadata['source'] {
    if (!address) {
      throw new Error('Address information is required');
    }

    const normalized = MSISDNNormalizationMiddleware.normalize(
      address.address,
      address.ton,
      address.npi
    );

    return {
      address: address.address,
      ton: address.ton,
      npi: address.npi,
      normalized: normalized.msisdn,
      countryCode: normalized.countryCode
    };
  }

  /**
   * Generate a unique message ID
   * @returns Generated message ID
   */
  private static generateMessageId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `MSG${timestamp}${random}`.toUpperCase();
  }

  /**
   * Add custom tags to metadata
   * @param metadata Message metadata
   * @param tags Custom tags to add
   * @returns Updated MessageMetadata object
   */
  public static addCustomTags(
    metadata: MessageMetadata,
    tags: Record<string, string>
  ): MessageMetadata {
    return {
      ...metadata,
      customTags: {
        ...metadata.customTags,
        ...tags
      }
    };
  }

  /**
   * Add telco-specific metadata
   * @param metadata Message metadata
   * @param telco Telco identifier
   * @returns Updated MessageMetadata object
   */
  public static addTelcoMetadata(
    metadata: MessageMetadata,
    telco: string
  ): MessageMetadata {
    return {
      ...metadata,
      telco,
      customTags: {
        ...metadata.customTags,
        telco,
        processingTime: new Date().toISOString()
      }
    };
  }

  /**
   * Add session information to metadata
   * @param metadata Message metadata
   * @param sessionId Session identifier
   * @returns Updated MessageMetadata object
   */
  public static addSessionInfo(
    metadata: MessageMetadata,
    sessionId: string
  ): MessageMetadata {
    return {
      ...metadata,
      sessionId,
      customTags: {
        ...metadata.customTags,
        sessionId
      }
    };
  }
}

