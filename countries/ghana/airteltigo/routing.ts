import { AirtelTigoConfig } from './config';

export class AirtelTigoRouting {
  static getRouteConfig(msisdn: string) {
    // AirtelTigo has different routes for different regions
    const isNorthernRegion = msisdn.startsWith('23353');
    
    return {
      host: isNorthernRegion 
        ? 'airteltigo-north-smpp-gw.airteltigo.com.gh' 
        : AirtelTigoConfig.host,
      port: AirtelTigoConfig.port,
      systemId: AirtelTigoConfig.systemId,
      password: AirtelTigoConfig.password,
      throughput: AirtelTigoConfig.throughput
    };
  }

  static shouldRouteToAirtelTigo(msisdn: string): boolean {
    const airteltigoPrefixes = ['23', '53', '52', '57'];
    const prefix = msisdn.startsWith('233') ? msisdn.substring(3, 5) : msisdn.substring(0, 2);
    return airteltigoPrefixes.includes(prefix);
  }
}