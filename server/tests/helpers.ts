import request from 'supertest';
import type { Express } from 'express';
import { User } from '../src/models/User.js';
import type { Role } from '../src/config/constants.js';

export const TEST_PASSWORD = 'password123';

/** Minimal valid 1×1 PNG */
export const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

export function mockOpenMeteoPayload() {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date('2026-08-01T00:00:00+06:30');
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  return {
    latitude: 16.8661,
    longitude: 96.1951,
    timezone: 'Asia/Yangon',
    current: {
      time: `${days[7]}T12:00`,
      temperature_2m: 32,
      relative_humidity_2m: 70,
      precipitation: 0,
      weather_code: 1,
      wind_speed_10m: 8,
      wind_direction_10m: 180,
      wind_gusts_10m: 12,
      apparent_temperature: 34,
      dew_point_2m: 24,
      uv_index: 7,
    },
    daily: {
      time: days,
      weather_code: days.map(() => 1),
      temperature_2m_max: days.map(() => 34),
      temperature_2m_min: days.map(() => 24),
      precipitation_sum: days.map(() => 2),
      precipitation_probability_max: days.map(() => 20),
      wind_speed_10m_max: days.map(() => 12),
      sunrise: days.map((d) => `${d}T05:45`),
      sunset: days.map((d) => `${d}T18:30`),
      uv_index_max: days.map(() => 8),
    },
  };
}

export async function registerAndLogin(
  app: Express,
  role: Role = 'farmer',
  extra?: { email?: string; fullName?: string }
) {
  const email = extra?.email || `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  const fullName = extra?.fullName || `Test ${role}`;

  const registerRes = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password: TEST_PASSWORD, fullName });

  if (registerRes.status !== 201) {
    throw new Error(`Register failed ${registerRes.status}: ${JSON.stringify(registerRes.body)}`);
  }

  if (role !== 'farmer') {
    await User.updateOne({ email: email.toLowerCase() }, { role });
  }

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: TEST_PASSWORD });

  if (loginRes.status !== 200) {
    throw new Error(`Login failed ${loginRes.status}: ${JSON.stringify(loginRes.body)}`);
  }

  return {
    email,
    token: loginRes.body.data.accessToken as string,
    refreshToken: loginRes.body.data.refreshToken as string,
    userId: loginRes.body.data.user.id as string,
    role,
  };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
