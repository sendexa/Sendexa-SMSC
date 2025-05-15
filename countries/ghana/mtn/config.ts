export const MTNConfig = {
  systemId: 'mtn_smpp_user',
  password: 'secure_password_123',
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
    destAddrSubunit: 0,
    networkType: 0
  },
  // MTN has specific DLR requirements
  dlrSettings: {
    dlrMask: 31,
    dlrUrl: 'https://your-server.com/mtn/dlr'
  }
};