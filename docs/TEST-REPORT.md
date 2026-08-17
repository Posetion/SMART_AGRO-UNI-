# Smart Agro — System Testing Report

**Project:** Smart Agro Community  
**Team:** University of Computer Studies (Meiktila)  
**Date:** 17 August 2026  
**Purpose:** Evidence for UCS Meiktila evaluation criterion **4. Software Quality & Architecture — System Testing** (functional testing, unit testing, bug management). Also covers SRS §9 test types.

---

## 1. How to run

| Suite | Command | What it proves |
|---|---|---|
| API unit + integration + SRS flows | `npm test` | Auth, RBAC, validation, detect, social, knowledge, weather, heatmap, chatbot, admin, security |
| Coverage HTML | `npm run test:coverage` | Open `server/coverage/index.html` |
| Browser UI smoke | `npm run test:e2e` | Landing + login validation (Playwright) |
| Live route smoke | `npm run test:routes` | Needs API on port 5000 |
| Load / performance | `k6 run server/tests/performance/k6-gateway.js` | Gateway health + weather under concurrent users |

AI (Gemini) is **mocked** in detection/chat tests so the suite does not depend on Google HTTPS. Weather Open-Meteo is **mocked** in `server/tests/setup.ts`. Playwright uses the **installed Google Chrome** (`channel: 'chrome'`), so `npx playwright install` is not required on this machine.

---

## 1b. Latest run (17 August 2026)

| Suite | Result |
|---|---|
| Server Vitest (`npm run test:server`) | **57 / 57 passed** (12 files) |
| Client Vitest (`npm run test:client`) | **8 / 8 passed** |
| Playwright UI smoke (`npm run test:e2e`) | **2 / 2 passed** |
| Combined `npm test` | **65 / 65 passed** |
| Scoped coverage (`npm run test:coverage`) | **63.5% lines** on utils / middleware / validators / selected services. HTML: `server/coverage/index.html` |

---

## 2. Unit testing

| Area | File |
|---|---|
| Password hash/verify, OTP hash, pagination, AppError | `server/tests/unit.test.ts` |
| Disease catalog (Rice Armyworm = နှံဖြတ်ပိုး), heatmap aliases | `server/tests/unit.test.ts` |
| Client email/password validation | `client/src/utils/authValidation.test.ts` |
| Lab treatment builder (blast chemicals, healthy = no spray) | `client/src/utils/authValidation.test.ts` |

---

## 3. Functional / integration testing

| Area | File |
|---|---|
| Register, login, refresh, logout, change password | `server/tests/auth.test.ts` |
| Validation, duplicate email, guest login, profile update | `server/tests/auth-validation.test.ts` |
| Knowledge list/search/admin create | `server/tests/knowledge.test.ts` |
| Community post, comment, like, admin hide | `server/tests/social.test.ts` |
| Detect + history + expert verify | `server/tests/detection.test.ts` |
| Weather forecast / current / alerts / township | `server/tests/weather.test.ts` |
| Heatmap filter + admin statistics | `server/tests/heatmap.test.ts` |
| Chatbot Myanmar reply | `server/tests/chatbot.test.ts` |
| Admin dashboard KPIs | `server/tests/admin.test.ts` |

---

## 4. SRS §9 mandatory flows (`server/tests/e2e-flows.test.ts`)

The SRS listed OTP login. The live app uses **email + password** (OTP routes were removed). Flows are automated against that live auth.

1. Guest views weather + published knowledge  
2. Farmer registers and logs in  
3. Farmer uploads a leaf and receives a diagnosis  
4. Expert verifies; farmer links the diagnosis on a community post  
5. Admin moderates (hides) a post  
6. Farmer chatbot round-trip in Burmese  
7. Heatmap filter by disease and date  

Browser smoke (Playwright) covers landing load and login field validation without needing the API.

---

## 5. Security testing (OWASP-oriented)

File: `server/tests/security.test.ts`

| Check | Result expected |
|---|---|
| Missing / garbage / wrong-secret / expired JWT | 401 |
| Farmer accessing admin dashboard or moderate API | 403 |
| Fake image upload (wrong magic bytes) | 400 |
| Detect with no file | 400 |
| Login / register rate limit | Enabled in production (`otpRateLimiter` max 5/min). Skipped in `NODE_ENV=test` so the suite does not flake. |

Helmet, CORS, Zod validation, bcrypt, and file-type sniffing are exercised by the API tests above.

---

## 6. Performance testing

`server/tests/performance/k6-gateway.js`

- Default: **20 virtual users / 30s** (safe on a laptop).  
- SRS target of **1000 concurrent users**:

```bash
k6 run -e VUS=1000 -e DURATION=1m server/tests/performance/k6-gateway.js
```

Thresholds: <5% HTTP failures, p95 < 3s. Requires a running API.

---

## 7. Bug management

| ID | Symptom | Fix / status |
|---|---|---|
| B1 | Messages 500 when a friend user was deleted | Skip null users in friend list |
| B2 | Detect `fetch failed` when Gemini is blocked | Retry + Cursor + local AI fallback |
| B3 | Lab report had symptoms + controls only | Always include Treatment for all crops |
| B4 | Rice armyworm shown as စပါးတပ်ပိုး | Display name နှံဖြတ်ပိုး |
| B5 | Community / auth regressions | Covered by social + auth automated tests |

Admin **Audit log** (`GET /admin/audit-logs`) records role changes, moderation, and diagnosis verify for operational bug trace.

---

## 8. Honest limits (do not over-claim in the defence)

- Client has **unit tests**, not full React component coverage.  
- Playwright is a **UI smoke**, not a full 7-flow browser recording. The seven SRS flows run as API E2E.  
- Scoped coverage on this run is **63.5% lines** (utils ~96%, auth.service ~85%, heatmap.service ~88%, social.service ~30% because friends/blocks/reports are thinner). Do not claim 80% overall.  
- k6 **1000 VU** needs a dedicated host; the script is provided.

This is still enough to show **unit tests, functional tests, security tests, a performance script, and a bug log** for criterion 4.
