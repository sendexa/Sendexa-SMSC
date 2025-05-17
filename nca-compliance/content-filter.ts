import { logger } from '../utils/logger';

const blockedWords = [
  'fraud', 'scam', '419', 'free money', 'win prize',
  'sex', 'porn', 'xxx', 'adult', 'dating'
];

export async function contentFilter(content: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const lowerContent = content.toLowerCase();
    
    // Check for blocked words
    for (const word of blockedWords) {
      if (lowerContent.includes(word)) {
        return {
          allowed: false,
          reason: `Message contains blocked word: ${word}`
        };
      }
    }

    // Check message length
    if (content.length > 160) {
      return {
        allowed: false,
        reason: 'Message exceeds maximum length (160 characters)'
      };
    }

    return { allowed: true };
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Content filter error: ${error.message}`);
    } else {
      logger.error('Content filter error: Unknown error');
    }
    return {
      allowed: false,
      reason: 'Error processing message content'
    };
  }
}