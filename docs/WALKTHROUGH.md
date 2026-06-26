# TalentIQ — Demo Walkthrough

> **Estimated reading time: ~4 minutes**  
> This walkthrough covers the complete end-to-end flow of the TalentIQ platform.

---

## Overview

TalentIQ is a full-stack AI hiring platform. The demo flow covers six stages:

```
[1] JD Posted → [2] Candidates Scraped & Scored → [3] Interview Invitation Sent
     → [4] Interview Completed on Android → [5] Scorecard Generated → [6] Candidates Compared
```

---

## Stage 1 — Job Description Posted

**Actor:** Recruiter (Web Portal)

The recruiter navigates to the web portal at `https://talentiq-web.up.railway.app` and logs in.

On the **Jobs** page, they click **"New Job"** and paste in the job description for a *Senior React Engineer* role.

**Behind the scenes:**
- `POST /api/jobs` creates a job record with `status: 'parsing'`
- The API fires `POST http://jd-analysis-worker/parse-jd` with the raw JD text
- The JD Analysis Worker (Claude 3.5 Sonnet) extracts:
  - Required hard skills: `["React", "TypeScript", "GraphQL", "AWS"]`
  - Seniority level: `"Senior"` (5+ years expected)
  - Domain: `"FinTech / B2B SaaS"`
  - Shortlist threshold: `70` (composite score)
- The `parsed_jd` JSONB is written back to the `jobs` table
- Job status transitions to `'active'`

---

## Stage 2 — Candidates Scraped & Scored

**Actor:** Recruiter clicks "Find Candidates"

**Scraping:**
- `POST /api/jobs/:id/scrape` fires `POST http://scraper-worker/scrape` with `{ job_id, query: "Senior React Engineer Bangalore" }`
- The Scraper worker runs **LinkedIn public search** and **Naukri.com** concurrently via `asyncio.gather()`
- LinkedIn: Playwright headless Chromium with random User-Agent, 2s inter-page delay, auth-wall detection, pagination up to 5 pages (50 results)
- Naukri: Playwright + BeautifulSoup parsing of listing cards
- Results are **deduplicated** by profile URL fuzzy match
- ~30 candidates inserted into the `candidates` table

**Scoring:**
- For each candidate, `POST http://scorer-worker/score` is called
- The Scorer computes 4 dimension scores:
  - **Technical (35%)**: sentence-transformer cosine similarity between candidate skill embeddings and JD required skills
  - **Seniority (25%)**: title rank + years-of-experience vs JD level
  - **Domain (25%)**: company/title industry match to JD domain
  - **Implicit (15%)**: red flag penalty (short tenures, gap years, title inflation)
- Composite score written to `candidate_scores`; candidates above 70 auto-shortlisted
- Candidate embedding (384-dim `all-MiniLM-L6-v2`) stored in pgvector column for comparison

The recruiter sees the scored candidate list, sorted by composite score, with red flag badges and shortlist indicators.

---

## Stage 3 — Interview Invitation Sent

**Actor:** Recruiter clicks "Invite" on a shortlisted candidate

- `POST /api/candidates/:id/invite` runs:
  1. Creates an `interviews` record with a random 64-char `token` (7-day expiry)
  2. Calls `POST http://jd-analysis-worker/generate-questions` to generate 4 role-specific interview questions based on `parsed_jd` + candidate profile
  3. Questions are stored in `interviews.questions` (JSONB array)
  4. Sends a Resend email to the candidate with a deeplink: `talentiq://interview/<token>` or a web fallback
  5. Interview status transitions to `'invited'`

The candidate receives an email with the subject **"Invitation to interview for Senior React Engineer"** and a token to paste into the Android app.

---

## Stage 4 — Interview Completed on Android App

**Actor:** Candidate (on their Android device)

1. **Opens the TalentIQ app** (downloaded via the APK link in README)
2. **Welcome Screen**: Pastes the interview token from their email
3. App calls `GET /api/interviews/:token` → receives `{ questions: [...], candidate_name, role_title }`
4. **Interview Screen**: Camera activates (front-facing). Candidate sees Question 1 of 4 with a progress bar.
5. Candidate taps the red record button → records their video answer (up to 3 minutes)
6. On stop: video is uploaded via `POST /api/interviews/:token/chunk` as a single multipart chunk
7. Repeat for Questions 2, 3, 4
8. After Question 4 upload, app calls `POST /api/interviews/:token/submit` → interview marked `'completed'`
9. **Done Screen**: "Thank you! Your responses are being processed."

**Chunked upload internals:**
- Each video file is uploaded as `chunk_index=0, total_chunks=1`
- API writes chunk to Cloudflare R2 at `interviews/<token>/q<n>/chunk_0`
- When `videoChunksReceived == totalChunks`, `assembleChunks()` runs non-blocking:
  - Concatenates all chunk buffers
  - Writes final `video.webm` to R2
  - Deletes chunk objects
  - Enqueues `'transcribe-answer'` job via pg-boss

---

## Stage 5 — Scorecard Generated

**Actor:** System (automatic, async)

pg-boss dequeues `'transcribe-answer'` jobs and calls `POST http://transcriber-worker/transcribe`:

1. **`extract_audio(r2_key)`**: Downloads `video.webm` from R2, runs ffmpeg to extract 16kHz mono WAV
2. **`transcribe(audio_path)`**: faster-whisper `base/int8` model transcribes the audio → text string
3. **`score_answer(transcription, question_text)`**: Claude 3.5 Sonnet scores the answer on `relevance`, `clarity`, `specificity`, `depth` (0–100 each)
4. Results written to the `answers` row in PostgreSQL
5. After all 4 answers are processed: **`generate_scorecard()`** is called:
   - Claude 3.5 Sonnet meta-prompt aggregates all per-answer scores
   - Outputs: `aggregate_score`, `hire_signal`, `confidence`, `follow_up_questions`, `ranking_justification`
   - Written to `scorecards` table

**Whisper performance on Railway CPU:** A 2-minute answer is transcribed in ~26 seconds (RTF ≈ 0.22×). All 4 answers complete in under 2 minutes total.

---

## Stage 6 — Candidates Compared

**Actor:** Recruiter (Web Portal)

The recruiter opens the **Candidate Comparison** view and selects 2–3 shortlisted candidates.

- `POST /api/comparison` sends all candidate IDs to Claude 3.5 Sonnet
- Claude compares scorecards side-by-side and generates a `recommendation` field explaining which candidate to advance and why
- The web portal renders a **side-by-side scorecard table** with:
  - Composite pre-interview score
  - Interview aggregate score
  - Hire signal badge (🟢 Strong Hire / 🟡 Hire / 🔴 No Hire)
  - AI recommendation paragraph

The recruiter advances the chosen candidate to the next round.

---

## Key Technical Highlights

| Feature | Implementation |
|---------|---------------|
| No Redis dependency | pg-boss uses existing Postgres for job queuing |
| Token-gated interviews | 64-char random token, 7-day expiry, one-time use |
| Chunked upload resilience | Chunks stored independently; assembly is idempotent |
| Cold-start free Whisper | Model pre-baked into Docker image at build time |
| Scraping resilience | Graceful auth-wall fallback; partial results preserved |
| Semantic scoring | MiniLM embeddings + cosine similarity, not keyword matching |
| Async scorecard | Non-blocking transcription chain; recruiter polls status |
