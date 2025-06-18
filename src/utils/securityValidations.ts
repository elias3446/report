
import { useSecurity } from '@/hooks/useSecurity';

// Enhanced email validation with security checks
export const validateSecureEmail = (email: string): { isValid: boolean; error?: string } => {
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Formato de email inválido' };
  }

  // Length check
  if (email.length > 254) {
    return { isValid: false, error: 'Email demasiado largo' };
  }

  // Check for suspicious patterns
  if (email.includes('..') || email.includes('--')) {
    return { isValid: false, error: 'Email contiene patrones sospechosos' };
  }

  return { isValid: true };
};

// Enhanced password validation
export const validateSecurePassword = (password: string): { isValid: boolean; error?: string; strength: number } => {
  let strength = 0;
  const errors: string[] = [];

  // Minimum length
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  } else {
    strength += 1;
  }

  // Contains uppercase
  if (/[A-Z]/.test(password)) {
    strength += 1;
  } else {
    errors.push('Debe contener al menos una mayúscula');
  }

  // Contains lowercase
  if (/[a-z]/.test(password)) {
    strength += 1;
  } else {
    errors.push('Debe contener al menos una minúscula');
  }

  // Contains number
  if (/\d/.test(password)) {
    strength += 1;
  } else {
    errors.push('Debe contener al menos un número');
  }

  // Contains special character
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    strength += 1;
  } else {
    errors.push('Debe contener al menos un carácter especial');
  }

  // Check for common patterns
  const commonPatterns = ['123456', 'password', 'qwerty', 'admin'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('No debe contener patrones comunes');
    strength = Math.max(0, strength - 2);
  }

  const isValid = errors.length === 0 && strength >= 4;
  
  return {
    isValid,
    error: errors.length > 0 ? errors[0] : undefined,
    strength: Math.min(5, strength)
  };
};

// Sanitize HTML content to prevent XSS
export const sanitizeHtml = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// Validate file upload security
export const validateFileUploadSecurity = (file: File): { isValid: boolean; error?: string } => {
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { isValid: false, error: 'El archivo es demasiado grande (máximo 10MB)' };
  }

  // Check file type (only images)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Tipo de archivo no permitido. Solo se permiten imágenes.' };
  }

  // Check filename for suspicious patterns
  const suspiciousPatterns = ['.exe', '.bat', '.cmd', '.scr', '.js', '.php', '.asp'];
  const filename = file.name.toLowerCase();
  if (suspiciousPatterns.some(pattern => filename.includes(pattern))) {
    return { isValid: false, error: 'Nombre de archivo sospechoso detectado' };
  }

  // Check for double extensions
  const parts = filename.split('.');
  if (parts.length > 2) {
    return { isValid: false, error: 'Múltiples extensiones no permitidas' };
  }

  return { isValid: true };
};

// Rate limiting check (basic client-side)
const requestCounts = new Map<string, { count: number; lastReset: number }>();

export const checkRateLimit = (key: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || now - entry.lastReset > windowMs) {
    requestCounts.set(key, { count: 1, lastReset: now });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
};

// Generate CSRF token (basic implementation)
export const generateCSRFToken = (): string => {
  return btoa(Math.random().toString(36).substring(2) + Date.now().toString(36));
};

// Validate CSRF token
export const validateCSRFToken = (token: string, storedToken: string): boolean => {
  return token === storedToken && token.length > 10;
};
