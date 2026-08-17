import { describe, expect, it } from 'vitest';
import {
  friendlyAuthError,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from './authValidation';
import { diseaseNameMy } from '../data/diseaseNames';
import { labTreatmentFor } from '../data/diseaseGuides';

describe('authValidation', () => {
  it('accepts a normal email and a .local farm email', () => {
    expect(validateEmail('farmer@gmail.com').status).toBe('valid');
    expect(validateEmail('admin@smartagro.local').status).toBe('valid');
  });

  it('rejects missing @ or spaces', () => {
    expect(validateEmail('not-an-email').status).toBe('invalid');
    expect(validateEmail('a b@c.com').status).toBe('invalid');
  });

  it('requires 8+ character passwords', () => {
    expect(validatePassword('short').status).toBe('invalid');
    expect(validatePassword('password123').status).toBe('valid');
  });

  it('checks confirm password', () => {
    expect(validatePasswordConfirm('password123', 'password123').status).toBe('valid');
    expect(validatePasswordConfirm('password123', 'other').status).toBe('invalid');
  });

  it('maps API errors to farmer-friendly text', () => {
    expect(friendlyAuthError(Object.assign(new Error('fail'), { status: 401 }))).toMatch(
      /incorrect email or password/i
    );
    expect(friendlyAuthError(Object.assign(new Error('exists'), { status: 409 }))).toMatch(
      /already exists/i
    );
  });
});

describe('disease names and treatment', () => {
  it('labels rice armyworm as နှံဖြတ်ပိုး', () => {
    expect(diseaseNameMy('Rice Armyworm')).toBe('နှံဖြတ်ပိုး');
  });

  it('builds a treatment section for rice blast', () => {
    const t = labTreatmentFor({ disease: 'Blast', crop: 'Rice' });
    expect(t.stepsMy.length).toBeGreaterThan(0);
    expect(t.stepsEn.length).toBeGreaterThan(0);
    expect(t.chemicals.length).toBeGreaterThan(0);
  });

  it('does not recommend spray on a healthy plant', () => {
    const t = labTreatmentFor({ disease: 'Healthy', crop: 'Rice' });
    expect(t.chemicals).toEqual([]);
    expect(t.stepsMy[0]).toMatch(/မလိုပါ/);
  });
});
