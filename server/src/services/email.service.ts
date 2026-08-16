import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export function isSmtpConfigured(): boolean {
  return Boolean(env.EMAIL_USER?.trim() && env.EMAIL_PASS?.trim());
}

const transporter = isSmtpConfigured()
  ? nodemailer.createTransport({
      host: env.EMAIL_HOST || 'smtp.gmail.com',
      port: env.EMAIL_PORT || 587,
      secure: env.EMAIL_PORT === 465,
      requireTLS: env.EMAIL_PORT === 587,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    })
  : null;

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const minutes = Math.max(1, Math.floor(env.OTP_TTL_SECONDS / 60));
  const subject = 'Your Smart Agro login code';
  const text = [
    'Smart Agro Community',
    '',
    `Your one-time login code is: ${otp}`,
    '',
    `This code expires in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
    'If you did not request this, you can ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1b2b41">
      <h2 style="margin:0 0 8px;color:#1b8a5a">Smart Agro Community</h2>
      <p style="margin:0 0 16px;color:#5b6b7c">Use this code to sign in. Do not share it with anyone.</p>
      <div style="background:#e8f7ef;border-radius:12px;padding:18px 20px;text-align:center;margin:0 0 16px">
        <div style="letter-spacing:0.35em;font-size:28px;font-weight:700;color:#145c3a">${otp}</div>
      </div>
      <p style="margin:0;font-size:13px;color:#7a8799">Expires in ${minutes} minute${minutes === 1 ? '' : 's'}.</p>
    </div>
  `;

  if (!transporter) {
    if (env.OTP_DEV_LOG || env.NODE_ENV !== 'production') {
      console.log(`[OTP_DEV] ${email}: ${otp}`);
      return;
    }
    throw new Error('Email transport not configured');
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM || env.EMAIL_USER,
    to: email,
    subject,
    text,
    html,
  });
}
