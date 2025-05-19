import { logHelpers } from '../utils/logger';
import { TON, NPI } from '../utils/pdu-utils';

export interface NormalizedMSISDN {
  msisdn: string;
  ton: TON;
  npi: NPI;
  countryCode?: string;
  nationalNumber?: string;
}

export class MSISDNNormalizationMiddleware {
  private static readonly COUNTRY_CODES: { [key: string]: string } = {
    '233': 'GH', // Ghana
    '234': 'NG', // Nigeria
    '254': 'KE', // Kenya
    '255': 'TZ', // Tanzania
    '256': 'UG', // Uganda
    '260': 'ZM', // Zambia
    '263': 'ZW', // Zimbabwe
    '265': 'MW', // Malawi
    '266': 'LS', // Lesotho
    '267': 'BW', // Botswana
    '268': 'SZ', // Swaziland
    '269': 'KM', // Comoros
    '27': 'ZA',  // South Africa
    '290': 'SH', // Saint Helena
    '291': 'ER', // Eritrea
    '297': 'AW', // Aruba
    '298': 'FO', // Faroe Islands
    '299': 'GL', // Greenland
    '30': 'GR',  // Greece
    '31': 'NL',  // Netherlands
    '32': 'BE',  // Belgium
    '33': 'FR',  // France
    '34': 'ES',  // Spain
    '36': 'HU',  // Hungary
    '39': 'IT',  // Italy
    '40': 'RO',  // Romania
    '41': 'CH',  // Switzerland
    '43': 'AT',  // Austria
    '44': 'GB',  // United Kingdom
    '45': 'DK',  // Denmark
    '46': 'SE',  // Sweden
    '47': 'NO',  // Norway
    '48': 'PL',  // Poland
    '49': 'DE'   // Germany
  };

  /**
   * Normalize an MSISDN
   * @param msisdn The MSISDN to normalize
   * @param ton Type of Number
   * @param npi Numbering Plan Indicator
   * @returns NormalizedMSISDN object
   */
  public static normalize(msisdn: string, ton: TON, npi: NPI): NormalizedMSISDN {
    try {
      // Remove any non-digit characters
      let normalized = msisdn.replace(/\D/g, '');

      // Handle international format
      if (ton === TON.INTERNATIONAL) {
        // Remove leading '+' if present
        normalized = normalized.replace(/^\+/, '');

        // Try to identify country code
        for (const [code] of Object.entries(this.COUNTRY_CODES)) {
          if (normalized.startsWith(code)) {
            return {
              msisdn: normalized,
              ton,
              npi,
              countryCode: code,
              nationalNumber: normalized.slice(code.length)
            };
          }
        }
      }

      // Handle national format
      if (ton === TON.NATIONAL) {
        // For Ghana numbers, ensure they start with '0'
        if (normalized.startsWith('233')) {
          normalized = '0' + normalized.slice(3);
        }
        // For other countries, you might want to add specific handling
      }

      // Handle alphanumeric format
      if (ton === TON.ALPHANUMERIC) {
        // Keep the original format for alphanumeric addresses
        return {
          msisdn,
          ton,
          npi
        };
      }

      // Log the normalization
      logHelpers.smpp('MSISDN normalized', {
        original: msisdn,
        normalized,
        ton,
        npi
      });

      return {
        msisdn: normalized,
        ton,
        npi
      };
    } catch (error) {
      logHelpers.error('Error normalizing MSISDN', error as Error);
      // Return original values in case of error
      return {
        msisdn,
        ton,
        npi
      };
    }
  }

  /**
     * Validate an MSISDN format
     * @param msisdn The MSISDN to validate
     * @param ton Type of Number
     * @returns boolean indicating if the MSISDN is valid
     */
    public static validate(msisdn: string, ton: TON): boolean {
      try {
        // Handle alphanumeric format
        if (ton === TON.ALPHANUMERIC) {
          return msisdn.length <= 11;
        }
  
        // Remove any non-digit characters
        const digits = msisdn.replace(/\D/g, '');
  
        // Basic length validation
        if (digits.length < 5 || digits.length > 15) {
          return false;
        }
  
        // Country-specific validation
        if (ton === TON.INTERNATIONAL) {
          // Check if it starts with a valid country code
          for (const code of Object.keys(this.COUNTRY_CODES)) {
            if (digits.startsWith(code)) {
              return true;
            }
          }
          return false;
        }
  
        // National number validation
        if (ton === TON.NATIONAL) {
          // For Ghana numbers
          if (digits.startsWith('0')) {
            return digits.length === 10;
          }
          // Add more country-specific validations as needed
        }
  
        return true;
      } catch (error) {
        logHelpers.error('Error validating MSISDN', error as Error);
        return false;
      }
    }

  /**
   * Format an MSISDN for display
   * @param msisdn The MSISDN to format
   * @param ton Type of Number
   * @param npi Numbering Plan Indicator
   * @returns Formatted MSISDN string
   */
  public static format(msisdn: string, ton: TON, npi: NPI): string {
    try {
      const normalized = this.normalize(msisdn, ton, npi);

      if (ton === TON.ALPHANUMERIC) {
        return msisdn;
      }

      if (normalized.countryCode) {
        return `+${normalized.countryCode}${normalized.nationalNumber}`;
      }

      return normalized.msisdn;
    } catch (error) {
      logHelpers.error('Error formatting MSISDN', error as Error);
      return msisdn;
    }
  }
}

