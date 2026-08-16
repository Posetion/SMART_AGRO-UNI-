# Software Requirements Specification (SRS)
## Smart Agro Community

| Field | Value |
|-------|-------|
| **Document Version** | 4.1 |
| **Status** | Baseline for Implementation |
| **Last Updated** | July 19, 2026 |
| **Platform** | Smart Agro Community |
| **Stack** | MERN (MongoDB, Express.js, React, Node.js) + Python AI Microservices |
| **Primary Users** | Rice and onion farmers in Myanmar |

---

## Revision History

| Version | Date | Summary |
|---------|------|---------|
| 4.0 | July 19, 2026 | MERN stack, six core features; Nginx and offline-first removed |
| 4.1 | July 19, 2026 | Resolved auth/public-route conflicts; added refresh tokens, township geocoding, moderation APIs, clarified PWA/voice/SLAs, expert vs admin roles |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [External Interface Requirements](#3-external-interface-requirements)
4. [System Features](#4-system-features)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Functional Architecture & Endpoint Mapping](#6-functional-architecture--endpoint-mapping)
7. [Data Models (MongoDB Collections)](#7-data-models-mongodb-collections)
8. [Development Environment Setup](#8-development-environment-setup)
9. [Testing Requirements](#9-testing-requirements)
10. [Deployment Considerations](#10-deployment-considerations)
11. [Open Risks & Constraints](#11-open-risks--constraints)
12. [Appendix](#12-appendix)

---

## 1. Introduction

### 1.1 Purpose

This document specifies the complete Software Requirements Specification (SRS) for the **Smart Agro Community** platform. The platform is an agricultural ecosystem delivering **six core features** for rice and onion farmers in Myanmar:

1. **Social Mechanism** — Community interaction and knowledge sharing  
2. **AI Crop Disease Detection & Prediction** — Image-based diagnosis and weather-driven risk forecasting  
3. **Knowledge Center** — Admin-managed repository of books, articles, and journals  
4. **Weather Prediction** — Free weather forecasting without API keys  
5. **Heatmap** — Regional disease outbreak visualization  
6. **AI Chatbot** — Conversational AI with Voice-to-Text and Text-to-Voice capabilities  

This SRS is the authoritative source for functional scope, APIs, data models, and non-functional targets for design, implementation, and testing.

### 1.2 Scope

| In Scope | Out of Scope |
|----------|--------------|
| MERN Stack web application (React SPA + Express API + MongoDB) | Native iOS/Android apps |
| Progressive Web App (PWA): installable + static asset caching only | Offline-first / full offline CRUD |
| Python AI microservices (disease detection, risk prediction, chatbot LLM) | Nginx as a required component |
| Email + OTP authentication with JWT + refresh tokens | Traditional email/password authentication |
| Internet-connected full functionality | Local-only / air-gapped operation |
| Rice and onion disease coverage listed in §4.2 | Other crop types (future phases) |

**Architecture summary**

- Front-end: React Single Page Application (SPA), TypeScript, Vite, PWA-enabled  
- Back-end: Node.js / Express.js API Gateway  
- AI: Separate Python microservices (FastAPI or Flask) over HTTP  
- Auth: Email + OTP → JWT access token + refresh token  
- Connectivity: Internet required for authenticated and AI features  

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| MERN | MongoDB, Express.js, React, Node.js |
| AI | Artificial Intelligence |
| OTP | One-Time Password |
| GIS | Geographic Information System |
| NLP | Natural Language Processing |
| TTS | Text-to-Speech |
| STT | Speech-to-Text |
| JWT | JSON Web Token |
| PWA | Progressive Web Application |
| GridFS | MongoDB file storage system |
| GeoJSON | Geographic data format for MongoDB |
| SLA | Service Level Agreement |
| SPA | Single Page Application |
| TTL | Time To Live |
| CSRF | Cross-Site Request Forgery |
| XSS | Cross-Site Scripting |

### 1.4 References

| Reference | Usage |
|-----------|-------|
| Open-Meteo Forecast API | Weather data (no API key) |
| MongoDB GeoJSON / 2dsphere | Heatmap spatial queries |
| Web Speech API (W3C) | Client-side STT/TTS |
| OWASP Top 10 | Security test baseline |

---

## 2. Overall Description

### 2.1 Product Perspective

Smart Agro Community is a MERN Stack-based web system:

```
React SPA/PWA ──HTTP/HTTPS──► Express API Gateway ──► MongoDB
                                      │
                                      ├──► Python AI Microservice
                                      └──► Open-Meteo Weather API
```

- The React client calls only the Node.js API Gateway (no direct browser calls to AI internals except as documented for voice).  
- Python AI microservices run as separate processes/servers and handle ML/LLM workloads.  
- All inter-service communication uses HTTP/HTTPS.  
- File binaries are stored in MongoDB GridFS or AWS S3; URLs/metadata live in MongoDB collections.

### 2.2 Product Functions

| Feature | Summary |
|---------|---------|
| **Social Mechanism** | Post creation, commenting, nested replies, image sharing, linking to verified diagnostic records, admin moderation |
| **AI Crop Disease Detection & Prediction** | Image quality checks, multi-class disease classification, severity, weather-based outbreak risk, Burmese treatment protocols |
| **Knowledge Center** | Admin CRUD for books, articles, journals; search/filter; in-browser PDF/text viewing; versioning |
| **Weather Prediction** | Open-Meteo integration: current conditions, 7-day forecast, township-based lookup, severe weather alerts |
| **Heatmap** | Township-level disease density with color-coded risk; GeoJSON boundaries; filter by disease/date |
| **AI Chatbot** | Text chat with agriculture-oriented LLM; client Web Speech STT/TTS; Burmese support; per-user history |

### 2.3 User Classes and Characteristics

| User Class | Description | Permissions |
|------------|-------------|-------------|
| **Guest** | Unauthenticated visitor | Read published Knowledge Center content; weather forecast/current/alerts; public heatmap read endpoints |
| **Farmer** | Primary operational user | Full access to all six features after Email + OTP authentication |
| **Expert** | Domain reviewer | Farmer permissions + review/verify AI diagnoses + validate heatmap-related diagnostic data; **cannot** manage users, roles, backups, or system audit configuration |
| **Admin** | System orchestrator | All Expert permissions + Knowledge Center CRUD + social moderation + user/role management + audit logs + dashboard + backup triggers |

> **Role clarification:** `expert` and `admin` are distinct. Experts focus on clinical/diagnostic validation; Admins own content, moderation, and platform operations.

### 2.4 Design and Implementation Constraints

| Constraint | Requirement |
|------------|-------------|
| **Technology Stack** | Must use MERN Stack (MongoDB, Express.js, React, Node.js) |
| **Authentication Method** | Email + OTP only; no email/password schemas |
| **Session Tokens** | JWT access token (short-lived) + refresh token (7-day family); see §5.2 |
| **Client Architecture** | React 19 (TypeScript) with Vite; PWA-enabled (installable + static cache only) |
| **Database** | MongoDB 6.0+ with GeoJSON / 2dsphere indexes |
| **File Storage** | MongoDB GridFS or cloud object storage (e.g., AWS S3) |
| **Voice Features** | Browser Web Speech API for STT/TTS; server receives transcribed text only |
| **AI Microservices** | Python (FastAPI or Flask) with TensorFlow/PyTorch; HTTP to Node.js gateway |
| **Language** | Full Burmese UI (UTF-8); chatbot and treatment protocols in Burmese |
| **PWA Scope** | App shell / static assets may be cached; **no** offline-first data sync for posts, diagnoses, or chat |

### 2.5 Assumptions and Dependencies

| ID | Assumption / Dependency |
|----|-------------------------|
| A-1 | Users have a valid email address reachable for OTP delivery |
| A-2 | Users have internet connectivity for authenticated and AI features |
| A-3 | Open-Meteo remains free and reachable without an API key |
| A-4 | Browser supports Web Speech API for voice features (Chrome/Edge preferred); Burmese STT/TTS quality is browser/OS dependent |
| A-5 | Township boundary GeoJSON and township→lat/lng lookup data are available for Myanmar target regions |
| A-6 | AI model artifacts (disease CNN + LLM) are deployable on the AI service host |

---

## 3. External Interface Requirements

### 3.1 User Interfaces

The UI must be responsive across Mobile, Tablet, Laptop, and 4K viewports.

| Viewport | Interface Design |
|----------|------------------|
| **Mobile / Tablet** | Fixed bottom navigation bar; ergonomic hamburger / overflow menu for secondary actions |
| **Desktop / 4K** | Fixed collapsible sidebar; dashboard telemetry widgets for Farmer/Expert/Admin as role-appropriate |

**Usability targets:** mobile-first layout, touch-friendly controls, high-contrast option, readable Burmese typography.

### 3.2 Software Interfaces

| Component | Technology |
|-----------|------------|
| Database | MongoDB 6.0+ (local or MongoDB Atlas) |
| Backend Framework | Node.js 20+ with Express.js 4.x |
| Frontend Framework | React 19 (TypeScript) with Vite |
| AI Microservices | Python 3.10+ (FastAPI/Flask) with TensorFlow/PyTorch |
| Weather API | Open-Meteo (`https://api.open-meteo.com/v1`) — no API key |
| Chatbot Model | Open-source LLM (LLaMA, Mistral) or agriculture-fine-tuned model |
| Authentication | JWT access + refresh tokens |
| File Storage | MongoDB GridFS or AWS S3 |
| Voice | Web Speech API (browser-based STT/TTS) |
| Email (OTP) | SMTP (e.g., Gmail App Password or transactional provider) |

### 3.3 Communication Interfaces

| Channel | Protocol | Notes |
|---------|----------|-------|
| Browser ↔ API Gateway | HTTPS (prod), HTTP (local dev) | JSON request/response; multipart for image uploads |
| API Gateway ↔ MongoDB | MongoDB wire protocol | Mongoose ODM |
| API Gateway ↔ AI Service | HTTP | Internal network preferred in production |
| API Gateway ↔ Open-Meteo | HTTPS | Server-side proxy recommended to control caching/rate limits |
| Browser Voice | Web Speech API | No audio binary required on server for MVP |

---

## 4. System Features

### 4.1 Social Mechanism

**Priority:** High  

**Description:** A platform for farmers to share experiences, ask for help, and engage in discussions.

#### Functional Requirements

| ID | Requirement |
|----|-------------|
| **REQ-4.1.1** | Authenticated users can create text and image posts |
| **REQ-4.1.2** | Users can comment, reply (nested replies, one level deep in MVP), and like/unlike posts |
| **REQ-4.1.3** | Posts may link only to the author's **verified** AI diagnostic records (`isVerified: true`) |
| **REQ-4.1.4** | Admins can moderate: hide, restore, or permanently remove inappropriate content |
| **REQ-4.1.5** | Posts are displayed in a chronological feed with cursor or page-based pagination |
| **REQ-4.1.6** | Image uploads: max 5 images per post; max 5 MB each; JPEG/PNG/WebP only; magic-number verified server-side |

#### Data Model (embedded in Posts collection — see §7.4)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  content: String,
  images: [String], // GridFS or S3 URLs
  diagnosticId: ObjectId, // Optional; must reference verified diagnosis owned by userId
  likes: [ObjectId],
  comments: [
    {
      _id: ObjectId,
      userId: ObjectId,
      content: String,
      replies: [
        {
          _id: ObjectId,
          userId: ObjectId,
          content: String,
          timestamp: Date
        }
      ],
      timestamp: Date
    }
  ],
  isActive: Boolean, // false when moderated/hidden
  moderatedBy: ObjectId,
  moderatedAt: Date,
  moderationReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 4.2 AI Crop Disease Detection & Prediction

**Priority:** Critical  

**Description:** Image-based disease classification and weather-based outbreak risk prediction for rice and onion.

#### Functional Requirements

| ID | Requirement |
|----|-------------|
| **REQ-4.2.1** | Image quality validation (brightness, blur, exposure) using OpenCV before inference |
| **REQ-4.2.2** | Multi-class classification returns: crop type, disease, severity index (0–100), top-3 class probabilities |
| **REQ-4.2.3** | Must recognize: **Rice** — Blast, Brown Spot, Bacterial Leaf Blight, Sheath Blight, Leaf Smut, Tungro; **Onion** — Stemphylium Blight, Onion Smut; plus Healthy / Unknown as needed |
| **REQ-4.2.4** | Weather-based risk prediction for upcoming weeks: `Low`, `Medium`, `High`, `Outbreak_Imminent` |
| **REQ-4.2.5** | Display treatment protocol in Burmese |
| **REQ-4.2.6** | Persist all diagnostics with results, location, timestamp, and weather conditions in MongoDB |
| **REQ-4.2.7** | Experts/Admins can verify or correct diagnoses; verification sets `isVerified` and `verifiedBy` |
| **REQ-4.2.8** | If AI service is unavailable, API returns a structured error and does not partially write a completed diagnosis |

#### Supported Diseases

| Crop | Diseases |
|------|----------|
| Rice | Blast, Brown Spot, Bacterial Leaf Blight, Sheath Blight, Leaf Smut, Tungro |
| Onion | Stemphylium Blight, Onion Smut |

#### Data Model

See **§7.3 Diagnoses Collection**.

---

### 4.3 Knowledge Center

**Priority:** High  

**Description:** Admin-managed repository of agricultural knowledge resources.

#### Functional Requirements

| ID | Requirement |
|----|-------------|
| **REQ-4.3.1** | Content categorized into `Book`, `Article`, and `Journal` |
| **REQ-4.3.2** | Admin CRUD for all content (create, read, update, soft/hard delete) |
| **REQ-4.3.3** | Search and filter by title, category, tags, and date range |
| **REQ-4.3.4** | In-browser viewing of PDF and text formats |
| **REQ-4.3.5** | Version tracking: increment `version` on update; append entry to `versionHistory` |
| **REQ-4.3.6** | Guests and authenticated users may read **published** content only; drafts are Admin-only |

#### Data Model

See **§7.5 Knowledge Collection**.

---

### 4.4 Weather Prediction

**Priority:** Medium  

**Description:** Free weather forecasting without API keys, proxied through the API Gateway.

#### Functional Requirements

| ID | Requirement |
|----|-------------|
| **REQ-4.4.1** | Integrate Open-Meteo or equivalent free API (no API key required) |
| **REQ-4.4.2** | Display temperature, humidity, rainfall, wind speed, and 7-day forecast |
| **REQ-4.4.3** | Township-based weather via township → coordinates lookup (§7.8), then Open-Meteo lat/lng query |
| **REQ-4.4.4** | Severe weather alerts (heavy rain, storms, extreme heat/wind) derived from forecast thresholds |
| **REQ-4.4.5** | Cache weather responses server-side (recommended TTL: 15–30 minutes per lat/lng) to respect rate limits |

#### API Integration

| Item | Detail |
|------|--------|
| Endpoint | `https://api.open-meteo.com/v1/forecast` |
| Parameters | `latitude`, `longitude`, `current_weather`, `hourly`, `daily` |
| Response fields used | Temperature, humidity, precipitation, wind speed, daily forecast |

Gateway routes (public): `/api/v1/weather/*` — see §6.2.

---

### 4.5 Heatmap

**Priority:** Medium  

**Description:** Township-level disease outbreak density visualization.

#### Functional Requirements

| ID | Requirement |
|----|-------------|
| **REQ-4.5.1** | Store geolocation using MongoDB GeoJSON (`Point`, `Polygon`) with 2dsphere indexes |
| **REQ-4.5.2** | Display disease density with color codes on township boundaries: Green (low), Yellow (medium), Red (high) |
| **REQ-4.5.3** | Filter by disease type and date range |
| **REQ-4.5.4** | Near-real-time updates: client polls heatmap data every 30–60 seconds while the map view is open (WebSocket optional in a later phase) |
| **REQ-4.5.5** | Township boundaries stored as GeoJSON Polygons |
| **REQ-4.5.6** | New verified (or all recorded — product choice default: **all diagnoses**) update disease location points used in aggregation |

**Risk color mapping (default thresholds — configurable):**

| Risk Level | Color | Example threshold |
|------------|-------|-------------------|
| Low | Green | outbreakCount &lt; N1 |
| Medium | Yellow | N1 ≤ count &lt; N2 |
| High | Red | count ≥ N2 |

#### Data Models

See **§7.7 Heatmap Collections**.

---

### 4.6 AI Chatbot

**Priority:** Medium  

**Description:** Conversational AI with voice input/output. Voice capture and playback run in the browser; the server processes text.

#### Functional Requirements

| ID | Requirement |
|----|-------------|
| **REQ-4.6.1** | Text-based conversation with AI responses via gateway → AI `/ai/chat` |
| **REQ-4.6.2** | Voice-to-Text using **browser Web Speech API**; transcribed text is sent as a normal chat message |
| **REQ-4.6.3** | Text-to-Voice using **browser Web Speech API** on bot reply text |
| **REQ-4.6.4** | Agriculture-oriented LLM (LLaMA/Mistral or fine-tuned) grounded on Knowledge Center content where feasible |
| **REQ-4.6.5** | Full Burmese language support for prompts and replies |
| **REQ-4.6.6** | Conversation history saved per user and session |
| **REQ-4.6.7** | No mandatory server-side audio processing in MVP (optional `audioUrl` reserved for future TTS storage) |

#### Voice Architecture (MVP)

```
User speaks → Browser STT → text → POST /api/v1/chatbot/message
Bot text ← API ← AI /ai/chat
Bot text → Browser TTS → spoken output
```

#### Data Model

See **§7.6 Chatbot Sessions Collection**.

---

### 4.7 Authentication & Account

**Priority:** Critical  

#### Functional Requirements

| ID | Requirement |
|----|-------------|
| **REQ-4.7.1** | User requests OTP by email; system emails a 6-digit numeric OTP |
| **REQ-4.7.2** | OTP TTL: 3 minutes; max 3 verification attempts; single-use |
| **REQ-4.7.3** | Resend cooldown: minimum 60 seconds between OTP requests for the same email |
| **REQ-4.7.4** | On success: issue short-lived JWT access token + refresh token (7-day); create user if first login |
| **REQ-4.7.5** | Refresh endpoint rotates/issues new access token when refresh token is valid |
| **REQ-4.7.6** | Logout invalidates the current refresh token (and optionally all sessions) |
| **REQ-4.7.7** | If email delivery fails, return a safe generic error and log the failure server-side |

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

| ID | Requirement |
|----|-------------|
| **P-1** | AI disease inference latency: under **1200 ms** per image (AI service, excluding upload transfer) |
| **P-2** | Chatbot response **initiation** within **2 seconds** (time-to-first-token or full response start, depending on streaming choice) |
| **P-3** | Heatmap data API + initial render within **3 seconds** for expected regional datasets |
| **P-4** | Non-AI API Gateway responses under **500 ms** (p95), excluding upstream weather/AI waits |
| **P-5** | Support at least **1000** concurrent users (load-tested; horizontal scale plan documented) |
| **P-6** | Weather proxy p95 under **800 ms** when cache miss; under **100 ms** on cache hit |

### 5.2 Security Requirements

| ID | Requirement |
|----|-------------|
| **S-1** | OTP: 3-minute TTL, max 3 attempts, single-use validation, 60s resend cooldown |
| **S-2** | Access JWT: short-lived (recommended 15–60 minutes); Refresh token: **7-day** expiration with rotation; logout revokes refresh token |
| **S-3** | Prevent NoSQL injection via Mongoose schema validation and sanitized query builders |
| **S-4** | Prevent XSS via input sanitization and Content-Security-Policy headers |
| **S-5** | File upload hardening: magic-number checks, size/type limits, authenticated upload routes |
| **S-6** | Rate limiting: max **100** requests/minute/IP globally; stricter limits on OTP routes (e.g., 5/minute/email+IP) |
| **S-7** | JWT required for all endpoints **except** the Public Route Allowlist in §6.2.1 |
| **S-8** | Role-based access control (RBAC): `farmer`, `expert`, `admin` enforced in middleware |
| **S-9** | Secrets only in environment variables; never commit `.env` |

### 5.3 Reliability and Availability

| ID | Requirement |
|----|-------------|
| **R-1** | Target uptime: **99.9%** for API Gateway + MongoDB (AI may degrade independently) |
| **R-2** | Automated daily database backups (MongoDB Atlas or `mongodump`) |
| **R-3** | Graceful degradation when AI services are unavailable (clear user-facing errors; social/weather/knowledge remain up) |
| **R-4** | Structured error logging and monitoring for all services |
| **R-5** | Process supervision for Node.js (PM2 or systemd) and AI service |

### 5.4 Usability Requirements

| ID | Requirement |
|----|-------------|
| **U-1** | Full Burmese language UI with UTF-8 encoding |
| **U-2** | Responsive design for all screen sizes (mobile-first) |
| **U-3** | Touch-friendly interfaces for mobile users |
| **U-4** | Accessibility: high contrast mode, readable fonts, sufficient tap targets |
| **U-5** | Minimal training required; intuitive primary flows (detect disease, check weather, ask chatbot) |

---

## 6. Functional Architecture & Endpoint Mapping

### 6.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Client (React SPA / PWA)                                │
│         Dev: Vite :5173 (or :3000)  │  Prod: Static host / CDN              │
│         Web Speech API (STT/TTS) in browser                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ HTTPS / HTTP
┌─────────────────────────────────────────────────────────────────────────────┐
│                  Node.js API Gateway (Express.js) :5000                     │
│  Auth │ Social │ Knowledge │ Weather │ Detection │ Heatmap │ Chatbot │ Admin │
└─────────────────────────────────────────────────────────────────────────────┘
          │                    │                         │
          ▼                    ▼                         ▼
┌──────────────────┐  ┌────────────────────────┐  ┌─────────────────────┐
│ MongoDB :27017   │  │ Python AI Service :8000│  │ Open-Meteo API      │
│ Collections +    │  │ /ai/detect             │  │ (no API key)        │
│ GridFS + GeoJSON │  │ /ai/predict            │  │                     │
│                  │  │ /ai/chat               │  │                     │
│                  │  │ /ai/health             │  │                     │
└──────────────────┘  └────────────────────────┘  └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ File Storage        │
                    │ GridFS and/or S3    │
                    └─────────────────────┘
```

### 6.2 API Endpoint Specifications

Auth column values:

- **Public** — no JWT  
- **JWT** — any authenticated role  
- **Expert+** — `expert` or `admin`  
- **Admin** — `admin` only  

#### 6.2.1 Public Route Allowlist (S-7)

| Method | Path |
|--------|------|
| POST | `/api/v1/auth/request-otp` |
| POST | `/api/v1/auth/verify-otp` |
| GET | `/api/v1/knowledge/articles` |
| GET | `/api/v1/knowledge/articles/:id` |
| GET | `/api/v1/knowledge/categories` |
| GET | `/api/v1/knowledge/search` |
| GET | `/api/v1/weather/forecast` |
| GET | `/api/v1/weather/current` |
| GET | `/api/v1/weather/alerts` |
| GET | `/api/v1/weather/township/:township` |
| GET | `/api/v1/heatmap/data` |
| GET | `/api/v1/heatmap/township` |
| POST | `/api/v1/heatmap/filter` |

All other routes require a valid access JWT unless explicitly marked Public above.

#### 6.2.2 Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/request-otp` | Public | Send 6-digit OTP to email (60s cooldown) |
| POST | `/api/v1/auth/verify-otp` | Public | Verify OTP; issue access + refresh tokens |
| POST | `/api/v1/auth/refresh-token` | Refresh token | Issue new access token (and rotated refresh if policy enabled) |
| POST | `/api/v1/auth/logout` | JWT | Invalidate refresh token / end session |

#### 6.2.3 Social Mechanism

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/social/posts` | JWT | Create post |
| GET | `/api/v1/social/posts` | JWT | Paginated feed |
| GET | `/api/v1/social/posts/:id` | JWT | Get single post |
| PUT | `/api/v1/social/posts/:id` | JWT | Update post (owner) |
| DELETE | `/api/v1/social/posts/:id` | JWT | Delete post (owner or Admin) |
| POST | `/api/v1/social/posts/:id/comments` | JWT | Add comment |
| POST | `/api/v1/social/posts/:id/comments/:commentId/replies` | JWT | Nested reply |
| POST | `/api/v1/social/posts/:id/like` | JWT | Like / unlike |
| POST | `/api/v1/social/posts/:id/moderate` | Admin | Hide/restore/remove with reason |

#### 6.2.4 AI Disease Detection

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/detections/analyze` | JWT | Upload image for disease analysis |
| POST | `/api/v1/detections/predict` | JWT | Weather-based risk prediction |
| GET | `/api/v1/detections/history` | JWT | Current user's diagnostic history |
| GET | `/api/v1/detections/:id` | JWT | Single diagnostic (owner, Expert+, or Admin) |
| PUT | `/api/v1/detections/:id` | Expert+ | Correct/update diagnosis fields |
| POST | `/api/v1/detections/:id/verify` | Expert+ | Mark diagnosis verified |

#### 6.2.5 Knowledge Center

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/knowledge/articles` | Public | List published articles (filterable) |
| GET | `/api/v1/knowledge/articles/:id` | Public | Get published article; Admin may fetch drafts |
| POST | `/api/v1/knowledge/articles` | Admin | Create article |
| PUT | `/api/v1/knowledge/articles/:id` | Admin | Update article (version++) |
| DELETE | `/api/v1/knowledge/articles/:id` | Admin | Delete article |
| GET | `/api/v1/knowledge/categories` | Public | List categories |
| GET | `/api/v1/knowledge/search` | Public | Search published articles |

#### 6.2.6 Weather Prediction

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/weather/forecast` | Public | 7-day forecast (`lat`, `lng` or township) |
| GET | `/api/v1/weather/current` | Public | Current weather |
| GET | `/api/v1/weather/alerts` | Public | Severe weather alerts |
| GET | `/api/v1/weather/township/:township` | Public | Weather by township name |

#### 6.2.7 Heatmap

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/heatmap/data` | Public | Disease density aggregates |
| GET | `/api/v1/heatmap/township` | Public | Township boundaries GeoJSON |
| POST | `/api/v1/heatmap/filter` | Public | Filter by disease / date range |
| GET | `/api/v1/heatmap/statistics` | Admin | Outbreak statistics |

#### 6.2.8 AI Chatbot

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/chatbot/message` | JWT | Send text message (including STT transcript) |
| GET | `/api/v1/chatbot/history` | JWT | User chat history |
| POST | `/api/v1/chatbot/session` | JWT | Create session |
| GET | `/api/v1/chatbot/session/:id` | JWT | Get session |

> **Note:** Server route `/chatbot/voice/process` is **not** required for MVP. Voice is handled in the browser.

#### 6.2.9 Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/admin/audit-logs` | Admin | System audit logs |
| GET | `/api/v1/admin/users` | Admin | List users |
| PUT | `/api/v1/admin/users/:id` | Admin | Update user role / status |
| GET | `/api/v1/admin/dashboard` | Admin | Dashboard stats |
| POST | `/api/v1/admin/backup` | Admin | Trigger database backup |

### 6.3 Python AI Microservice Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ai/detect` | POST | Accepts image; returns disease classification payload |
| `/ai/predict` | POST | Accepts weather + context; returns risk prediction |
| `/ai/chat` | POST | Accepts text prompt (+ optional session context); returns bot reply |
| `/ai/health` | GET | Health check |

**Gateway responsibility:** authenticate user, store diagnostics/chat, enrich with weather/location, call AI service, persist results.

---

## 7. Data Models (MongoDB Collections)

### 7.1 Users Collection (`users`)

```javascript
{
  _id: ObjectId,
  email: String,              // unique, indexed, lowercase
  phoneNumber: String,
  fullName: String,
  role: String,               // 'farmer' | 'expert' | 'admin'
  location: {
    township: String,
    region: String,
    coordinates: {
      type: 'Point',
      coordinates: [Number, Number] // [lng, lat]
    }
  },
  isVerified: Boolean,        // email verified via successful OTP at least once
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `email` unique; `location.coordinates` 2dsphere (optional).

### 7.2 OTP Collection (`otps`)

```javascript
{
  _id: ObjectId,
  email: String,
  otpHash: String,            // store hashed OTP, not plaintext
  attempts: Number,
  isUsed: Boolean,
  expiresAt: Date,            // TTL index
  createdAt: Date
}
```

**Indexes:** TTL on `expiresAt`; compound index on `email` + `createdAt`.

### 7.3 Refresh Tokens Collection (`refresh_tokens`)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  tokenHash: String,          // hashed refresh token
  expiresAt: Date,
  revokedAt: Date,
  userAgent: String,
  ip: String,
  createdAt: Date
}
```

**Indexes:** TTL on `expiresAt`; index on `userId`; unique on `tokenHash`.

### 7.4 Diagnoses Collection (`diagnoses`)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  imageUrl: String,
  cropType: String,           // 'Rice' | 'Onion'
  disease: String,
  severityIndex: Number,      // 0–100
  probabilities: [
    { disease: String, probability: Number }
  ],
  location: {
    type: 'Point',
    coordinates: [Number, Number]
  },
  weatherConditions: {
    temperature: Number,
    humidity: Number,
    rainfall: Number,
    windSpeed: Number
  },
  prediction: {
    riskLevel: String,        // 'Low' | 'Medium' | 'High' | 'Outbreak_Imminent'
    forecastDays: Number,
    confidence: Number
  },
  treatmentProtocol: String,  // Burmese
  isVerified: Boolean,
  verifiedBy: ObjectId,
  verifiedAt: Date,
  createdAt: Date
}
```

**Indexes:** `userId` + `createdAt`; `location` 2dsphere; `disease` + `createdAt`.

### 7.5 Posts Collection (`posts`)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  content: String,
  images: [String],
  diagnosticId: ObjectId,     // optional; verified diagnosis only
  likes: [ObjectId],
  comments: [
    {
      _id: ObjectId,
      userId: ObjectId,
      content: String,
      replies: [
        {
          _id: ObjectId,
          userId: ObjectId,
          content: String,
          timestamp: Date
        }
      ],
      timestamp: Date
    }
  ],
  isActive: Boolean,
  moderatedBy: ObjectId,
  moderatedAt: Date,
  moderationReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 7.6 Knowledge Collection (`knowledge`)

```javascript
{
  _id: ObjectId,
  title: String,
  category: String,           // 'Book' | 'Article' | 'Journal'
  description: String,
  content: String,            // text body or empty if PDF-only
  fileUrl: String,            // GridFS or S3 URL
  author: String,
  tags: [String],
  isPublished: Boolean,
  uploadedBy: ObjectId,
  version: Number,
  versionHistory: [
    {
      version: Number,
      updatedBy: ObjectId,
      updatedAt: Date,
      changeNote: String
    }
  ],
  views: Number,
  downloads: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** text index on `title`, `description`, `tags`; `category` + `isPublished`.

### 7.7 Chatbot Sessions Collection (`chatbot_sessions`)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  sessionId: String,          // unique per session
  messages: [
    {
      sender: String,         // 'user' | 'bot'
      text: String,
      audioUrl: String,       // optional; unused in MVP voice path
      timestamp: Date
    }
  ],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `userId` + `updatedAt`; unique `sessionId`.

### 7.8 Heatmap Collections

#### Disease Locations (`disease_locations`)

```javascript
{
  _id: ObjectId,
  diagnosticId: ObjectId,
  location: {
    type: 'Point',
    coordinates: [Number, Number]
  },
  township: String,
  disease: String,
  severity: Number,
  timestamp: Date
}
```

**Indexes:** `location` 2dsphere; `disease` + `timestamp`; `township`.

#### Township Boundaries (`township_boundaries`)

```javascript
{
  _id: ObjectId,
  name: String,
  region: String,
  geometry: {
    type: 'Polygon',
    coordinates: [[[Number, Number]]]
  },
  riskLevel: String,          // aggregated
  outbreakCount: Number,
  lastUpdated: Date
}
```

**Indexes:** `geometry` 2dsphere; unique `name` + `region`.

### 7.9 Townships Lookup Collection (`townships`)

Used for weather-by-township and default map centering.

```javascript
{
  _id: ObjectId,
  name: String,               // township name (Burmese and/or English)
  nameEn: String,
  nameMy: String,
  region: String,
  coordinates: {
    type: 'Point',
    coordinates: [Number, Number] // representative center [lng, lat]
  },
  isActive: Boolean
}
```

**Indexes:** unique `nameEn` / `nameMy` as applicable; `coordinates` 2dsphere.

### 7.10 Audit Logs Collection (`audit_logs`)

```javascript
{
  _id: ObjectId,
  actorId: ObjectId,
  action: String,             // e.g. 'USER_ROLE_UPDATE', 'POST_MODERATE', 'DIAGNOSIS_VERIFY'
  resourceType: String,
  resourceId: ObjectId,
  metadata: Object,
  ip: String,
  createdAt: Date
}
```

---

## 8. Development Environment Setup

### 8.1 Prerequisites

- Node.js 20+  
- MongoDB 6.0+ (local or Atlas)  
- Python 3.10+ (AI microservices)  
- Git  
- SMTP credentials for OTP email  

### 8.2 Environment Variables (`.env`)

```env
# Node.js Server
PORT=5000
NODE_ENV=development
JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_EXPIRE=30m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRE=7d

# MongoDB
MONGODB_URI=mongodb://localhost:27017/smart_agro

# Email (OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Smart Agro Community <noreply@smartagro.local>

# Python AI Service
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT_MS=15000

# Weather API
WEATHER_API_URL=https://api.open-meteo.com/v1
WEATHER_CACHE_TTL_SECONDS=900

# File Storage
FILE_STORAGE_TYPE=gridfs
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=
# AWS_BUCKET_NAME=

# Security
RATE_LIMIT_MAX_PER_MINUTE=100
OTP_TTL_SECONDS=180
OTP_MAX_ATTEMPTS=3
OTP_RESEND_COOLDOWN_SECONDS=60
```

### 8.3 Project Structure

```
smart-agro-community/
├── client/                      # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/            # API clients
│   │   ├── hooks/
│   │   ├── context/             # Auth context
│   │   ├── utils/
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── server/                      # Node.js Backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/              # Mongoose models
│   │   ├── routes/
│   │   ├── middleware/          # Auth, RBAC, validation, rate limit
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.js
│   ├── package.json
│   └── .env
├── ai-service/                  # Python AI Microservice
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── services/
│   │   └── utils/
│   ├── requirements.txt
│   └── Dockerfile               # Optional
├── docs/
│   └── SRS-Smart-Agro-Community.md
└── README.md
```

### 8.4 Local Run (Reference)

| Service | Command (illustrative) | Port |
|---------|------------------------|------|
| MongoDB | `mongod` or Atlas URI | 27017 |
| API Gateway | `npm run dev` in `server/` | 5000 |
| AI Service | `uvicorn app.main:app --reload` in `ai-service/` | 8000 |
| Client | `npm run dev` in `client/` | 5173 / 3000 |

---

## 9. Testing Requirements

| Test Type | Coverage Target | Notes |
|-----------|-----------------|-------|
| Unit Tests | ≥ 80% on server services/utils and critical client hooks | Jest/Vitest as chosen |
| Integration Tests | All API endpoints in §6.2 | Auth, RBAC, validation |
| E2E Tests | Critical flows: OTP login, detect disease, post+comment, weather, heatmap filter, chatbot text | Playwright/Cypress |
| Performance Tests | 1000 concurrent users; AI latency P-1; gateway P-4 | k6/Artillery |
| Security Tests | OWASP Top 10; OTP brute-force; upload abuse; JWT misuse | Manual + automated |

**Mandatory E2E scenarios**

1. Guest views weather + published knowledge  
2. Farmer completes OTP login  
3. Farmer uploads leaf image and receives diagnosis  
4. Expert verifies diagnosis; farmer links it on a social post  
5. Admin moderates a post  
6. Farmer chatbot text round-trip in Burmese  
7. Heatmap filter by disease and date  

---

## 10. Deployment Considerations

| Component | Deployment Options |
|-----------|--------------------|
| Frontend | Vercel, Netlify, or S3 + CloudFront (static SPA/PWA) |
| Backend | AWS EC2, DigitalOcean, Render, or similar Node host |
| MongoDB | MongoDB Atlas (recommended) or self-hosted |
| AI Service | GPU/CPU VM (EC2 or dedicated); isolate from public internet behind gateway |
| File Storage | MongoDB GridFS (simple) or AWS S3 (recommended at scale) |
| Process Manager | PM2 or systemd for Node + AI processes |
| TLS | Terminate TLS at CDN/load balancer |

**Production notes**

- Do not expose Python AI ports publicly; only the API Gateway should be public.  
- Configure CORS to the frontend origin(s) only.  
- Enable MongoDB Atlas backups and monitoring alerts.  
- Document horizontal scaling: multiple API instances behind a load balancer; sticky sessions not required if JWT is stateless and refresh tokens are in MongoDB.

---

## 11. Open Risks & Constraints

| ID | Risk | Mitigation |
|----|------|------------|
| RISK-1 | Burmese STT/TTS quality varies by browser/OS | Document supported browsers; keep text chat as primary path |
| RISK-2 | AI model accuracy on field photos | Quality gate (OpenCV); Expert verification workflow |
| RISK-3 | Open-Meteo rate limits / downtime | Server cache; graceful empty/alert states |
| RISK-4 | Township boundary data completeness | Seed known regions first; expand iteratively |
| RISK-5 | LLM hallucination on agronomy advice | Ground on Knowledge Center; disclaimers in UI |
| RISK-6 | Email OTP deliverability | Transactional email provider; monitoring; resend UX |

---

## 12. Appendix

### 12.1 Requirement Traceability (Feature → Primary Routes)

| Feature | Primary Routes |
|---------|----------------|
| Auth | `/api/v1/auth/*` |
| Social | `/api/v1/social/*` |
| Detection | `/api/v1/detections/*` + `/ai/detect`, `/ai/predict` |
| Knowledge | `/api/v1/knowledge/*` |
| Weather | `/api/v1/weather/*` |
| Heatmap | `/api/v1/heatmap/*` |
| Chatbot | `/api/v1/chatbot/*` + `/ai/chat` |
| Admin | `/api/v1/admin/*` |

### 12.2 Color / Risk Legend (Heatmap)

| Level | UI Color | Meaning |
|-------|----------|---------|
| Low | Green | Sparse / low severity disease reports |
| Medium | Yellow | Elevated density |
| High | Red | Concentrated outbreak signal |

### 12.3 Document Control

| Role | Responsibility |
|------|----------------|
| Product Owner | Scope and priority |
| Tech Lead | Architecture compliance with this SRS |
| Engineers | Implement against REQ / API / model sections |
| QA | Verify §5 and §9 |

---

**End of Document — Smart Agro Community SRS v4.1**
