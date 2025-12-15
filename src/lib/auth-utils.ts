import CryptoJS from 'crypto-js';

// Hash password using SHA-256
export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

// Verify password
export const verifyPassword = (password: string, hash: string): boolean => {
  const passwordHash = CryptoJS.SHA256(password).toString();
  return passwordHash === hash;
};

