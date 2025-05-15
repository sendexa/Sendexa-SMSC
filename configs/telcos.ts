import { MTNConfig } from '../countries/ghana/mtn/config';
import { VodafoneConfig } from '../countries/ghana/vodafone/config';
import { AirtelTigoConfig } from '../countries/ghana/airteltigo/config';
import { GloConfig } from '../countries/ghana/glo/config';

export const TelcoRegistry = {
  // Mapping of number prefixes to telco configs
  numberPrefixes: {
    mtn: ['24', '25', '26', '27', '28', '29', '54', '55', '56', '57', '58', '59'],
    vodafone: ['20', '30', '50'],
    airteltigo: ['23', '53', '52', '57'],
    glo: ['23', '53', '52', '57'] // Note: Glo may share prefixes with AirtelTigo
  },

  // Get config by telco name
  getConfig: (telco: string) => {
    switch (telco.toLowerCase()) {
      case 'mtn': return MTNConfig;
      case 'vodafone': return VodafoneConfig;
      case 'airteltigo': return AirtelTigoConfig;
      case 'glo': return GloConfig;
      default: throw new Error(`Unknown telco: ${telco}`);
    }
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
      mtn: MTNConfig,
      vodafone: VodafoneConfig,
      airteltigo: AirtelTigoConfig,
      glo: GloConfig
    };
  }
};