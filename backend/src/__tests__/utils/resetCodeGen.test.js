import { describe, it, expect } from 'vitest';
import { generateResetCode, generateResetToken, isExpired, verifyResetCode } from '../../utils/resetCodeGen.js';

describe('resetCodeGen util', () => {
  it('should generate a 6-digit numeric reset code string', () => {
    const code = generateResetCode();
    expect(code).toBeDefined();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('should generate a reset token with code and future expiration date', () => {
    const { code, expiresAt } = generateResetToken();
    expect(code).toMatch(/^\d{6}$/);
    expect(expiresAt).toBeInstanceOf(Date);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should evaluate isExpired correctly', () => {
    expect(isExpired(null)).toBe(true);
    
    const pastDate = new Date(Date.now() - 5000);
    expect(isExpired(pastDate)).toBe(true);
    
    const futureDate = new Date(Date.now() + 60000);
    expect(isExpired(futureDate)).toBe(false);

    const pastISOString = pastDate.toISOString();
    expect(isExpired(pastISOString)).toBe(true);
  });

  it('should verify reset code successfully with valid inputs', () => {
    const code = '123456';
    const futureDate = new Date(Date.now() + 60000);
    
    const result = verifyResetCode(code, code, futureDate);
    expect(result).toEqual({ valid: true, reason: null });
  });

  it('should fail verification when inputs are missing', () => {
    const result = verifyResetCode('', '123456', new Date());
    expect(result).toEqual({ valid: false, reason: 'missing' });
  });

  it('should fail verification when code has expired', () => {
    const code = '123456';
    const pastDate = new Date(Date.now() - 1000);
    
    const result = verifyResetCode(code, code, pastDate);
    expect(result).toEqual({ valid: false, reason: 'expired' });
  });

  it('should fail verification when codes do not match', () => {
    const futureDate = new Date(Date.now() + 60000);
    
    const result = verifyResetCode('123456', '654321', futureDate);
    expect(result).toEqual({ valid: false, reason: 'invalid' });
  });
});
