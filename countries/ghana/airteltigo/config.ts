import { TelcoConfig, TelcoNCASettings } from '../../../configs/telcos';

const airteltigoNCASettings: TelcoNCASettings = {
  rateLimits: {
    messagesPerMinute: 45,
    messagesPerHour: 700,
    messagesPerDay: 7000
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
    ipWhitelist: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
    maxConnections: 3
  }
};

export const AirtelTigoConfig: TelcoConfig = {
  name: 'AirtelTigo Ghana',
  code: 'ATL',
  country: 'Ghana',
  ncaSettings: airteltigoNCASettings,
  systemId: process.env.AIRTELTIGO_SMPP_SYSTEM_ID || 'airteltigo_smpp_user',
  password: process.env.AIRTELTIGO_SMPP_PASSWORD || 'secure_password_123',
  host: 'airteltigo-smpp-gw.airteltigo.com.gh',
  port: 5016,
  systemType: 'smpp',
  interfaceVersion: 0x34,
  sourceTON: 5, // Alphanumeric
  sourceNPI: 0, // Unknown
  destTON: 1, // International
  destNPI: 1, // ISDN/E.164
  registeredDelivery: 1, // Request delivery receipt
  throughput: 70, // Messages per second
  maxConnections: 3,
  specificParams: {
    // AirtelTigo-specific parameters
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