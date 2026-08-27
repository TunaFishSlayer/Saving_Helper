import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../../utils/hash.js';

describe('hash util', () => {
  it('should hash a plain text password', async () => {
    const password = 'mySecretPassword123';
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(typeof hash).toBe('string');
  });

  it('should throw an error if password is not provided to hashPassword', async () => {
    await expect(hashPassword('')).rejects.toThrow('Password is required');
  });

  it('should return true when comparing correct password with hash', async () => {
    const password = 'correctPassword';
    const hash = await hashPassword(password);
    
    const isValid = await comparePassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should return false when comparing incorrect password with hash', async () => {
    const password = 'correctPassword';
    const hash = await hashPassword(password);
    
    const isValid = await comparePassword('wrongPassword', hash);
    expect(isValid).toBe(false);
  });

  it('should return false if plainText or hash is missing in comparePassword', async () => {
    expect(await comparePassword('', 'someHash')).toBe(false);
    expect(await comparePassword('password', '')).toBe(false);
    expect(await comparePassword(null, null)).toBe(false);
  });
});
