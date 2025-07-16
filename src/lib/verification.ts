// Utility functions for generating verification codes

// Generate secure 6-character apartment verification code
// Uses only clearly distinguishable characters (no 0, O, I, 1, etc.)
export function generateApartmentVerificationCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// Generate 6-digit email verification code
export function generateEmailVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}