export function validateNumber(msisdn: string): string | null {
  // Remove all non-digit characters
  const cleaned = msisdn.replace(/\D/g, '');

  // Ghana number validation
  if (cleaned.startsWith('233')) {
    // Check length for Ghana numbers (233 followed by 9 digits)
    if (cleaned.length === 12) {
      return cleaned;
    }
  } else if (cleaned.startsWith('0')) {
    // Convert local format (0...) to international
    if (cleaned.length === 10) {
      return '233' + cleaned.substring(1);
    }
  }

  return null;
}