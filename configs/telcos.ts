import { MTNConfig } from '../countries/ghana/mtn/config';
import { VodafoneConfig } from '../countries/ghana/vodafone/config';
import { AirtelTigoConfig } from '../countries/ghana/airteltigo/config';
import { GloConfig } from '../countries/ghana/glo/config';

export interface TelcoNCASettings {
  rateLimits: {
    messagesPerMinute: number;
    messagesPerHour: number;
    messagesPerDay: number;
  };
  contentFilter: {
    enabled: boolean;
    confidenceThreshold: number;
    blockedCategories: string[];
  };
  templates: {
    requireApproval: boolean;
    maxLength: number;
    allowedCategories: string[];
  };
  reporting: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
    formats: ('CSV' | 'JSON' | 'PDF')[];
  };
  security: {
    requireTLS: boolean;
    ipWhitelist: string[];
    maxConnections: number;
  };
}

export interface TelcoConfig {
  rate: any;
  networkId: any;
  name: string;
  code: string;
  country: string;
  ncaSettings: TelcoNCASettings;
  systemId: string;
  password: string;
  host: string;
  port: number;
  systemType: string;
  interfaceVersion: number;
  sourceTON: number;
  sourceNPI: number;
  destTON: number;
  destNPI: number;
  registeredDelivery: number;
  throughput: number;
  maxConnections: number;
  specificParams: {
    serviceType: string;
    validityPeriod: string;
    esmClass: number;
    protocolId: number;
    priorityFlag: number;
    scheduleDeliveryTime: string;
    replaceIfPresentFlag: number;
    smDefaultMsgId: number;
    destAddrSubunit?: number; // Optional for some telcos
  };
  networkType?: number; // Optional for some telcos
  // ... other existing config properties
}

export const TelcoRegistry = {
  // Mapping of number prefixes to telco configs
  numberPrefixes: {
    mtn: ['24', '25', '28', '29', '54', '55', '56', '58', '59'],
    vodafone: ['20', '50'],
    airteltigo: ['26', '27', '57', '52', '53'],
    glo: ['30']
  },

  // Default NCA settings for telcos
  defaultNCASettings: {
    rateLimits: {
      messagesPerMinute: 60,
      messagesPerHour: 1000,
      messagesPerDay: 10000
    },
    contentFilter: {
      enabled: true,
      confidenceThreshold: 0.7,
      blockedCategories: ['FRAUD', 'ADULT', 'POLITICAL', 'SPAM']
    },
    templates: {
      requireApproval: true,
      maxLength: 160,
      allowedCategories: ['PROMOTIONAL', 'TRANSACTIONAL', 'SERVICE', 'OTP']
    },
    reporting: {
      daily: true,
      weekly: true,
      monthly: true,
      formats: ['CSV', 'JSON', 'PDF']
    },
    security: {
      requireTLS: true,
      ipWhitelist: [],
      maxConnections: 100
    }
  },

  // Get config by telco name
  getConfig: (telco: string): TelcoConfig => {
    const baseConfig = (() => {
      switch (telco.toLowerCase()) {
        case 'mtn': return MTNConfig;
        case 'vodafone': return VodafoneConfig;
        case 'airteltigo': return AirtelTigoConfig;
        case 'glo': return GloConfig;
        default: throw new Error(`Unknown telco: ${telco}`);
      }
    })();

    // Merge with NCA settings
    return {
      ...baseConfig,
      ncaSettings: {
        ...TelcoRegistry.defaultNCASettings,
        ...baseConfig.ncaSettings
      }
    };
  },

  // Determine telco by number
  getTelcoByNumber: (msisdn: string): string => {
    const prefix = msisdn.startsWith('233') ? msisdn.substring(3, 5) : msisdn.substring(0, 2);
    
    for (const [telco, prefixes] of Object.entries(TelcoRegistry.numberPrefixes)) {
      if (prefixes.includes(prefix)) {
        return telco;
      }
    }
    
    return 'unknown';
  },

  // Get all active telcos
  getAllTelcos: () => {
    return {
      mtn: TelcoRegistry.getConfig('mtn'),
      vodafone: TelcoRegistry.getConfig('vodafone'),
      airteltigo: TelcoRegistry.getConfig('airteltigo'),
      glo: TelcoRegistry.getConfig('glo')
    };
  },

  // Get NCA settings for a telco
  getNCASettings: (telco: string): TelcoNCASettings => {
    return TelcoRegistry.getConfig(telco).ncaSettings;
  },

  // Update NCA settings for a telco
  updateNCASettings: (telco: string, settings: Partial<TelcoNCASettings>): void => {
    const config = TelcoRegistry.getConfig(telco);
    config.ncaSettings = {
      ...config.ncaSettings,
      ...settings
    };
  },

  // Validate NCA settings
  validateNCASettings: (settings: TelcoNCASettings): string[] => {
    const errors: string[] = [];

    // Validate rate limits
    if (settings.rateLimits.messagesPerMinute < 1) {
      errors.push('Messages per minute must be positive');
    }
    if (settings.rateLimits.messagesPerHour < settings.rateLimits.messagesPerMinute) {
      errors.push('Messages per hour must be greater than messages per minute');
    }
    if (settings.rateLimits.messagesPerDay < settings.rateLimits.messagesPerHour) {
      errors.push('Messages per day must be greater than messages per hour');
    }

    // Validate content filter
    if (settings.contentFilter.confidenceThreshold < 0 || settings.contentFilter.confidenceThreshold > 1) {
      errors.push('Confidence threshold must be between 0 and 1');
    }

    // Validate templates
    if (settings.templates.maxLength < 1 || settings.templates.maxLength > 160) {
      errors.push('Template max length must be between 1 and 160');
    }

    // Validate security
    if (settings.security.maxConnections < 1) {
      errors.push('Max connections must be positive');
    }

    return errors;
  }
};