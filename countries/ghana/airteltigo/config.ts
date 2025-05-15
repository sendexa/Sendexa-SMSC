export const AirtelTigoConfig = {
  systemId: 'airteltigo_smpp_user',
  password: 'airteltigo_secure_pass',
  host: 'airteltigo-smpp-gw.airteltigo.com.gh',
  port: 5016,
  systemType: 'SMPP',
  interfaceVersion: 0x34,
  sourceTON: 5, // Alphanumeric
  sourceNPI: 0, // Unknown
  destTON: 1,   // International
  destNPI: 1,   // ISDN/E.164
  registeredDelivery: 1, // Request delivery receipt
  throughput: 70, // Messages per second
  maxConnections: 5,
  specificParams: {
    // AirtelTigo-specific parameters
    serviceType: '',
    validityPeriod: '000004000000000R', // 4 hours validity
    esmClass: 0,
    protocolId: 0,
    priorityFlag: 1,
    scheduleDeliveryTime: '',
    replaceIfPresentFlag: 0,
    smDefaultMsgId: 0,
    // AirtelTigo requires special numbering for short codes
    shortCodeTON: 3,
    shortCodeNPI: 1
  }
};