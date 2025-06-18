
import DOMPurify from 'dompurify';

// Enhanced XSS protection using DOMPurify
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

// Comprehensive input sanitization
export const sanitizeUserInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/['"]/g, '') // Remove quotes
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 1000); // Limit length
};

// SQL injection protection for search terms
export const sanitizeSearchTerm = (term: string): string => {
  if (!term || typeof term !== 'string') return '';
  
  return term
    .replace(/[';\\]/g, '') // Remove SQL injection characters
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment start
    .replace(/\*\//g, '') // Remove block comment end
    .trim()
    .substring(0, 100);
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Validate password strength
export const validatePassword = (password: string): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rate limiting helper (client-side tracking)
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }
    
    const keyAttempts = this.attempts.get(key)!;
    
    // Remove old attempts outside the window
    const recentAttempts = keyAttempts.filter(time => time > windowStart);
    this.attempts.set(key, recentAttempts);
    
    return recentAttempts.length >= maxAttempts;
  }
  
  recordAttempt(key: string): void {
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }
    
    this.attempts.get(key)!.push(Date.now());
  }
}

export const rateLimiter = new RateLimiter();

// CSRF token generator (for forms)
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Secure filename sanitization
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/^\./, '') // Remove leading dot
    .substring(0, 255) // Limit length
    .trim();
};

// Content Security Policy helper
export const getCSPHeader = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://yetjkfmxteupnoibhfmd.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://yetjkfmxteupnoibhfmd.supabase.co wss://yetjkfmxteupnoibhfmd.supabase.co",
    "media-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
};
