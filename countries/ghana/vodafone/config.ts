export const VodafoneConfig = {
  systemId: 'vodafone_smpp_user',
  password: 'vodafone_secure_pass',
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
  maxConnections: 5,
  specificParams: {
    // Vodafone-specific parameters
    serviceType: 'SMS',
    validityPeriod: '000003000000000R', // 3 hours validity
    protocolId: 0,
    priorityFlag: 1,
    replaceIfPresentFlag: 0,
    smDefaultMsgId: 0
  }
};