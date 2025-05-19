import { TelcoConfig, TelcoNCASettings } from '../../../configs/telcos';

const mtnNCASettings: TelcoNCASettings = {
  rateLimits: {
    messagesPerMinute: 60,
    messagesPerHour: 1000,
    messagesPerDay: 10000
  },
  contentFilter: {
    enabled: true,
    confidenceThreshold: 0.8,
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
    ipWhitelist: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
    maxConnections: 5
  }
};

export const MTNConfig: TelcoConfig = {
  name: 'MTN Ghana',
  code: 'MTN',
  country: 'Ghana',
  ncaSettings: mtnNCASettings,
  systemId: process.env.MTN_SMPP_SYSTEM_ID || 'mtn_smpp_user',
  password: process.env.MTN_SMPP_PASSWORD || 'secure_password_123',
  host: 'mtn-smpp-gw.mtn.com.gh',
  port: 5016,
  systemType: 'smpp',
  interfaceVersion: 0x34,
  sourceTON: 5, // Alphanumeric
  sourceNPI: 0, // Unknown
  destTON: 1,   // International
  destNPI: 1,   // ISDN/E.164
  registeredDelivery: 1, // Request delivery receipt
  throughput: 100, // Messages per second
  maxConnections: 5,
  specificParams: {
    // MTN-specific parameters
    serviceType: 'SMS',
    validityPeriod: '000003000000000R', // 3 hours validity
    esmClass: 0x40, // UDH Indicator for concatenated SMS
    protocolId: 0x7F, // All protocols
    priorityFlag: 1,
    scheduleDeliveryTime: '',
    replaceIfPresentFlag: 0,
    smDefaultMsgId: 0,
    // MTN requires specific parameters for premium SMS
    destAddrSubunit: 0
  }
};