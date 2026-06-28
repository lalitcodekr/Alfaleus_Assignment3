# TalentIQ
**AI-Powered Talent Screening & Interview Intelligence Platform**

[![Live API](https://img.shields.io/badge/Live%20API-Render-blueviolet?logo=render)](https://talentiq-api-dhw7.onrender.com)
[![Android APK](https://img.shields.io/badge/Android%20APK-Download-3DDC84?logo=android)](https://github.com/lalitcodekr/Alfaleus_Assignment3/raw/main/talentiq.apk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

TalentIQ automates the full pre-hire funnel — from job description parsing and passive candidate scraping, through semantic scoring and AI-generated interview questions, to async video interviews on Android and AI-generated scorecards — with zero manual screening overhead.

---

## 📺 Demo Walkthrough

> See [docs/WALKTHROUGH.md](docs/WALKTHROUGH.md) for the full written walkthrough of the end-to-end demo flow.

---

## 🏗 Architecture Overview

TalentIQ is a microservices system. All inter-service communication is HTTP. Job queuing uses **pg-boss** (PostgreSQL-backed) — no Redis required.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Recruiter Browser                        │
│                   Next.js Web Portal (apps/web)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST (React Query)
┌────────────────────────────▼────────────────────────────────────┐
│                    Hono API  (apps/api)                         │
│        Node.js 20 · TypeScript · Drizzle ORM · Better Auth      │
│              pg-boss queue · Cloudflare R2 storage               │
└──────┬──────────┬──────────┬──────────┬───────────┬────────────┘
       │          │          │          │           │
  POST /scrape  POST /     POST /    POST /      POST /transcribe
               parse-jd   score    generate-
                                   questions
       │          │          │          │           │
┌──────▼──┐ ┌────▼───┐ ┌────▼───┐ ┌───▼───────┐ ┌▼──────────────┐
│ Scraper │ │  JD    │ │Scorer  │ │JD-Analysis│ │  Transcriber  │
│ Worker  │ │Analysis│ │ Worker │ │  Worker   │ │    Worker     │
│(Python) │ │(Python)│ │(Python)│ │  (Python) │ │   (Python)    │
│Playwright│ │Claude 3│ │Claude 3│ │  Claude 3 │ │faster-whisper │
│+Naukri  │ │sentence│ │+embed  │ │  question │ │  + ffmpeg     │
│+LinkedIn│ │transf. │ │  +pgv  │ │  generator│ │   + R2        │
└─────────┘ └────────┘ └────────┘ └───────────┘ └───────────────┘
                             │
              ┌──────────────▼──────────────┐
              │    Neon PostgreSQL + pgvector │
              │     (pg-boss job tables)      │
              └─────────────────────────────┘
                             │  Token-gated REST
              ┌──────────────▼──────────────┐
              │  React Native (Expo) Android  │
              │   Camera · Chunked Upload     │
              └─────────────────────────────┘
```

### Services

| Service | Path | Port | Stack |
|---------|------|------|-------|
| **Hono API** | `apps/api` | 3001 | Node 20, TypeScript, Drizzle ORM, Better Auth |
| **Web Portal** | `apps/web` | 3000 | Next.js 15, React Query, Tailwind |
| **Android App** | `mobile/` | — | Expo 56, React Native 0.85, Zustand |
| **Scraper** | `workers/scraper` | 8001 | Python 3.12, Playwright, BeautifulSoup |
| **JD Analysis** | `workers/jd-analysis` | 8002 | Python 3.12, Claude 3.5 Sonnet |
| **Scorer** | `workers/scorer` | 8003 | Python 3.12, lightweight TF-IDF, Claude 3.5 Sonnet, pgvector |
| **Transcriber** | `workers/transcriber` | 8004 | Python 3.12, faster-whisper, ffmpeg |

---

## 🧠 Semantic Scoring Approach

When a candidate profile is scraped, the Scorer worker evaluates it across **four orthogonal dimensions** against the parsed JD:

### Dimension Definitions

| Dimension | Weight | What it measures |
|-----------|--------|-----------------|
| **Technical** | 35% | Hard skill overlap between candidate skills and JD required stack. Uses fast TF-IDF cosine similarity between skills to keep memory usage low on free tiers. |
| **Seniority** | 25% | Title-level and experience-level match. Regex extraction of years + title rank scoring (Junior → Principal). Compared against JD seniority keywords. |
| **Domain** | 25% | Industry/domain alignment. Candidate's current company/title domain vs JD industry signals. |
| **Implicit** | 15% | Red flags and implicit signals: short tenures, unexplained gaps, title inflation. Applied as a penalty multiplier. |

### Composite Score Formula

```
composite = (technical × 0.35) + (seniority × 0.25) + (domain × 0.25) + (implicit × 0.15)
```

All component scores are in `[0, 100]`. A candidate with `composite >= shortlist_threshold` (default **70**) is automatically shortlisted.

### Interview Scorecard (Post-Interview)

After video interview, the Transcriber worker processes each answer through two additional stages:

1. **Per-answer scoring** (Claude 3.5 Sonnet): Each transcription is scored on:
   - `relevance_score` — Does the answer address the question?
   - `clarity_score` — Is the response well-structured and articulate?
   - `specificity_score` — Are concrete examples and data used?
   - `depth_score` — Does the answer demonstrate expert-level understanding?

2. **Aggregate scorecard** (Claude 3.5 Sonnet meta-prompt): All per-answer scores are aggregated into:
   - `aggregate_score` (0–100)
   - `hire_signal`: `Strong Hire` | `Hire` | `No Hire`
   - `confidence` (0–1)
   - `follow_up_questions` for human interviewer
   - `ranking_justification` for side-by-side comparison

---

## 🕷 Scraping Sources & Rate Limiting Strategy

### Sources

| Source | Scraper | Data Quality |
|--------|---------|-------------|
| **LinkedIn Public Search** | Playwright headless Chromium | `high` (name + title + company + profile URL) |
| **Naukri.com** | Playwright + BeautifulSoup | `medium` (name + title + skills) |

### Rate Limiting Strategy

The scraper uses a **layered defence** against throttling:

```
1. Random User-Agent rotation     — fake-useragent library, rotated per request
2. Realistic human-like delays    — asyncio.sleep(2.0s) between page navigations
3. Auth-wall detection            — stops gracefully if LinkedIn redirects to /login or /authwall
4. Pagination cap                 — max 5 pages × 10 results = 50 per source per run
5. Concurrent source scraping     — LinkedIn + Naukri run in parallel via asyncio.gather()
6. Result deduplication           — email/profile-URL fuzzy match deduplicates across sources
7. Graceful degradation           — if one scraper fails, partial results from the other still persist
```

**LinkedIn specifics**: LinkedIn requires cookies for full access. The public search scraper returns partial results (name visible, profile URL partially visible) without authentication. For a production deployment, authenticated scraping (with a pooled cookie jar) significantly improves data quality.

---

## ⚡ Whisper Model Benchmarks on CPU (Render Free Tier)

The transcriber worker runs **`faster-whisper`** with the **`base`** model and **`int8` quantization** on Render's free tier (512MB RAM, shared CPU).

See [docs/whisper_benchmark.md](docs/whisper_benchmark.md) for full benchmark results.

### Summary Table

| Model | Compute | Audio (60s) | RTF | Memory | Render Free fit? |
|-------|---------|-------------|-----|--------|-------------|
| `tiny` | int8 | 60s input | ~0.12× | ~90MB | ✅ fastest |
| **`base`** | **int8** | **60s input** | **~0.22×** | **~150MB** | **✅ chosen** |
| `small` | int8 | 60s input | ~0.55× | ~470MB | ⚠️ tight |
| `medium` | int8 | 60s input | ~1.4× | ~1.5GB | ❌ OOM |
| `large-v3` | int8 | 60s input | ~4×+ | ~3GB+ | ❌ OOM |

**RTF (Real-Time Factor)**: time-to-transcribe ÷ audio-duration. RTF < 1.0 means faster than real-time.

**Decision**: `base/int8` transcribes a 2-minute interview answer in ~26 seconds on a shared CPU. Acceptable for async processing where the candidate is not waiting for real-time feedback.

The model is **pre-downloaded at Docker build time** (`RUN python -c "WhisperModel('base', ...)"`) so cold starts are instant with no runtime download penalty.

---

## 📦 Chunked Upload Implementation

The mobile app uses **sequential chunked multipart upload** to handle large video files over unstable mobile networks.

### Flow

```
Android App                         Hono API                      R2 / Assembler
─────────                           ────────                      ──────────────
record video (mp4/webm)
    │
    ├─ POST /api/interviews/:token/chunk ──────────────────────────────────────▶
    │   body: { chunk (File), question_index, chunk_index=0, total_chunks=1 }
    │                                   │
    │                                   ├─ uploadToR2("interviews/token/q0/chunk_0")
    │                                   │
    │                                   ├─ answers.videoChunksReceived += 1
    │                                   │
    │                                   └─ if received == total_chunks:
    │                                          assembleChunks() [async, non-blocking]
    │
    │◀── { received: true, chunkIndex: 0, assembled: false } ──────────────────
    │
    ├─ POST /api/interviews/:token/submit ─────────────────────────────────────▶
    │                                   └─ interviews.status = 'completed'
    │◀── { submitted: true } ───────────────────────────────────────────────────

                                    assembleChunks() [background]
                                        │
                                        ├─ GetObject each chunk from R2
                                        ├─ Buffer.concat(chunks)
                                        ├─ uploadToR2("interviews/token/q0/video.webm")
                                        ├─ DeleteObject each chunk (cleanup)
                                        ├─ answers.videoAssembled = true
                                        └─ enqueue('transcribe-answer', { answer_id, r2_key, ... })

                                    pg-boss dequeues job
                                        │
                                        └─ POST http://transcriber:8004/transcribe
                                               → extract_audio() via ffmpeg
                                               → transcribe() via faster-whisper
                                               → score_answer() via Claude
                                               → generate_scorecard() if all answers done
```

**Key design decisions:**
- Assembly runs **non-blocking** (no `await`) so the HTTP response returns immediately
- The transcriber is triggered via **pg-boss**, not HTTP, so it survives API restarts
- Each chunk is uploaded to R2 before acknowledgment — no local disk on the API server

---

## 🚀 Deployment Instructions

### Option A: Render.com (100% Free Tier)

TalentIQ is designed to run entirely on Render's free tier with zero credit card required.

**Prerequisites:** Render account (GitHub auth), Neon PostgreSQL database, Cloudflare R2 bucket.

1. Go to **Render Dashboard** → **New +** → **Blueprint**
2. Connect your cloned GitHub repository (`Alfaleus_Assignment3`).
3. Render will read `render.yaml` and provision **all 5 services** (API + 4 Python Workers).
4. For each service, set the required environment variables in the Render Dashboard (or via a secret file):
   - `DATABASE_URL`: `postgres://...`
   - `ANTHROPIC_API_KEY`: `sk-ant-...`
   - `R2_*` variables (for API and Transcriber)
   - `RESEND_API_KEY` (for API)
   - `BETTER_AUTH_SECRET` & `JWT_SECRET` (for API)
5. Save and deploy. Render automatically injects the `PORT` environment variable for each service.
6. Run `npm run db:push` in `apps/api` locally with your `DATABASE_URL` to provision the schema.

### Option B: Docker Compose (Local)

```bash
# 1. Clone and configure
cp .env.example .env
# Fill in .env with your API keys

# 2. Start all services
docker-compose up -d

# 3. Push DB schema
cd apps/api && npm run db:push
```

Access: API → http://localhost:3001 | Web Portal → http://localhost:3000

### Web Portal (Recruiter Dashboard)

```bash
cd apps/web
npm install
npm run dev
```

### Android App

**Option 1 — Download APK:** [Direct APK download](https://github.com/lalitcodekr/Alfaleus/releases/latest/download/talentiq.apk)

**Option 2 — Build locally:**
```bash
cd mobile
npm install

# Development (Expo Go / emulator)
npx expo start --android

# Build production APK via EAS Cloud
npm install -g eas-cli
eas login
eas build --platform android --profile preview
# Download .apk from EAS dashboard and sideload it
```

**Option 3 — Local emulator:**
```bash
cd mobile
npx expo start
# Press 'a' for Android emulator
```

---

## 📋 Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | API + Web Portal |
| Python | 3.12+ | All workers |
| Docker | 24+ | Local orchestration |
| Expo CLI / EAS CLI | Latest | Mobile build |
| Railway CLI | Latest | Deployment |

### Required API Keys

| Key | Where to get | Used by |
|-----|-------------|---------|
| `ANTHROPIC_API_KEY` | console.anthropic.com | JD Analysis, Scorer, Transcriber |
| `R2_*` (4 vars) | Cloudflare dashboard → R2 | API (chunk upload), Transcriber |
| `RESEND_API_KEY` | resend.com | API (email invitations) |
| `DATABASE_URL` | Neon or Railway Postgres | All services |

---

## 🗃 Database Schema

```
jobs ──────────< candidates ──────< candidate_scores
                    │
                    └──────────< interviews ────< answers
                                    │
                                    └─────────< scorecards
```

All job queuing uses **pg-boss** tables within the same Postgres database (no Redis).

---

## 📄 License

MIT © 2025 Alfaleus
