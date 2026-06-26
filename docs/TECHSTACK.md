AI Talent Screening Platform  |  Tech Stack 2026

**TECHNOLOGY STACK RECOMMENDATION**

**AI-Powered Talent Screening &**

**Interview Intelligence Platform**

2026 Stack · Based on PRD v1.0

Covers: Frontend · Mobile · Backend API · ML Workers · Auth · Database · Storage · Email · DevOps


# **1. Selection Philosophy**

Every choice in this stack is governed by four constraints pulled directly from the PRD:

- Railway free tier — all backend services must stay within Railway's free compute and memory limits. No paid managed ML APIs.
- Open-source ML — transcription via Whisper (or equivalent), embeddings via sentence-transformers. Zero spend on inference.
- Ship in 5 days — the stack must have zero-config local dev, fast hot-reload, and Railway one-command deploy. No infra yak-shaving.
- Two audiences — a recruiter on a desktop browser and a candidate on an Android phone with possibly poor connectivity. The stack must serve both without compromise.

Each section below presents: the chosen tool → why it wins in 2026 → what was rejected and why → how it satisfies the PRD's specific constraints.

# **2. At-a-Glance Stack Summary**


|**Layer**|**Chosen**|**Version (2026)**|**Key Reason**|
| :- | :- | :- | :- |
|Frontend (Web)|Next.js 15|15\.3 / React 19|App Router + RSC; Vercel free tier; zero-config deploy|
|Styling|Tailwind CSS v4|4\.1|10x faster build; native CSS vars; no PostCSS config|
|UI Components|shadcn/ui + Radix|Latest|Unstyled accessible primitives; paste-in, no bundle bloat|
|Client State|Zustand|5\.0|30-line setup; no boilerplate; replaces Redux|
|Server State|TanStack Query|v5|Stale-while-revalidate, optimistic updates, cache|
|Mobile (Android)|Expo + React Native|SDK 53 / RN 0.78|APK export; Expo Router v4; native camera API|
|Backend API|Hono.js|v4|< 15 KB; Railway-native; TypeScript-first; fastest Node router|
|ML Workers|FastAPI (Python)|0\.115|Async; Pydantic v2; natural home for sentence-transformers|
|Job Queue|pg-boss|10\.x|PostgreSQL-backed; no Redis; survives Railway restarts|
|Auth|Better Auth|v1|Open-source; self-hosted; no paid tier; JWT + sessions|
|Database|PostgreSQL 17 + pgvector|Railway managed|Vector storage in Postgres; no separate vector DB|
|ORM|Drizzle ORM|0\.40|Type-safe; zero runtime overhead; first-class pgvector support|
|Embeddings|bge-small-en-v1.5|BAAI (HuggingFace)|Beats MiniLM on MTEB; 33 M params; CPU-fast|
|Transcription|faster-whisper|1\.1|4× faster than openai-whisper on CPU via CTranslate2|
|Scraping|Playwright + httpx|1\.50 / 0.28|Handles JS-rendered pages + static pages; tenacity backoff|
|Video Storage|Cloudflare R2|—|10 GB free; S3-compatible; egress free; tus chunked upload|
|Chunked Upload|tus protocol|tus-js-client 4.x|Resumable uploads; survives connectivity drops (PRD NFR-04)|
|Email|Resend|—|3 000 emails/month free; React Email templates; dead-simple API|
|Deployment|Railway + Vercel|—|Backend on Railway; Next.js on Vercel; both free tiers|
|CI/CD|GitHub Actions|—|Free for public repos; matrix builds for web + mobile + workers|

# **3. Frontend — Recruiter Web App**


## **3.1 Framework: Next.js 15 (App Router)**

|**Web Framework**  →  Next.js 15 + React 19|||
| :- | :- | :- |
|**Justification**||Next.js 15 with the App Router is the dominant React framework in 2026. React Server Components (RSC) eliminate client-side data-fetching waterfalls — the recruiter dashboard's candidate pipeline list can be streamed from the server with zero loading spinners. Partial Prerendering (PPR, stable in v15) lets static shells appear instantly while dynamic candidate data streams in. React 19's new compiler reduces re-renders without any manual memoization. Vercel's free tier deploys Next.js with zero configuration and provides a global CDN with no cold-start latency for static assets.|
|**Alternatives**||Rejected: Remix — excellent router but smaller ecosystem; Railway adapter adds friction. Rejected: SvelteKit — too few component libraries for a data-heavy recruiter UI. Rejected: Vite + React SPA — no SSR; full-page loads hurt candidate pipeline UX.|
|**PRD fit**||PRD Section 8 NFR-03 demands < 3s initial load. RSC streaming + Vercel CDN achieves this without complex caching logic. PRD Section 7.8 requires 4 distinct views; Next.js file-based routing maps each view to a route with zero configuration.|

## **3.2 Styling: Tailwind CSS v4 + shadcn/ui**

|**Styling + Components**  →  Tailwind v4 + shadcn/ui + Radix UI|||
| :- | :- | :- |
|**Justification**||Tailwind v4 (released Jan 2025) rewrites the engine in Rust — build times drop from seconds to milliseconds. It removes the tailwind.config.js entirely and adopts CSS custom properties natively, making theme overrides trivial. shadcn/ui is not a component library you install — it is a code generator that pastes accessible Radix UI primitives directly into your project. This means zero dependency bloat, full customisation, and no upstream breaking changes. The recruiter dashboard's data tables, filter dropdowns, score badges, and comparison modals all map directly to shadcn primitives (DataTable, Select, Badge, Dialog).|
|**Alternatives**||Rejected: MUI / Ant Design — heavy bundles; opinionated design that clashes with custom branding. Rejected: Chakra UI v3 — runtime CSS-in-JS overhead hurts Core Web Vitals. Rejected: vanilla CSS modules — too slow to build the 4 PRD views in 5 days.|
|**PRD fit**||PRD Section 6 mandates that all recruiter views must be 'clean and professional' and usable by a non-technical hiring manager. shadcn's accessible defaults handle keyboard navigation, focus rings, and ARIA roles — preventing accessibility regressions without extra work.|

## **3.3 State Management: Zustand + TanStack Query v5**

|**Concern**|**Tool**|**Why**|
| :- | :- | :- |
|Server state (API data)|TanStack Query v5|Stale-while-revalidate caching; automatic background refetch; optimistic updates for shortlist toggle (PRD US-06); built-in pagination for candidate pipeline (PRD 7.8.2)|
|Client-only UI state|Zustand v5|Comparison view selection state (2–4 candidates, PRD US-17); filter panel open/close; no Provider wrapping needed in Next.js App Router|
|Forms (JD post, threshold)|React Hook Form + Zod|Type-safe form validation with Zod schemas that mirror the API request bodies; zero re-renders on keystroke|

# **4. Mobile — Candidate Android App**


## **4.1 Framework: Expo SDK 53 + Expo Router v4**

|**Mobile Framework**  →  Expo SDK 53 / React Native 0.78|||
| :- | :- | :- |
|**Justification**||Expo is the only viable choice given the PRD constraint of distributing an APK without an App Store submission. Expo SDK 53 ships the New Architecture (Fabric renderer + JSI) by default — this eliminates the bridge bottleneck and makes camera-to-upload latency feel native. Expo Router v4 enables deep linking out of the box: the interview invitation URL can open directly to the correct question screen without any manual linking configuration. EAS Build produces a signed APK in a single command from a GitHub Actions job. The SDK includes expo-camera (hardware-accelerated recording), expo-av (audio extraction preview), expo-file-system (local chunk assembly), and expo-network (connectivity detection for resume-on-failure).|
|**Alternatives**||Rejected: Flutter — different language (Dart); no benefit over Expo for this use case; harder to share code with web. Rejected: bare React Native CLI — same code but far more setup; no EAS Build without Expo; deep linking requires manual configuration.|
|**PRD fit**||PRD Section 3 (Async Video Interview) and NFR-04 (chunked upload resilience) are the hardest mobile requirements. Expo's first-class expo-file-system and expo-network APIs make offline detection, local chunk storage, and retry logic straightforward. PRD constraint: must distribute as APK — EAS Build is the cleanest path.|

## **4.2 Key Mobile Libraries**

|**Library**|**Version**|**Purpose**|**PRD Requirement Addressed**|
| :- | :- | :- | :- |
|expo-camera|15\.x|Hardware-accelerated video recording with configurable quality and time limits|PRD F-05: think timer, recording, max time|
|tus-js-client|4\.x|Resumable chunked video upload via tus protocol|PRD F-05 §7.5.3: chunk upload with resume-on-failure|
|expo-network|6\.x|Real-time connectivity state detection|PRD F-05: resume from last submitted answer on reconnect|
|expo-secure-store|13\.x|Secure local storage of session token and interview state|PRD F-04: unique token per candidate|
|React Native Reanimated 3|3\.17|Smooth think timer countdown animation; recording pulse indicator|PRD F-05: clear visual recording state|
|Expo Notifications|0\.29|Local notification when upload completes in background|PRD F-05: candidate clarity on upload status|

# **5. Backend — API Layer**


## **5.1 API Framework: Hono.js v4 (TypeScript)**

|**API Framework**  →  Hono.js v4 (Node.js on Railway)|||
| :- | :- | :- |
|**Justification**||Hono is the fastest Node.js web framework in 2026 measured by requests/second on Railway's constrained CPU. At under 15 KB with zero dependencies, it starts in under 50 ms — critical on Railway's free tier where services spin down between requests. Hono's middleware chain is identical to Express but fully type-safe via TypeScript generics and Zod validators on every route. It supports streaming responses natively — essential for the scorecard generation endpoint (PRD F-07) where the LLM generates long output that should stream to the recruiter UI rather than block. Hono also ships a first-class WebSocket adapter, which is useful if the bonus live interview mode is implemented.|
|**Alternatives**||Rejected: Express.js — no TypeScript-first design; bloated middleware ecosystem; slower than Hono by 3–4× on the same Railway instance. Rejected: Fastify — heavier than Hono; plugin system adds friction for a 5-day build. Rejected: NestJS — way too much boilerplate for a project of this scope; DI framework overhead not justified.|
|**PRD fit**||PRD Section 11 defines 10 key API endpoints. Hono's route groups map cleanly: /api/jobs (recruiter routes), /api/interview/:token (candidate routes), /api/comparison. The token-based interview endpoint (NFR-07) benefits from Hono's built-in JWT middleware for stateless token verification.|

## **5.2 API Architecture Pattern**
The API layer is intentionally thin — it validates inputs, enqueues ML jobs, reads from PostgreSQL, and returns results. Heavy computation (scraping, embedding, transcription, scoring) runs in separate Python worker Railway services, not in the Hono process.

|**Responsibility**|**Where It Lives**|**Why Separated**|
| :- | :- | :- |
|REST routing, auth, DB reads/writes|Hono (Node.js) — Railway service 1|Fast, typed, always on|
|JD analysis, scorecard LLM calls, question generation|FastAPI worker — Railway service 2|Python LLM libraries; isolated memory|
|Candidate scraping (Playwright)|FastAPI worker — Railway service 3|Playwright needs Chromium; isolate to its own memory budget|
|Semantic scoring (sentence-transformers)|FastAPI worker — Railway service 4|Model load is heavy; cache in worker process memory|
|Transcription (faster-whisper)|FastAPI worker — Railway service 5|CPU-intensive; isolated to prevent API latency spikes|

## **5.3 Job Queue: pg-boss (PostgreSQL-backed)**

|**Job Queue**  →  pg-boss 10.x|||
| :- | :- | :- |
|**Justification**||pg-boss is a PostgreSQL-backed job queue that requires zero additional infrastructure. It stores jobs in a dedicated Postgres schema, handles retries, delays, and concurrency — with no Redis, no RabbitMQ, and no extra Railway service to pay for. When the Hono API enqueues a 'transcribe-answer' job, the transcription worker polls pg-boss every few seconds and claims the job atomically. This means Railway service restarts (which happen on the free tier) do not lose jobs — they are durable in PostgreSQL. This is exactly the right call for a free-tier deployment where infrastructure reliability is limited.|
|**Alternatives**||Rejected: BullMQ — requires Redis; Redis on Railway free tier has tight memory limits; one more service to operate. Rejected: Celery + Redis — Python-native but again needs Redis; harder to monitor without a paid Redis dashboard. Rejected: in-memory queue — crashes on Railway restart; loses all pending transcription jobs (violates PRD NFR-04 spirit).|
|**PRD fit**||PRD F-07 requires transcription to complete 'within a time that does not make the platform feel broken'. pg-boss lets the API respond immediately with a 202 Accepted while the worker processes asynchronously. The recruiter UI polls the scorecard endpoint (TanStack Query's polling mode) until the status changes to 'completed'.|

# **6. ML Workers (Python / FastAPI)**


## **6.1 Worker Framework: FastAPI 0.115**
All five Python worker services share the same framework: FastAPI with Pydantic v2 for request/response validation. FastAPI's async request handling means a worker can handle a new job enqueue notification while a previous job is blocking on CPU-intensive inference. Each worker exposes a minimal internal HTTP API that only the Hono API service can reach (Railway private networking).

## **6.2 Transcription: faster-whisper**

|**Speech Transcription**  →  faster-whisper 1.1 (CTranslate2 backend)|||
| :- | :- | :- |
|**Justification**||faster-whisper is a reimplementation of OpenAI's Whisper using CTranslate2, a C++ inference engine optimised for CPU. On the same hardware, faster-whisper is 4× faster than the original openai-whisper package and uses 4× less memory. This is not a minor optimisation — for Railway's free-tier CPU, this is the difference between meeting and violating the PRD's 10-minute transcription SLA for a 3-minute video. The 'base' model (74 M parameters) transcribes a 3-minute English audio clip in approximately 3–5 minutes on a single CPU core, well within the 10-minute SLA. The 'small' model (244 M parameters) is more accurate but takes 8–12 minutes — borderline. The README must document the benchmark for both.|
|**Alternatives**||Rejected: openai-whisper (original) — 4× slower on CPU; will exceed the 10-min SLA on Railway free tier with the base model. Rejected: AssemblyAI / Deepgram API — paid APIs; explicitly forbidden by PRD constraints. Rejected: Vosk — lower accuracy on conversational English; not worth the accuracy trade-off.|
|**PRD fit**||PRD F-07 §7.7.1: 'transcription must complete within 10 minutes for a 3-minute video on Railway free-tier CPU'. This is the hardest technical constraint in the entire PRD. faster-whisper is the only open-source option that reliably meets it. PRD deliverable D-07 requires Whisper model benchmarks — document both 'base' and 'small' results.|

## **6.3 Whisper Model Size Decision Matrix**

|**Model**|**Parameters**|**Est. CPU Time (3 min audio)**|**WER (English)**|**Recommendation**|
| :- | :- | :- | :- | :- |
|tiny|39 M|~1–2 min|~8%|Too inaccurate for interview scoring; skip|
|base|74 M|~3–5 min|~5%|✅ RECOMMENDED — meets SLA with headroom|
|small|244 M|~8–12 min|~4%|Borderline; benchmark on actual Railway hardware|
|medium|769 M|~25–40 min|~3%|Violates SLA; not viable|
|large|1\.5 B|~90+ min|~2.7%|Violates SLA; not viable|

## **6.4 Semantic Embeddings: BAAI/bge-small-en-v1.5**

|**Embedding Model**  →  BAAI/bge-small-en-v1.5 via sentence-transformers|||
| :- | :- | :- |
|**Justification**||bge-small-en-v1.5 (33 M parameters) is the top-performing small English embedding model on the MTEB benchmark in 2026, outperforming the previously popular all-MiniLM-L6-v2 on semantic retrieval tasks by 3–5 percentage points while using similar memory. It produces 384-dimensional vectors that store compactly in pgvector. On Railway CPU, bge-small encodes a typical candidate profile (500 tokens) in under 100 ms — fast enough to score 10 candidates in under 2 seconds after the model is warm in the worker process. The model is downloaded once at worker startup and cached in the Railway service's memory for the lifetime of the process.|
|**Alternatives**||Rejected: all-MiniLM-L6-v2 — still viable but bge-small has better MTEB scores for the same size. Rejected: text-embedding-ada-002 (OpenAI API) — paid; violates PRD constraints. Rejected: bge-large — 335 M parameters; too heavy for Railway free-tier memory alongside other worker dependencies.|
|**PRD fit**||PRD F-03 §7.3.1 explicitly states: 'keyword matching is not acceptable — a candidate whose profile says built distributed systems at scale must match a JD requirement for microservices architecture experience'. Cosine similarity between bge-small vectors satisfies this; keyword overlap does not. pgvector stores embeddings in PostgreSQL — no separate vector database needed.|

## **6.5 Scraping: Playwright + httpx + tenacity**

|**Tool**|**Role**|**Why This, Not Alternatives**|
| :- | :- | :- |
|Playwright (Python)|LinkedIn public search scraping (JavaScript-rendered pages)|LinkedIn renders search results via XHR after JS execution; Playwright's Chromium headless browser handles this. Rejected Selenium: slower, heavier. Rejected requests-html: abandoned, unmaintained.|
|httpx|Secondary source scraping (static HTML pages like Naukri/Indeed public search)|Async HTTP client; HTTP/2 support; drops in as a requests replacement with zero learning curve. Much faster than requests for concurrent page fetches.|
|BeautifulSoup4|HTML parsing for both sources|Battle-tested; handles malformed HTML gracefully (partial profiles — PRD §7.2.1).|
|tenacity|Retry logic with exponential backoff|Declarative retry decorator: @retry(wait=wait\_exponential(min=1, max=60), stop=stop\_after\_attempt(5)). Handles PRD requirement of exponential backoff on 429/503 responses in 3 lines.|
|fake-useragent|Rotating User-Agent headers|Reduces likelihood of immediate IP blocks on public search pages without paid proxies.|

# **7. Authentication: Better Auth v1**


|**Authentication**  →  Better Auth v1 (self-hosted, open-source)|||
| :- | :- | :- |
|**Justification**||Better Auth (released mid-2024, v1 stable in 2025) is the only open-source, self-hosted auth library for TypeScript that requires zero external services and zero paid tier. It handles email/password auth, JWT session management, and role-based access control (recruiter vs. hiring manager vs. admin) out of the box. It plugs into Hono via a middleware adapter and stores sessions in the same PostgreSQL database — no Redis, no separate auth database. Critically, it also handles the candidate-facing token flow: the unique interview link token is verified as a one-time credential without needing a full user account for the candidate.|
|**Alternatives**||Rejected: Clerk — generous free tier (10 000 MAU) but external dependency; data leaves your infrastructure; unnecessary for a project where users are a known set. Rejected: Auth.js (NextAuth v5) — Next.js-coupled; harder to use from the Hono API. Rejected: Supabase Auth — would pull in Supabase as a dependency just for auth; adds complexity without benefit. Rejected: custom JWT — reinventing the wheel; session rotation and CSRF protection are non-trivial to get right.|
|**PRD fit**||PRD F-04 requires interview link tokens to be cryptographically random and not guessable (NFR-07). Better Auth's one-time token plugin generates UUID v4 tokens with expiry timestamps stored in PostgreSQL. PRD F-04 also requires invite status tracking — Better Auth's session metadata fields accommodate this without a separate table.|

# **8. Database: PostgreSQL 17 + pgvector + Drizzle ORM**


## **8.1 Database Engine: PostgreSQL 17 with pgvector**

|**Database**  →  PostgreSQL 17 (Railway managed) + pgvector extension|||
| :- | :- | :- |
|**Justification**||PostgreSQL was specified in the PRD data model. The key 2026 addition is pgvector: a PostgreSQL extension that stores and queries high-dimensional float vectors natively. This means candidate embeddings (generated by bge-small) live in the same database as all other application data — no separate Pinecone, Weaviate, or Qdrant service. The Drizzle ORM has first-class pgvector support via the vector() column type. Cosine similarity queries run as standard SQL: ORDER BY embedding <=> query\_vector LIMIT 10. PostgreSQL 17 on Railway's free tier provides 1 GB storage — more than sufficient for this project's scale (embeddings for 1 000 candidates × 384 dimensions = ~1.5 MB).|
|**Alternatives**||Rejected: MongoDB — document store; semantic vector search requires Atlas Vector Search (paid); no pgvector equivalent. Rejected: Supabase — would work but adds an external dependency and a separate account; Railway's built-in Postgres is simpler. Rejected: SQLite — no pgvector support; not suitable for multi-service Railway deployment (file locking issues).|
|**PRD fit**||PRD Section 10 defines 6 core entities. All map to PostgreSQL tables with Drizzle schema. The CandidateScore entity stores the per-dimension float scores — pgvector adds a 384-dimensional vector column to the Candidate table for embedding storage and ANN lookup.|

## **8.2 ORM: Drizzle ORM 0.40**

|**Feature**|**Drizzle ORM**|**Prisma (Alternative)**|**Why Drizzle Wins Here**|
| :- | :- | :- | :- |
|Bundle size|~7 KB runtime|~20 MB generated client|Drizzle has zero generated code; Prisma's generated client is too heavy for Railway's memory limits|
|pgvector support|First-class via drizzle-orm/pg-core|Plugin (community)|Drizzle's vector() type is type-safe; Prisma requires raw SQL for vector ops|
|Migration style|SQL-first push migrations|Migration files|For a 5-day project, drizzle-kit push applies schema changes in one command|
|Type inference|Full TypeScript from schema|Generated types|Drizzle infers TypeScript types directly from schema definitions — no code-gen step needed|
|Railway compatibility|Lightweight; no binary dependencies|Needs query engine binary|Prisma's Rust query engine adds startup overhead and memory usage on Railway|

# **9. Video Storage: Cloudflare R2 + tus Protocol**


|**Video Storage**  →  Cloudflare R2 (free tier) + tus resumable upload protocol|||
| :- | :- | :- |
|**Justification**||Cloudflare R2 provides 10 GB storage, 1 million Class A operations, and 10 million Class B operations per month on its free tier — with zero egress fees. This is the only S3-compatible object store with free egress in 2026, making it dramatically cheaper than AWS S3 (which charges per GB transferred). R2 is accessed via the AWS SDK (S3-compatible), so integration is two lines of config change from any S3 tutorial. The tus protocol (tus.io) is the open standard for resumable file uploads. tus-js-client on the Android app breaks each recorded video into chunks, uploads sequentially with a resume token, and automatically retries failed chunks. The tus-server can be a lightweight Node.js handler inside the Hono API or the official tusd binary deployed as a separate Railway service.|
|**Alternatives**||Rejected: AWS S3 — egress fees make it expensive at any scale; overkill for a student project. Rejected: Supabase Storage — free tier is only 1 GB; insufficient for multi-candidate video interviews. Rejected: Railway Volumes — 1 GB free; not S3-compatible; harder to serve video from. Rejected: Firebase Storage — Google account dependency; free tier limited; egress costs.|
|**PRD fit**||PRD F-05 §7.5.3 is explicit: 'recorded video must be uploaded in chunks with resume-on-failure, not as a single upload that fails and loses the recording.' tus is the canonical solution to this requirement. PRD NFR-04 targets ≥ 99% upload success rate even with connectivity drops — tus achieves this via its resumable protocol and the Android app's expo-network connectivity detection.|

# **10. Transactional Email: Resend**


|**Email Service**  →  Resend (free tier: 3 000 emails/month)|||
| :- | :- | :- |
|**Justification**||Resend is the cleanest transactional email API for TypeScript/Node.js projects in 2026. The free tier allows 3 000 emails/month and 100/day — far more than needed for an evaluation-period project. The Node.js SDK is three lines: import, instantiate with API key, call resend.emails.send(). Most importantly, Resend supports React Email — you write interview invitation emails as React components with full TypeScript type-checking, and Resend renders them to HTML automatically. This makes the invitation email template (which must include candidate name, role, unique link, time limits, and expiry) a 40-line React component rather than a fragile HTML string.|
|**Alternatives**||Rejected: SendGrid — older API design; less developer-friendly; free tier (100/day) is the same but DX is worse. Rejected: Postmark — no free tier (only 100 test emails then paid). Rejected: Nodemailer + SMTP — reliable but requires managing SMTP credentials and dealing with deliverability issues; no managed free tier.|
|**PRD fit**||PRD F-04 requires emails to deliver within 2 minutes of shortlisting. Resend's managed sending infrastructure handles deliverability and queuing. PRD UI also requires the email to contain the unique interview link — the Resend SDK call receives the token from Better Auth and embeds it in the React Email template.|

# **11. Deployment Strategy**


## **11.1 Infrastructure Map**

|**Service**|**Platform**|**Tier**|**Notes**|
| :- | :- | :- | :- |
|Next.js Recruiter Web App|Vercel|Free (Hobby)|Zero-config Next.js deploy; global CDN; instant rollbacks|
|Hono.js API Server|Railway|Free|Service 1; always-on web service; private networking to workers|
|JD Analysis + Question Gen Worker|Railway|Free|Service 2; FastAPI Python; triggered via pg-boss queue|
|Scraping Worker (Playwright)|Railway|Free|Service 3; FastAPI + Playwright; Chromium installed at build time|
|Semantic Scoring Worker|Railway|Free|Service 4; FastAPI + sentence-transformers; model cached in memory|
|Transcription Worker (faster-whisper)|Railway|Free|Service 5; FastAPI; Whisper base model loaded at startup|
|PostgreSQL 17 + pgvector|Railway|Free (1 GB)|Managed DB; pgvector extension enabled via Railway plugin|
|Video Chunk Storage|Cloudflare R2|Free (10 GB)|S3-compatible; tus upload handler in Hono API or tusd binary|
|Android APK Distribution|GitHub Releases|Free|APK attached to GitHub Release; README links directly|

## **11.2 CI/CD: GitHub Actions**

A single GitHub repository contains all services as a monorepo. GitHub Actions runs three workflow files:

|**Workflow**|**Trigger**|**Steps**|
| :- | :- | :- |
|web.yml|Push to main, PR|Type-check → lint → build Next.js → deploy to Vercel (via Vercel CLI action)|
|workers.yml|Push to main, PR|Python type-check (mypy) → tests (pytest) → build Docker image → push to Railway (via Railway CLI action)|
|mobile.yml|Tag v\* push|Install Expo dependencies → eas build --platform android --profile preview → attach APK to GitHub Release|

## **11.3 Environment Variable Strategy**
All secrets are stored in Railway's environment variable UI (backend) and Vercel's environment variable UI (frontend). No .env files are committed. The following variables are required across services:

|**Variable**|**Service**|**Value Source**|
| :- | :- | :- |
|DATABASE\_URL|All Railway services|Railway Postgres plugin (auto-injected)|
|R2\_ACCOUNT\_ID / R2\_ACCESS\_KEY\_ID / R2\_SECRET|Hono API|Cloudflare R2 dashboard|
|RESEND\_API\_KEY|Hono API|Resend dashboard|
|BETTER\_AUTH\_SECRET|Hono API|openssl rand -base64 32|
|ANTHROPIC\_API\_KEY (optional)|JD Analysis Worker|Anthropic console (if using Claude for LLM calls)|
|NEXT\_PUBLIC\_API\_URL|Vercel (Next.js)|Railway API service public URL|
|EXPO\_PUBLIC\_API\_URL|Expo app|Railway API service public URL (set in app.config.js)|

# **12. Full Dependency Reference**


## **12.1 Web App (package.json)**

|**Package**|**Version**|**Role**|
| :- | :- | :- |
|next|15\.3|App Router framework|
|react / react-dom|19\.x|UI library|
|tailwindcss|4\.1|Utility CSS|
|@shadcn/ui|latest|Copy-paste component primitives (not installed; generated)|
|@radix-ui/\*|latest|Unstyled accessible primitives underpinning shadcn|
|@tanstack/react-query|5\.x|Server state management|
|zustand|5\.0|Client state management|
|react-hook-form|7\.x|Form state|
|zod|3\.x|Schema validation (shared with API)|
|hono/client|4\.x|Type-safe API client generated from Hono routes|
|recharts|2\.x|Score breakdown charts in candidate detail view|
|@react-email/components|0\.x|Invitation email template|

## **12.2 API Server (package.json)**

|**Package**|**Version**|**Role**|
| :- | :- | :- |
|hono|4\.x|Web framework|
|better-auth|1\.x|Auth library|
|drizzle-orm|0\.40|ORM|
|drizzle-kit|0\.25|Schema migrations|
|pg|8\.x|PostgreSQL driver|
|pg-boss|10\.x|PostgreSQL-backed job queue|
|resend|3\.x|Transactional email|
|@aws-sdk/client-s3|3\.x|R2 / S3-compatible storage|
|zod|3\.x|Request validation|
|pino|9\.x|Structured logging|

## **12.3 Python Workers (requirements.txt)**

|**Package**|**Version**|**Role**|
| :- | :- | :- |
|fastapi|0\.115|Worker HTTP framework|
|uvicorn[standard]|0\.32|ASGI server|
|pydantic|2\.x|Request/response models|
|sentence-transformers|3\.x|bge-small-en-v1.5 embeddings|
|faster-whisper|1\.1|CPU-optimised Whisper transcription|
|playwright|1\.50|Chromium scraping (scraping worker only)|
|httpx|0\.28|Async HTTP for static page scraping|
|beautifulsoup4|4\.12|HTML parsing|
|tenacity|9\.x|Retry/backoff decorator|
|fake-useragent|1\.5|User-Agent rotation|
|asyncpg|0\.30|Async PostgreSQL driver|
|pgvector|0\.3|pgvector Python client for ORM queries|
|ffmpeg-python|0\.2|Audio extraction from uploaded video|
|anthropic|0\.40|Claude API client for LLM calls (optional)|

## **12.4 Android App (package.json)**

|**Package**|**Version**|**Role**|
| :- | :- | :- |
|expo|~53.0|SDK and toolchain|
|expo-router|~4.0|File-based routing + deep links|
|expo-camera|~15.0|Video recording|
|expo-file-system|~17.0|Local chunk assembly|
|expo-network|~6.0|Connectivity detection|
|expo-secure-store|~13.0|Secure token storage|
|tus-js-client|^4.0|Resumable chunked upload|
|react-native-reanimated|~3.17|Timer animations|
|@tanstack/react-query|5\.x|API state on mobile|
|zod|3\.x|Shared validation schemas|
|zustand|5\.0|Interview session state|

# **13. Risks & Mitigations**


|**Risk**|**Likelihood**|**PRD Impact**|**Mitigation**|
| :- | :- | :- | :- |
|Whisper 'base' model exceeds 10-min SLA on Railway CPU|Medium|F-07 §7.7.1 hard requirement|Benchmark on Day 1. If base model fails, tune audio to 16 kHz mono before feeding to Whisper — reduces processing time by ~30%. As last resort, limit max recording time to 2 min.|
|LinkedIn blocks Playwright scraper on Railway's IP range|High|F-02: 50% of scraping pipeline|Use httpx with rotating User-Agent as fallback; cache results aggressively; implement Playwright stealth plugin. Have secondary source (Naukri/Indeed) as primary if LinkedIn fails.|
|Railway free-tier memory limit (512 MB) exceeded by sentence-transformers + Whisper in same process|High|F-03, F-07 scoring accuracy|Run scoring and transcription as separate Railway services. bge-small uses ~130 MB; Whisper base uses ~290 MB. Separated, both fit within 512 MB each.|
|Chunked video upload state lost on app force-close|Low|NFR-04: ≥ 99% upload success|Persist upload session ID and chunk progress to expo-secure-store on every successful chunk. On re-open, read session ID and resume from last successful chunk index.|
|pg-boss job stuck in 'active' state after Railway worker restart|Medium|F-07: scorecard never generated|pg-boss has a configurable expireIn per job type. Set transcription jobs to expireIn: '15 minutes' — if the worker dies mid-job, pg-boss re-enqueues after expiry. Worker logs failure to Pino with job ID.|
|Cloudflare R2 free tier 10 GB exhausted during extended evaluation|Low|Video storage unavailable|Add a background cleanup job via pg-boss that deletes R2 objects for interviews older than 30 days. At 50 MB/interview average, 10 GB handles 200 complete interviews.|

# **14. Key Decisions Log**


|**Decision**|**Chosen**|**Rejected**|**Decisive Reason**|
| :- | :- | :- | :- |
|Embedding model|bge-small-en-v1.5|all-MiniLM-L6-v2|3–5% better MTEB retrieval score at same parameter count|
|Transcription backend|faster-whisper (CTranslate2)|openai-whisper|4× faster on CPU; fits Railway 10-min SLA|
|API framework|Hono.js|Express, Fastify, NestJS|Smallest memory footprint on Railway; native TypeScript; streaming support|
|Job queue|pg-boss|BullMQ + Redis|No Redis = no extra Railway service; Railway restart-safe via PostgreSQL durability|
|ORM|Drizzle ORM|Prisma|No binary query engine; pgvector first-class; drizzle-kit push suits 5-day timeline|
|Auth|Better Auth|Clerk, Auth.js|Self-hosted; no external account; handles both session auth and one-time interview tokens|
|Video storage|Cloudflare R2|AWS S3, Supabase Storage|Only free-egress S3-compatible store; 10 GB free; tus compatibility|
|Chunked upload protocol|tus|Custom multipart|Open standard; tus-js-client is maintained and battle-tested; server resumption built-in|
|Mobile framework|Expo SDK 53|Bare React Native|APK export via EAS Build; first-class deep-link support; expo-camera + expo-file-system|
|Monorepo structure|Single GitHub repo|Separate repos per service|Shared Zod schemas between API and frontend; unified CI/CD; easier for evaluators|

# **Appendix: Day-1 Setup Commands**


Run these commands to initialise the full stack on a new machine:

### **Create monorepo scaffold**
mkdir talent-platform && cd talent-platform

git init && npm init -y

mkdir apps/web apps/api workers/scraper workers/scorer workers/transcriber workers/jd-analysis mobile

### **Bootstrap Next.js web app**
cd apps/web && npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

npx shadcn-ui@latest init

### **Bootstrap Hono API**
cd apps/api && npm init -y

npm install hono better-auth drizzle-orm pg pg-boss resend zod pino @aws-sdk/client-s3

npm install -D drizzle-kit typescript @types/pg

### **Bootstrap Python workers (repeat for each)**
cd workers/scorer && python3 -m venv .venv && source .venv/bin/activate

pip install fastapi uvicorn pydantic sentence-transformers asyncpg pgvector

### **Bootstrap Expo mobile app**
cd mobile && npx create-expo-app@latest . --template blank-typescript

npx expo install expo-router expo-camera expo-file-system expo-network expo-secure-store

npm install tus-js-client react-native-reanimated zustand @tanstack/react-query zod

### **Enable pgvector on Railway Postgres**
-- Run once after Railway DB provision:

CREATE EXTENSION IF NOT EXISTS vector;

### **Deploy to Railway**
npm install -g @railway/cli

railway login && railway init

railway up   # deploys Hono API

cd workers/scorer && railway up   # deploy scoring worker

Confidential · VIT-AP University	Page 
