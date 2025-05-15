import { VodafoneConfig } from './config';

export class VodafoneRouting {
  static getRouteConfig(msisdn: string) {
    // Vodafone has a simpler routing structure
    return {
      host: VodafoneConfig.host,
      port: VodafoneConfig.port,
      systemId: VodafoneConfig.systemId,
      password: VodafoneConfig.password,
      throughput: VodafoneConfig.throughput
    };
  }

  static shouldRouteToVodafone(msisdn: string): boolean {
    const vodafonePrefixes = ['20', '30', '50'];
    const prefix = msisdn.startsWith('233') ? msisdn.substring(3, 5) : msisdn.substring(0, 2);
    return vodafonePrefixes.includes(prefix);
  }
}