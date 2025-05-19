import { TelcoConfig, TelcoNCASettings } from '../../../configs/telcos';

const gloNCASettings: TelcoNCASettings = {
  rateLimits: {
    messagesPerMinute: 40,
    messagesPerHour: 600,
    messagesPerDay: 6000
  },
  contentFilter: {
    enabled: true,
    confidenceThreshold: 0.65,
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
    maxConnections: 2
  }
};

export const GloConfig: TelcoConfig = {
  name: 'Glo Ghana',
  code: 'GLO',
  country: 'Ghana',
  ncaSettings: gloNCASettings,
  systemId: process.env.GLO_SMPP_SYSTEM_ID || 'glo_smpp_user',
  password: process.env.GLO_SMPP_PASSWORD || 'secure_password_123',
  host: 'glo-smpp-gw.glo.com.gh',
  port: 5016,
  systemType: 'smpp',
  interfaceVersion: 0x34,
  sourceTON: 5, // Alphanumeric
  sourceNPI: 0, // Unknown
  destTON: 1, // International
  destNPI: 1, // ISDN/E.164
  registeredDelivery: 1, // Request delivery receipt
  throughput: 60, // Messages per second
  maxConnections: 2,
  specificParams: {
    // Glo-specific parameters
    serviceType: 'SMS',
    validityPeriod: '000003000000000R', // 3 hours validity
    esmClass: 0x40, // UDH Indicator for concatenated SMS
    protocolId: 0x7F, // All protocols
    priorityFlag: 1,
    scheduleDeliveryTime: '',
    replaceIfPresentFlag: 0,
    smDefaultMsgId: 0
  },
  rate: undefined,
  networkId: undefined
};