# TalentIQ — 5-Minute Demo Walkthrough

This guide walks you through the entire automated hiring pipeline of TalentIQ, showing how the system replaces manual screening with AI orchestration.

---

## Step 1: Post the Job Description

1. **Open the Web Portal** at `https://talentiq-web.onrender.com` (or your local equivalent).
2. Click **Create New Job**.
3. Paste the raw text of a Job Description (e.g., "Senior React Developer, 4+ years experience, Next.js, TypeScript").
4. Click **Parse Job Description**.
   - **Behind the scenes**: The API triggers the `jd-analysis` worker.
   - Claude 3.5 Sonnet extracts structured criteria: required skills, seniority level, domain, and generates 4 tailored interview questions specifically targeting this role.

## Step 2: Candidates Scraped & Scored (Zero-Touch)

1. Once the JD is active, click **Find Candidates**.
2. **Behind the scenes**:
   - The `scraper` worker spins up headless Chromium via Playwright.
   - It searches LinkedIn (public profiles) and Naukri for developers matching the core JD keywords.
   - Candidate profiles (Name, Title, Skills, Experience, Profile Link) are extracted and saved.
3. The `scorer` worker immediately evaluates each scraped profile:
   - **Technical Match**: TF-IDF similarity between candidate skills and JD stack.
   - **Seniority Match**: Validates years of experience and title rank.
   - **Domain Match**: Checks if current company aligns with the role.
   - **Implicit Signals**: Flags job-hopping or short tenures.
4. **Result**: You instantly see a ranked list of candidates on your dashboard. Anyone scoring above 70 is automatically shortlisted.

## Step 3: Interview Invitation Sent

1. Select a shortlisted candidate (e.g., "Alex Johnson - Score: 85").
2. Click **Invite to Interview**.
3. **Behind the scenes**:
   - The API creates a secure, one-time `interview_token`.
   - An email is dispatched via Resend to the candidate containing the token and instructions to download the TalentIQ Android app.

## Step 4: Candidate Completes Android Interview

1. The candidate opens the **TalentIQ Android App**.
2. They enter their secure `interview_token`.
3. The app fetches the 4 customized interview questions generated in Step 1.
4. The candidate records their video answers.
   - **Behind the scenes**: The app uses chunked multipart uploads. Even over 3G/4G, chunks are streamed directly to Cloudflare R2 object storage. No lost progress if the network drops.
5. The candidate taps **Submit**.

## Step 5: Scorecard Generated (AI Transcriber + Evaluator)

1. **Behind the scenes**:
   - The API enqueues a `transcribe` job to the Postgres queue.
   - The `transcriber` worker downloads the video from Cloudflare R2.
   - **ffmpeg** extracts the audio track.
   - **faster-whisper** (running on CPU) transcribes the audio to text locally in seconds.
   - Claude evaluates the transcript for *Relevance, Clarity, Specificity, and Depth* against the original question.
2. The AI generates a comprehensive **Scorecard**, concluding with a hiring signal (e.g., "Strong Hire") and a confidence score.

## Step 6: Candidates Compared

1. Back in the **Web Portal**, navigate to the **Interviews** tab.
2. You can now see the AI-generated scorecards for all completed interviews side-by-side.
3. The recruiter reviews the AI's *Ranking Justification* and *Follow-up Questions* to make the final human hiring decision.

---
**Summary**: In under 5 minutes of recruiter time (creating the JD and clicking "Invite"), the system sourced, screened, interviewed, and evaluated candidates autonomously.
