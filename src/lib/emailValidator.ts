/**
 * Email Validator - Prevent Email Bounces
 *
 * This module validates email addresses to prevent bounce issues with Supabase email sending.
 * High bounce rates can cause Supabase to temporarily restrict email sending privileges.
 *
 * Usage:
 *   import { isValidProductionEmail } from './lib/emailValidator'
 *
 *   const result = isValidProductionEmail(email)
 *   if (!result.valid) {
 *     console.warn(result.warning)
 *   }
 */

// Known throwaway/temporary email domains that will cause bounces
const THROWAWAY_DOMAINS = [
  '@test.com',
  '@example.com',
  '@mailinator.com',
  '@guerrillamail.com',
  '@temp-mail.org',
  '@throwaway.email',
  '@fakeinbox.com',
  '@invalid.com',
  '@yopmail.com',
  '@10minutemail.com',
  '@trashmail.com',
  '@tempmail.com',
  '@dispostable.com',
  '@maildrop.cc',
];

// Suspicious patterns in email local part (before @)
const SUSPICIOUS_PATTERNS = [
  /^test[\d]*@/i,        // test@, test1@, test123@
  /^fake[\d]*@/i,        // fake@, fake1@
  /^invalid[\d]*@/i,     // invalid@, invalid1@
  /^demo[\d]*@/i,        // demo@, demo1@
  /^throwaway[\d]*@/i,   // throwaway@
  /^temp[\d]*@/i,        // temp@, temp1@
  /^dummy[\d]*@/i,       // dummy@, dummy1@
  /^asdf[\d]*@/i,        // asdf@, asdf123@
  /^qwerty[\d]*@/i,      // qwerty@
];

export interface EmailValidationResult {
  valid: boolean;
  warning?: string;
}

/**
 * Check if an email address is valid for production use
 *
 * @param email - The email address to validate
 * @returns Object with valid flag and optional warning message
 */
export function isValidProductionEmail(email: string): EmailValidationResult {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      warning: 'Email address is required'
    };
  }

  const lowerEmail = email.toLowerCase().trim();

  // Basic format check
  if (!lowerEmail.includes('@') || !lowerEmail.includes('.')) {
    return {
      valid: false,
      warning: 'Please enter a valid email address'
    };
  }

  // Check against known throwaway domains
  for (const domain of THROWAWAY_DOMAINS) {
    if (lowerEmail.endsWith(domain)) {
      return {
        valid: false,
        warning: `Cannot use throwaway email domain (${domain}). These addresses cause email bounces that can suspend our email sending. Please use a real email address you control.`
      };
    }
  }

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(lowerEmail)) {
      return {
        valid: false,
        warning: `This email looks like a test address. Please use a real email address to avoid email delivery issues. If testing, use the test database with scripts/create-test-user.js instead.`
      };
    }
  }

  // Additional check: email should have at least 2 characters before @
  const localPart = lowerEmail.split('@')[0];
  if (localPart.length < 2) {
    return {
      valid: false,
      warning: 'Email address is too short'
    };
  }

  // Check domain has valid TLD
  const domain = lowerEmail.split('@')[1];
  if (!domain || !domain.includes('.')) {
    return {
      valid: false,
      warning: 'Email domain is invalid'
    };
  }

  // All checks passed
  return {
    valid: true
  };
}

/**
 * Check if email is a throwaway domain (for informational purposes)
 *
 * @param email - The email address to check
 * @returns true if email uses a known throwaway domain
 */
export function isThrowawayEmail(email: string): boolean {
  if (!email) return false;

  const lowerEmail = email.toLowerCase().trim();
  return THROWAWAY_DOMAINS.some(domain => lowerEmail.endsWith(domain));
}

/**
 * Check if email matches suspicious test patterns
 *
 * @param email - The email address to check
 * @returns true if email matches known test patterns
 */
export function isSuspiciousTestEmail(email: string): boolean {
  if (!email) return false;

  const lowerEmail = email.toLowerCase().trim();
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(lowerEmail));
}

/**
 * Get list of throwaway domains (for documentation/reference)
 *
 * @returns Array of known throwaway email domains
 */
export function getThrowawayDomains(): string[] {
  return [...THROWAWAY_DOMAINS];
}

/**
 * Suggest alternative for common test patterns
 *
 * @param email - The email address
 * @returns Suggestion for valid alternative
 */
export function suggestValidAlternative(email: string): string {
  if (!email) return 'Use a real email address you control';

  if (isThrowawayEmail(email)) {
    return 'Use a real email address like yourname@gmail.com, or use email aliases like yourname+test@gmail.com for testing';
  }

  if (isSuspiciousTestEmail(email)) {
    return 'For testing, use: npm run test:create-user (creates user without sending email)';
  }

  return 'Use a valid email address';
}
