export class GloRates {
  private static rates = {
    standard: 0.055, // GHS per SMS
    premium: 0.55,   // GHS per premium SMS
    promo: 0.025     // GHS per promotional SMS (with restrictions)
  };

  static calculateCost(msisdn: string, messageCount: number = 1, isPromo: boolean = false): number {
    const isPremium = msisdn.length <= 6;
    
    if (isPromo && !isPremium) return this.rates.promo * messageCount;
    if (isPremium) return this.rates.premium * messageCount;
    return this.rates.standard * messageCount;
  }
}