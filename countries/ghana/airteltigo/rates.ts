export class AirtelTigoRates {
  private static rates = {
    standard: 0.048, // GHS per SMS
    premium: 0.48,   // GHS per premium SMS
    northern: 0.042  // GHS per SMS in northern regions
  };

  static calculateCost(msisdn: string, messageCount: number = 1): number {
    const isPremium = msisdn.length <= 6;
    const isNorthern = msisdn.startsWith('23353');
    
    if (isPremium) return this.rates.premium * messageCount;
    if (isNorthern) return this.rates.northern * messageCount;
    return this.rates.standard * messageCount;
  }
}