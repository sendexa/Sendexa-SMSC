import { MTNConfig } from './config';

export class MTNRouting {
  static getRouteConfig(msisdn: string, messageType: string = 'standard') {
    // MTN has different routes for different message types
    const routes = {
      standard: {
        host: MTNConfig.host,
        port: MTNConfig.port,
        systemId: MTNConfig.systemId,
        password: MTNConfig.password,
        throughput: MTNConfig.throughput
      },
      premium: {
        host: 'mtn-premium-smpp-gw.mtn.com.gh',
        port: 5020,
        systemId: `${MTNConfig.systemId}_premium`,
        password: MTNConfig.password,
        throughput: 50 // Lower throughput for premium
      },
      corporate: {
        host: 'mtn-corporate-smpp-gw.mtn.com.gh',
        port: 5021,
        systemId: `${MTNConfig.systemId}_corp`,
        password: MTNConfig.password,
        throughput: 200 // Higher throughput for corporate
      }
    };

    // Determine if this is a premium number (e.g., short codes)
    const isPremium = msisdn.length <= 6;
    const isCorporate = msisdn.startsWith('23327'); // Example corporate prefix

    if (isPremium) return routes.premium;
    if (isCorporate) return routes.corporate;
    return routes.standard;
  }

  static shouldRouteToMTN(msisdn: string): boolean {
    const mtnPrefixes = ['24', '25', '26', '27', '28', '29', '54', '55', '56', '57', '58', '59'];
    const prefix = msisdn.startsWith('233') ? msisdn.substring(3, 5) : msisdn.substring(0, 2);
    return mtnPrefixes.includes(prefix);
  }
}