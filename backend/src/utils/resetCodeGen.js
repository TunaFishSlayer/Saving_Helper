import crypto from 'crypto';

const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 10; // validity in minutes

export function generateResetCode() {
  const min = 10 ** (CODE_LENGTH - 1);
  const max = 10 ** CODE_LENGTH; // exclusive upper bound for crypto.randomInt
  return crypto.randomInt(min, max).toString();
}

export function generateResetToken() {
  const code = generateResetCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
  return { code, expiresAt };
}

export function isExpired(expiresAt) {
  if (!expiresAt) return true;
  const exp = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return Date.now() > exp.getTime();
}

export function verifyResetCode(providedCode, actualCode, expiresAt) {
  if (!providedCode || !actualCode) return { valid: false, reason: 'missing' };
  if (isExpired(expiresAt)) return { valid: false, reason: 'expired' };
  const valid = providedCode === actualCode;
  return { valid, reason: valid ? null : 'invalid' };
}

export default {
  generateResetCode,
  generateResetToken,
  isExpired,
  verifyResetCode,
};