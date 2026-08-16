import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export function generateOtpCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function verifyOtpHash(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}
