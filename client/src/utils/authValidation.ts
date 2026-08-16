export type FieldStatus = 'idle' | 'valid' | 'invalid';

export function validateEmail(email: string): { status: FieldStatus; message: string } {
  const value = email.trim();
  if (!value) {
    return { status: 'idle', message: '' };
  }
  if (value.length < 5) {
    return { status: 'invalid', message: 'Email looks too short. Include your full address.' };
  }
  if (!value.includes('@')) {
    return { status: 'invalid', message: 'Add an @ symbol — for example farmer@example.com' };
  }
  const [local, domain] = value.split('@');
  if (!local || !domain) {
    return { status: 'invalid', message: 'Use a complete email like name@domain.com' };
  }
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return { status: 'invalid', message: 'Check the part before @ — dots can’t start, end, or double.' };
  }
  if (!domain.includes('.')) {
    return { status: 'invalid', message: 'Domain needs a dot — e.g. gmail.com or smartagro.local' };
  }
  if (/\s/.test(value)) {
    return { status: 'invalid', message: 'Remove spaces from the email address.' };
  }
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || /^[^\s@]+@[^\s@]+\.local$/.test(value);
  if (!ok) {
    return { status: 'invalid', message: 'That email format isn’t valid yet. Double-check spelling.' };
  }
  return { status: 'valid', message: 'Looks good' };
}

export function validatePassword(password: string): { status: FieldStatus; message: string } {
  if (!password) {
    return { status: 'idle', message: '' };
  }
  if (password.length < 8) {
    return {
      status: 'invalid',
      message: `At least ${8 - password.length} more character${8 - password.length === 1 ? '' : 's'}`,
    };
  }
  if (password.length > 128) {
    return { status: 'invalid', message: 'Password is too long.' };
  }
  return { status: 'valid', message: 'Looks good' };
}

export function validatePasswordConfirm(
  password: string,
  confirm: string
): { status: FieldStatus; message: string } {
  if (!confirm) {
    return { status: 'idle', message: '' };
  }
  if (confirm !== password) {
    return { status: 'invalid', message: 'Passwords do not match.' };
  }
  return { status: 'valid', message: 'Passwords match' };
}

export function friendlyAuthError(err: unknown): string {
  if (!(err instanceof Error)) {
    return 'Something went wrong. Please try again in a moment.';
  }

  const status =
    'status' in err && typeof (err as { status?: number }).status === 'number'
      ? (err as { status: number }).status
      : 0;
  const msg = err.message || '';

  if (status === 429 || /too many|wait/i.test(msg)) {
    return 'Too many attempts. Wait about a minute, then try again.';
  }
  if (status === 409 || /already exists/i.test(msg)) {
    return 'An account with this email already exists. Please log in.';
  }
  if (status === 401 || /invalid email or password/i.test(msg)) {
    return 'Incorrect email or password. Try again, or register a new account.';
  }
  if (status === 400 && /current password/i.test(msg)) {
    return 'Current password is incorrect.';
  }
  if (status === 400 && /at least 8/i.test(msg)) {
    return 'Password must be at least 8 characters.';
  }
  if (status === 403) {
    return 'This account is disabled. Contact an admin if you need access restored.';
  }
  if (status === 0 || /failed to fetch|network/i.test(msg)) {
    return 'Can’t reach the server. Make sure the API is running, then try again.';
  }
  if (msg) return msg;
  return 'Something went wrong. Please try again.';
}
