/**
 * Gateway performance check (SRS §9).
 *
 * Default is a laptop-safe smoke (20 VUs). For the documented 1000-user target:
 *
 *   k6 run -e VUS=1000 -e DURATION=1m server/tests/performance/k6-gateway.js
 *
 * Requires the API on http://127.0.0.1:5000
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.API_BASE || 'http://127.0.0.1:5000/api/v1';

export const options = {
  vus: Number(__ENV.VUS || 20),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
};

export default function () {
  const health = http.get(`${BASE}/health`);
  check(health, { 'health is 200': (r) => r.status === 200 });

  const weather = http.get(`${BASE}/weather/forecast?lat=16.8661&lng=96.1951`);
  check(weather, { 'weather is 200': (r) => r.status === 200 });

  sleep(1);
}
