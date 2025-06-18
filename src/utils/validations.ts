
import validator from 'validator';

// Email validation utility function using validator library (RFC 5322 standard)
export const isValidEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

// Additional validation utilities can be added here
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

export const isValidName = (name: string): boolean => {
  return name.trim().length > 0;
};
