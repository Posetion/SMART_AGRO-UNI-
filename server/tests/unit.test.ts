import { describe, it, expect } from 'vitest';
import { assertPasswordStrength, hashPassword, verifyPassword } from '../src/utils/password.js';
import { generateOtpCode, hashOtp, verifyOtpHash } from '../src/utils/otp.js';
import { getPagination } from '../src/utils/pagination.js';
import { AppError } from '../src/utils/AppError.js';
import { diseaseNameMy } from '../src/config/diseases.js';
import { fieldTreatmentMy } from '../src/config/fieldTreatments.js';
import { normalizeDiseaseName } from '../src/services/heatmap.service.js';
import { otpRateLimiter, globalRateLimiter } from '../src/middleware/rateLimit.js';

describe('password utils', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('password123');
    expect(hash).not.toBe('password123');
    expect(await verifyPassword('password123', hash)).toBe(true);
    expect(await verifyPassword('wrong-pass', hash)).toBe(false);
  });

  it('rejects short passwords', () => {
    expect(() => assertPasswordStrength('short')).toThrow(/at least 8/i);
  });
});

describe('otp utils', () => {
  it('generates a 6-digit code and verifies the hash', async () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
    const hash = await hashOtp(code);
    expect(await verifyOtpHash(code, hash)).toBe(true);
    expect(await verifyOtpHash('000000', hash)).toBe(false);
  });
});

describe('pagination', () => {
  it('defaults to page 1 / limit 20', () => {
    expect(getPagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('caps limit at 50', () => {
    expect(getPagination({ page: 2, limit: 999 })).toEqual({ page: 2, limit: 50, skip: 50 });
  });
});

describe('AppError', () => {
  it('stores status and details', () => {
    const err = new AppError('Nope', 403, { reason: 'role' });
    expect(err.statusCode).toBe(403);
    expect(err.details).toEqual({ reason: 'role' });
    expect(err.isOperational).toBe(true);
  });
});

describe('disease catalog', () => {
  it('uses the local rice armyworm name နှံဖြတ်ပိုး', () => {
    expect(diseaseNameMy('Rice Armyworm')).toBe('နှံဖြတ်ပိုး');
  });

  it('returns a treatment protocol for a known pest', () => {
    const text = fieldTreatmentMy('Aphids');
    expect(text.length).toBeGreaterThan(10);
  });
});

describe('heatmap name normalize', () => {
  it('maps aliases to canonical disease names', () => {
    expect(normalizeDiseaseName('rice blast')).toBe('Blast');
    expect(normalizeDiseaseName('BPH')).toBe('Brown Planthopper');
    expect(normalizeDiseaseName('')).toBe('Unknown');
  });
});

describe('rate limiters', () => {
  it('are skipped in automated tests so the suite can run, but are configured for production', () => {
    expect(otpRateLimiter).toBeTypeOf('function');
    expect(globalRateLimiter).toBeTypeOf('function');
  });
});
