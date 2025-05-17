export const GloConfig = {
  systemId: process.env.GLO_SMPP_SYSTEM_ID || 'glo_smpp_user',
  password: process.env.GLO_SMPP_PASSWORD || 'glo_secure_pass',
  host: 'glo-smpp-gw.glo.com.gh',
  port: 5016,
  systemType: 'SMPP',
  interfaceVersion: 0x34,
  sourceTON: 5, // Alphanumeric
  sourceNPI: 0, // Unknown
  destTON: 1,   // International
  destNPI: 1,   // ISDN/E.164
  registeredDelivery: 1, // Request delivery receipt
  throughput: 60, // Messages per second
  maxConnections: 5,
  specificParams: {
    // Glo-specific parameters
    serviceType: 'SMS',
    validityPeriod: '000002000000000R', // 2 hours validity
    esmClass: 0,
    protocolId: 0,
    priorityFlag: 1,
    scheduleDeliveryTime: '',
    replaceIfPresentFlag: 0,
    smDefaultMsgId: 0,
    // Glo has specific requirements for message concatenation
    sarMsgRefNum: 1,
    sarTotalSegments: 1,
    sarSegmentSeqnum: 1
  }
};