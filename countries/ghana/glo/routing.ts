import { GloConfig } from './config';

export class GloRouting {
  static getRouteConfig(msisdn: string) {
    // Glo has a single route for all messages
    return {
      host: GloConfig.host,
      port: GloConfig.port,
      systemId: GloConfig.systemId,
      password: GloConfig.password,
      throughput: GloConfig.throughput
    };
  }

  static shouldRouteToGlo(msisdn: string): boolean {
    const gloPrefixes = ['23', '53', '52', '57'];
    const prefix = msisdn.startsWith('233') ? msisdn.substring(3, 5) : msisdn.substring(0, 2);
    return gloPrefixes.includes(prefix);
  }
}