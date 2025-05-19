import { TelcoConfig, TelcoNCASettings } from '../../../configs/telcos';

const vodafoneNCASettings: TelcoNCASettings = {
  rateLimits: {
    messagesPerMinute: 50,
    messagesPerHour: 800,
    messagesPerDay: 8000
  },
  contentFilter: {
    enabled: true,
    confidenceThreshold: 0.75,
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
    maxConnections: 4
  }
};

export const VodafoneConfig: TelcoConfig = {
  name: 'Vodafone Ghana',
  code: 'VOD',
  country: 'Ghana',
  ncaSettings: vodafoneNCASettings,
  systemId: process.env.VODAFONE_SMPP_SYSTEM_ID || 'vodafone_smpp_user',
  password: process.env.VODAFONE_SMPP_PASSWORD || 'secure_password_123',
  host: 'vodafone-smpp-gw.vodafone.com.gh',
  port: 5016,
  systemType: 'smpp',
  interfaceVersion: 0x34,
  sourceTON: 5, // Alphanumeric
  sourceNPI: 0, // Unknown
  destTON: 1,   // International
  destNPI: 1,   // ISDN/E.164
  registeredDelivery: 1, // Request delivery receipt
  throughput: 80, // Messages per second
  maxConnections: 4,
  specificParams: {
    // Vodafone-specific parameters
    serviceType: 'SMS',
    validityPeriod: '000003000000000R', // 3 hours validity
    esmClass: 0x40, // UDH Indicator for concatenated SMS
    protocolId: 0x7F, // All protocols
    priorityFlag: 1,
    scheduleDeliveryTime: '',
    replaceIfPresentFlag: 0,
    smDefaultMsgId: 0
  }
};