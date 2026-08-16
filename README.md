# Smart Agro Community

MERN platform for Myanmar rice and onion farmers: social feed, AI disease detection, knowledge center, weather, heatmap, and chatbot.

See [docs/SRS-Smart-Agro-Community.md](docs/SRS-Smart-Agro-Community.md) for full requirements (v4.1).

## Monorepo

| Path | Stack | Port |
|------|--------|------|
| `server/` | Node.js 20+ / Express / TypeScript / MongoDB | 5000 |
| `ai-service/` | Python FastAPI + OpenCV stubs | 8000 |
| `client/` | React 19 / Vite / TypeScript / PWA | 5173 |

## Prerequisites

- Node.js 20+
- MongoDB 6+ (local or Atlas)
- Python 3.10+ (for AI service)
- Git

## Quick start

### 1. Database

Start MongoDB locally, or set `MONGODB_URI` in `server/.env` to an Atlas connection string.

### 2. API Gateway

```bash
cd server
cp .env.example .env
npm install
npm run seed
npm run dev
```

Health check: `GET http://localhost:5000/api/v1/health`

OTP emails: if SMTP is empty, OTP codes are printed to the server console (`OTP_DEV_LOG=true`).

### 3. AI microservice

```bash
cd ai-service
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health: `GET http://localhost:8000/ai/health`

If AI is down, the API uses development mocks for detect/chat (non-production).

### 4. React client

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the gateway.

### 5. Tests (API)

```bash
cd server
npm test
```

## Default seeded accounts

After `npm run seed` in `server/`:

- Admin: `admin@smartagro.local` (request OTP to sign in)
- Expert: `expert@smartagro.local`
- Sample townships: Yangon, Mandalay, Naypyidaw, Bago, Pathein
- One published knowledge article

Promote a user to admin/expert via `PUT /api/v1/admin/users/:id` with an admin token, or re-run seed.

## Deploy notes

- Frontend: Vercel / Netlify / S3+CloudFront
- Backend: Node host (EC2, Render, etc.) behind HTTPS
- MongoDB: Atlas recommended
- AI: private network only; do not expose `:8000` publicly
- PWA caches static assets only (no offline-first data sync)

## API prefix

All gateway routes: `/api/v1/*` as specified in the SRS.
