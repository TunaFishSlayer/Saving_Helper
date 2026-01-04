import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(plainText) {
  if (!plainText) throw new Error('Password is required');
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText, hash) {
  if (!plainText || !hash) return false;
  return bcrypt.compare(plainText, hash);
}

export default { hashPassword, comparePassword };
