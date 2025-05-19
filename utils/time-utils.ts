import { logHelpers } from './logger';

// SMPP time format: YYMMDDhhmmss000R
// YY: Year (00-99)
// MM: Month (01-12)
// DD: Day (01-31)
// hh: Hour (00-23)
// mm: Minute (00-59)
// ss: Second (00-59)
// 000: Tenths of a second (000-999)
// R: Time difference in 15-minute intervals from UTC

/**
 * Convert Date to SMPP time format
 * @param date Date to convert
 * @param relativeToUTC Time difference in minutes from UTC (default: 0)
 * @returns SMPP formatted time string
 */
export function dateToSMPPTime(date: Date, relativeToUTC: number = 0): string {
  try {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const tenths = Math.floor(date.getMilliseconds() / 100).toString().padStart(3, '0');

    // Calculate relative time indicator (R)
    // R is the time difference in 15-minute intervals from UTC
    const relativeIndicator = Math.round(relativeToUTC / 15).toString(16).toUpperCase();

    return `${year}${month}${day}${hours}${minutes}${seconds}${tenths}${relativeIndicator}`;
  } catch (error) {
    logHelpers.error('Error converting date to SMPP time format', error as Error);
    throw error;
  }
}

/**
 * Convert SMPP time format to Date
 * @param smppTime SMPP formatted time string
 * @returns Date object
 */
export function smppTimeToDate(smppTime: string): Date {
  try {
    if (smppTime.length !== 17) {
      throw new Error('Invalid SMPP time format length');
    }

    const year = parseInt(smppTime.slice(0, 2));
    const month = parseInt(smppTime.slice(2, 4)) - 1; // JavaScript months are 0-based
    const day = parseInt(smppTime.slice(4, 6));
    const hours = parseInt(smppTime.slice(6, 8));
    const minutes = parseInt(smppTime.slice(8, 10));
    const seconds = parseInt(smppTime.slice(10, 12));
    const tenths = parseInt(smppTime.slice(12, 15));
    const relativeIndicator = smppTime.slice(15, 16);

    // Calculate UTC offset in minutes
    const utcOffset = parseInt(relativeIndicator, 16) * 15;

    // Create date object
    const date = new Date(2000 + year, month, day, hours, minutes, seconds, tenths * 100);

    // Adjust for UTC offset
    date.setMinutes(date.getMinutes() - utcOffset);

    return date;
  } catch (error) {
    logHelpers.error('Error converting SMPP time to date', error as Error);
    throw error;
  }
}

/**
 * Get current time in SMPP format
 * @returns SMPP formatted time string
 */
export function getCurrentSMPPTime(): string {
  return dateToSMPPTime(new Date());
}

/**
 * Calculate message validity period
 * @param validityPeriod Validity period in minutes
 * @returns SMPP formatted time string
 */
export function calculateValidityPeriod(validityPeriod: number): string {
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + validityPeriod);
  return dateToSMPPTime(expiryDate);
}

/**
 * Calculate message schedule time
 * @param scheduleTime Minutes from now to schedule the message
 * @returns SMPP formatted time string
 */
export function calculateScheduleTime(scheduleTime: number): string {
  const scheduleDate = new Date();
  scheduleDate.setMinutes(scheduleDate.getMinutes() + scheduleTime);
  return dateToSMPPTime(scheduleDate);
}

/**
 * Validate SMPP time format
 * @param smppTime SMPP formatted time string to validate
 * @returns boolean indicating if the format is valid
 */
export function isValidSMPPTime(smppTime: string): boolean {
  try {
    if (smppTime.length !== 17) {
      return false;
    }

    const year = parseInt(smppTime.slice(0, 2));
    const month = parseInt(smppTime.slice(2, 4));
    const day = parseInt(smppTime.slice(4, 6));
    const hours = parseInt(smppTime.slice(6, 8));
    const minutes = parseInt(smppTime.slice(8, 10));
    const seconds = parseInt(smppTime.slice(10, 12));
    const tenths = parseInt(smppTime.slice(12, 15));
    const relativeIndicator = smppTime.slice(15, 16);

    // Basic validation
    if (
      isNaN(year) || year < 0 || year > 99 ||
      isNaN(month) || month < 1 || month > 12 ||
      isNaN(day) || day < 1 || day > 31 ||
      isNaN(hours) || hours < 0 || hours > 23 ||
      isNaN(minutes) || minutes < 0 || minutes > 59 ||
      isNaN(seconds) || seconds < 0 || seconds > 59 ||
      isNaN(tenths) || tenths < 0 || tenths > 999 ||
      !/^[0-9A-F]$/.test(relativeIndicator)
    ) {
      return false;
    }

    // Validate date (e.g., February 30th)
    const date = new Date(2000 + year, month - 1, day);
    return date.getMonth() === month - 1;
  } catch (error) {
    logHelpers.error('Error validating SMPP time format', error as Error);
    return false;
  }
}

/**
 * Get relative time indicator from UTC offset
 * @param utcOffsetMinutes UTC offset in minutes
 * @returns Relative time indicator (0-F)
 */
export function getRelativeTimeIndicator(utcOffsetMinutes: number): string {
  const indicator = Math.round(utcOffsetMinutes / 15);
  return indicator.toString(16).toUpperCase();
}

/**
 * Get UTC offset from relative time indicator
 * @param indicator Relative time indicator (0-F)
 * @returns UTC offset in minutes
 */
export function getUTCOffsetFromIndicator(indicator: string): number {
  return parseInt(indicator, 16) * 15;
}
