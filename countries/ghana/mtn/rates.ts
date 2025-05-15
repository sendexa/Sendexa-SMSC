export class MTNRates {
  private static rates = {
    standard: 0.05, // GHS per SMS
    premium: 0.50,  // GHS per premium SMS
    corporate: 0.03 // GHS per corporate SMS (bulk discount)
  };

  static calculateCost(msisdn: string, messageCount: number = 1): number {
    const isPremium = msisdn.length <= 6;
    const isCorporate = msisdn.startsWith('23327');
    
    if (isPremium) return this.rates.premium * messageCount;
    if (isCorporate) return this.rates.corporate * messageCount;
    return this.rates.standard * messageCount;
  }

  static getPricingTier(msisdn: string): string {
    if (msisdn.length <= 6) return 'premium';
    if (msisdn.startsWith('23327')) return 'corporate';
    return 'standard';
  }
}