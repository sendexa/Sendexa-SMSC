import { logHelpers } from '../utils/logger';
import { NCAAuditLogger } from './audit-logger';

interface ContentFilterResult {
  allowed: boolean;
  reason?: string;
  category?: 'SPAM' | 'FRAUD' | 'ADULT' | 'POLITICAL' | 'LENGTH' | 'FORMAT';
  confidence: number;
}

export class ContentFilter {
  private static instance: ContentFilter;
  private auditLogger: NCAAuditLogger;

  // Categories of blocked content
  private readonly blockedCategories = {
    FRAUD: [
      'fraud',
      'scam',
      '419',
      'free money',
      'win prize',
      'lottery',
      'inheritance',
      'bank transfer',
      'urgent help',
      'emergency',
      'account suspended',
      'verify account',
      'confirm details',
    ],
    ADULT: [
      'sex',
      'porn',
      'xxx',
      'adult',
      'dating',
      'escort',
      'hookup',
      'casual',
      'intimate',
      'explicit',
    ],
    POLITICAL: [
      'vote',
      'election',
      'campaign',
      'political',
      'party',
      'protest',
      'rally',
      'demonstration',
      'opposition',
    ],
    SPAM: [
      'buy now',
      'limited time',
      'act now',
      'click here',
      'subscribe',
      'unsubscribe',
      'opt out',
      'opt in',
    ],
  };

  private constructor() {
    this.auditLogger = NCAAuditLogger.getInstance();
  }

  public static getInstance(): ContentFilter {
    if (!ContentFilter.instance) {
      ContentFilter.instance = new ContentFilter();
    }
    return ContentFilter.instance;
  }

  /**
   * Filter message content
   */
  public async filterContent(content: string): Promise<ContentFilterResult> {
    try {
      const lowerContent = content.toLowerCase();
      let highestConfidence = 0;
      let detectedCategory: ContentFilterResult['category'] | undefined;
      let detectedReason: string | undefined;

      // Check each category
      for (const [category, words] of Object.entries(this.blockedCategories)) {
        for (const word of words) {
          if (lowerContent.includes(word)) {
            const confidence = this.calculateConfidence(lowerContent, word);
            if (confidence > highestConfidence) {
              highestConfidence = confidence;
              detectedCategory = category as ContentFilterResult['category'];
              detectedReason = `Message contains blocked content: ${word}`;
            }
          }
        }
      }

      // Check message length
      if (content.length > 160) {
        return {
          allowed: false,
          reason: 'Message exceeds maximum length (160 characters)',
          category: 'LENGTH',
          confidence: 1.0,
        };
      }

      // Check message format
      if (!this.isValidFormat(content)) {
        return {
          allowed: false,
          reason: 'Message contains invalid characters or format',
          category: 'FORMAT',
          confidence: 1.0,
        };
      }

      // If no issues found
      if (!detectedCategory) {
        return {
          allowed: true,
          confidence: 1.0,
        };
      }

      // Log the content filter event
      this.auditLogger.logContentFilter({
        timestamp: new Date().toISOString(),
        action: 'CONTENT_FILTER',
        details: {
          category: detectedCategory,
          confidence: highestConfidence,
          reason: detectedReason,
        },
        status: 'success',
      });

      return {
        allowed: false,
        reason: detectedReason,
        category: detectedCategory,
        confidence: highestConfidence,
      };
    } catch (error) {
      // Log the error
      this.auditLogger.logContentFilter({
        timestamp: new Date().toISOString(),
        action: 'CONTENT_FILTER',
        details: {
          error: (error as Error).message,
        },
        status: 'failure',
      });

      logHelpers.error('Content filter error', error as Error);

      return {
        allowed: false,
        reason: 'Error processing message content',
        confidence: 0,
      };
    }
  }

  /**
   * Calculate confidence score for detected content
   */
  private calculateConfidence(content: string, word: string): number {
    // Base confidence
    let confidence = 0.5;

    // Increase confidence if word appears multiple times
    const occurrences = (content.match(new RegExp(word, 'g')) || []).length;
    confidence += Math.min(occurrences * 0.1, 0.3);

    // Increase confidence if word is part of common phrases
    const commonPhrases = [
      'click here to',
      'act now to',
      'limited time offer',
      'verify your account',
      'confirm your details',
    ];

    for (const phrase of commonPhrases) {
      if (content.includes(phrase)) {
        confidence += 0.2;
        break;
      }
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Validate message format
   */
  private isValidFormat(content: string): boolean {
    // Check for valid characters (basic GSM alphabet)
    // const validChars = /^[A-Za-z0-9\s.,!?@#$%^&*()_+\-=\[\]{};':"\\|<>/]+$/;
    // if (!validChars.test(content)) {
    //   return false;
    // }

    // Check for valid characters in the basic GSM 03.38 character set
    const gsmCharset =
      /^[\x20\x21\x22\x23\x24\x25\x26\x27\x28\x29\x2A\x2B\x2C\x2D\x2E\x2F\x30-\x39\x3A\x3B\x3C\x3D\x3E\x3F\x40\x41-\x5A\x5B\x5C\x5D\x5E\x5F\x61-\x7A\x7B\x7C\x7D\x7E\s]+$/;

    if (!gsmCharset.test(content)) {
      return false;
    }

    // Check for excessive repetition
    const repetitionRegex = /(.)\1{4,}/;
    if (repetitionRegex.test(content)) {
      return false;
    }

    // Check for excessive punctuation
    const punctuationRegex = /[.,!?]{3,}/;
    if (punctuationRegex.test(content)) {
      return false;
    }

    return true;
  }

  /**
   * Add new blocked words to a category
   */
  public addBlockedWords(category: keyof typeof this.blockedCategories, words: string[]): void {
    this.blockedCategories[category].push(...words);
  }

  /**
   * Remove blocked words from a category
   */
  public removeBlockedWords(category: keyof typeof this.blockedCategories, words: string[]): void {
    this.blockedCategories[category] = this.blockedCategories[category].filter(
      (word) => !words.includes(word),
    );
  }

  /**
   * Get all blocked words
   */
  public getAllBlockedWords(): Record<string, string[]> {
    return { ...this.blockedCategories };
  }
}
