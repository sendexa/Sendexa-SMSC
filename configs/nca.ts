export interface NCAConfig {
  audit: {
    enabled: boolean;
    retentionDays: number;
    maxFileSize: string;
    logLevel: 'info' | 'warn' | 'error';
    securityLogEnabled: boolean;
  };
  dnd: {
    enabled: boolean;
    autoCleanupDays: number;
    categories: {
      OPT_OUT: boolean;
      BLOCKED: boolean;
      SPAM: boolean;
      COMPLAINT: boolean;
    };
  };
  templates: {
    enabled: boolean;
    requireApproval: boolean;
    maxLength: number;
    categories: {
      PROMOTIONAL: boolean;
      TRANSACTIONAL: boolean;
      SERVICE: boolean;
      OTP: boolean;
    };
    approvalTimeout: number; // in hours
  };
  contentFilter: {
    enabled: boolean;
    confidenceThreshold: number;
    categories: {
      FRAUD: boolean;
      ADULT: boolean;
      POLITICAL: boolean;
      SPAM: boolean;
    };
    maxMessageLength: number;
    allowedCharacters: string;
  };
  rateLimits: {
    enabled: boolean;
    default: {
      messagesPerMinute: number;
      messagesPerHour: number;
      messagesPerDay: number;
    };
    perTelco: {
      [telcoId: string]: {
        messagesPerMinute: number;
        messagesPerHour: number;
        messagesPerDay: number;
      };
    };
  };
  reporting: {
    enabled: boolean;
    schedule: {
      daily: boolean;
      weekly: boolean;
      monthly: boolean;
    };
    formats: ('CSV' | 'JSON' | 'PDF')[];
    retentionDays: number;
  };
  security: {
    enabled: boolean;
    ipWhitelist: string[];
    maxConnections: number;
    sessionTimeout: number; // in minutes
    requireTLS: boolean;
  };
}

export const ncaConfig: NCAConfig = {
  audit: {
    enabled: true,
    retentionDays: 14,
    maxFileSize: '20m',
    logLevel: 'info',
    securityLogEnabled: true
  },
  dnd: {
    enabled: true,
    autoCleanupDays: 30,
    categories: {
      OPT_OUT: true,
      BLOCKED: true,
      SPAM: true,
      COMPLAINT: true
    }
  },
  templates: {
    enabled: true,
    requireApproval: true,
    maxLength: 160,
    categories: {
      PROMOTIONAL: true,
      TRANSACTIONAL: true,
      SERVICE: true,
      OTP: true
    },
    approvalTimeout: 24 // 24 hours
  },
  contentFilter: {
    enabled: true,
    confidenceThreshold: 0.7,
    categories: {
      FRAUD: true,
      ADULT: true,
      POLITICAL: true,
      SPAM: true
    },
    maxMessageLength: 160,
    allowedCharacters: 'A-Za-z0-9\\s.,!?@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|<>\\/'
  },
  rateLimits: {
    enabled: true,
    default: {
      messagesPerMinute: 60,
      messagesPerHour: 1000,
      messagesPerDay: 10000
    },
    perTelco: {
      'MTN': {
        messagesPerMinute: 100,
        messagesPerHour: 2000,
        messagesPerDay: 20000
      },
      'VODAFONE': {
        messagesPerMinute: 80,
        messagesPerHour: 1500,
        messagesPerDay: 15000
      },
      'AIRTEL': {
        messagesPerMinute: 80,
        messagesPerHour: 1500,
        messagesPerDay: 15000
      }
    }
  },
  reporting: {
    enabled: true,
    schedule: {
      daily: true,
      weekly: true,
      monthly: true
    },
    formats: ['CSV', 'JSON', 'PDF'],
    retentionDays: 90
  },
  security: {
    enabled: true,
    ipWhitelist: [
      '127.0.0.1',
      '::1'
    ],
    maxConnections: 100,
    sessionTimeout: 30, // 30 minutes
    requireTLS: true
  }
};

// Helper function to get telco-specific rate limits
export function getTelcoRateLimits(telcoId: string): NCAConfig['rateLimits']['default'] {
  return ncaConfig.rateLimits.perTelco[telcoId] || ncaConfig.rateLimits.default;
}

// Helper function to check if a category is enabled
export function isCategoryEnabled(
  type: 'dnd' | 'templates' | 'contentFilter',
  category: string
): boolean {
  switch (type) {
    case 'dnd':
      return ncaConfig.dnd.categories[category as keyof NCAConfig['dnd']['categories']] || false;
    case 'templates':
      return ncaConfig.templates.categories[category as keyof NCAConfig['templates']['categories']] || false;
    case 'contentFilter':
      return ncaConfig.contentFilter.categories[category as keyof NCAConfig['contentFilter']['categories']] || false;
    default:
      return false;
  }
}

// Helper function to validate IP against whitelist
export function isIPWhitelisted(ip: string): boolean {
  return ncaConfig.security.ipWhitelist.includes(ip);
}

// Helper function to get reporting schedule
export function getReportingSchedule(): { daily: boolean; weekly: boolean; monthly: boolean } {
  return ncaConfig.reporting.schedule;
}

// Helper function to check if a feature is enabled
export function isFeatureEnabled(feature: keyof NCAConfig): boolean {
  return ncaConfig[feature].enabled;
}
