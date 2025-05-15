export class VodafoneRates {
  private static rates = {
    standard: 0.045, // GHS per SMS
    premium: 0.45,   // GHS per premium SMS
    corporate: 0.035 // GHS per corporate SMS
  };

  static calculateCost(msisdn: string, messageCount: number = 1): number {
    const isPremium = msisdn.length <= 6;
    const isCorporate = msisdn.startsWith('23330');
    
    if (isPremium) return this.rates.premium * messageCount;
    if (isCorporate) return this.rates.corporate * messageCount;
    return this.rates.standard * messageCount;
  }
}