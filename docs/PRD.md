
**PRODUCT REQUIREMENTS DOCUMENT**

**AI-Powered Talent Screening &**

**Interview Intelligence Platform**


Assignment 3  |  VIT-AP University  |  Version 1.0

Web App (Recruiter Portal) + Android APK (Candidate Interview App)

June 2025


# **1. Document Metadata**


|**Document Title**|AI-Powered Talent Screening & Interview Intelligence Platform – PRD|
| :- | :- |
|**Version**|1\.0|
|**Status**|Draft|
|**Platform**|Web App (React) + Android APK (Expo/React Native)|
|**Backend**|Railway (free tier, CPU-only ML)|
|**Prepared By**|Lalit (B.Tech CSE, VIT-AP University)|
|**Intended Audience**|Development team, evaluators, hiring stakeholders|

# **2. Executive Summary**

Hiring at the screening stage is fundamentally broken. Recruiters invest hours reviewing CVs that miss the mark, interviewing candidates who looked strong on paper but fail on basics, and manually writing scorecards that vary wildly across interviewers. This platform eliminates that friction.

The AI-Powered Talent Screening & Interview Intelligence Platform automates the full pre-hire funnel: from the moment a recruiter publishes a job description (JD) to the moment a hiring manager makes a data-backed decision. The system parses a JD to extract explicit and implicit requirements, scrapes public candidate profiles for semantic matching, auto-shortlists qualified candidates, delivers personalised async video interviews via an Android app, transcribes and scores every answer with an open-source Whisper model on Railway, and surfaces a ranked, side-by-side candidate comparison dashboard.

The result is a consistent, auditable, bias-aware pipeline that saves recruiters hours per role and gives hiring managers the signal they need without the noise.

# **3. Problem Statement**

## **3.1 Current Pain Points**

|**#**|**Pain Point**|**Who Feels It**|**Impact**|
| :- | :- | :- | :- |
|P-01|Manual CV review is slow and inconsistent across recruiters|Recruiter|Wasted hours; missed qualified candidates|
|P-02|No semantic understanding — keyword CVs fool ATS systems|Hiring Manager|Poor quality shortlists; bad hires|
|P-03|Interview scorecards are informal and non-comparable|Hiring Manager|Biased decisions; no audit trail|
|P-04|Scheduling sync interviews wastes calendar time for both parties|Recruiter, Candidate|Slow time-to-hire; candidate drop-off|
|P-05|Generic interview questions do not test role-specific competencies|Candidate|Poor candidate experience; irrelevant signal|
|P-06|No structured side-by-side comparison of shortlisted candidates|Hiring Manager|Gut-feel decisions; inconsistent outcomes|
|P-07|Manual shortlisting ignores implicit JD signals (culture, seniority)|Recruiter|Role-culture mismatch after hire|

## **3.2 Opportunity**
LLM-based semantic understanding, open-source transcription (Whisper), and async video technology make it possible to build a fully automated screening pipeline that is more accurate than manual review, cheaper than traditional ATS tools, and usable on a student budget with Railway free-tier infrastructure.

# **4. Goals & Objectives**

## **4.1 Business Goals**
- Reduce recruiter time-per-role from initial JD post to shortlist by ≥ 60%.
- Produce a comparable, structured scorecard for every interviewed candidate.
- Eliminate scheduling friction for first-round screening entirely.
- Give hiring managers a ranked pipeline with plain-English justifications.

## **4.2 Product Goals**
- Full end-to-end flow functional: JD post → candidate scraped → scored → invited → interviewed → scorecard → comparison.
- Semantic scorer that genuinely distinguishes relevance from keyword coincidence.
- Android app that a nervous first-time candidate can use without guidance.
- Transcription pipeline completing within Railway CPU limits (< 10 min for a 3-min video).
- Recruiter dashboard usable by a non-technical hiring manager without training.

## **4.3 Technical Goals**
- All ML inference CPU-bound on Railway free tier with no paid external APIs.
- Chunked video upload with resume-on-failure for poor-connectivity scenarios.
- Scraper handling pagination, rate limiting with exponential backoff, and partial data.
- Whisper model size benchmarked and documented against Railway CPU performance.

# **5. Target Users & Personas**

## **5.1 Persona A — The Recruiter**

|**Attribute**|**Detail**|
| :- | :- |
|Name / Role|Priya — Technical Recruiter at a 200-person Series B startup|
|Goal|Fill 5 open engineering roles this quarter with minimal manual screening|
|Frustrations|Drowning in CVs; can't tell strong candidates from keyword stuffers; scheduling sync calls kills her afternoon|
|Tech Comfort|Comfortable with Notion, LinkedIn Recruiter, Greenhouse; no coding skills|
|Key Need|Post a JD and come back to a ranked, pre-screened shortlist with scorecards|
|Platform Used|Web app (desktop-first)|

## **5.2 Persona B — The Hiring Manager**

|**Attribute**|**Detail**|
| :- | :- |
|Name / Role|Arjun — Engineering Manager; owns the final hiring decision|
|Goal|Compare top 3 candidates apples-to-apples and pick the right one in under an hour|
|Frustrations|Inconsistent scorecards from different interviewers; no single view to compare candidates on the same criteria|
|Tech Comfort|High technical IQ but zero patience for cluttered UIs|
|Key Need|Side-by-side comparison with AI-generated recommended ranking and plain-English rationale|
|Platform Used|Web app (desktop)|

## **5.3 Persona C — The Candidate**

|**Attribute**|**Detail**|
| :- | :- |
|Name / Role|Ravi — Mid-level Software Engineer applying for a senior backend role|
|Goal|Complete the async interview quickly and without tech issues|
|Frustrations|Scheduling sync calls around his current job; generic questions that don't reflect the role; unclear instructions|
|Tech Comfort|Comfortable with smartphones; never used an async interview app before|
|Key Need|Clear, calm interface; know exactly what question is coming, how long he has, and that his answer was saved|
|Platform Used|Android app (phone, potentially on mobile data)|

# **6. User Stories**

## **6.1 Story Table Headers**

|**ID**|**Role**|**User Story (As a… I want… so that…)**|**Acceptance Criteria (summary)**|**Priority**|
| :- | :- | :- | :- | :- |

## **6.2 Job Description & Scraping**

|**US-01**|Recruiter|I want to paste or type a JD so that the system auto-extracts required skills, preferred skills, experience range, seniority level, and implicit culture signals.|Extraction returns ≥ 5 required skills, experience range, seniority, and ≥ 1 implicit signal for a real-world JD.|**High**|
| :- | :- | :- | :- | :- |

|**US-02**|Recruiter|I want the system to automatically scrape public LinkedIn search results and a second job board so that I have a candidate pipeline within minutes of posting a JD.|≥ 10 candidates returned per JD; scraper handles pagination and rate limiting without crashing.|**High**|
| :- | :- | :- | :- | :- |

|**US-03**|Recruiter|I want partial profiles (name + title only) to still appear in the pipeline at a lower confidence score so that no candidate is silently dropped.|Partial profiles appear with a 'Low Confidence' badge; score reflects data completeness.|**Medium**|
| :- | :- | :- | :- | :- |

## **6.3 Semantic Scoring & Shortlisting**

|**US-04**|Recruiter|I want every candidate to receive a semantic score broken down by JD criterion (technical skills, seniority, domain) so that I understand why they ranked where they did.|Score breakdown shows ≥ 3 dimension scores; semantically equivalent terms match even without exact keyword overlap.|**High**|
| :- | :- | :- | :- | :- |

|**US-05**|Recruiter|I want red flags auto-detected (job hopping, title inflation, skill-level mismatch) so that I can make informed shortlisting decisions.|At least one red flag correctly identified per test profile containing a known issue; false positive rate < 30%.|**High**|
| :- | :- | :- | :- | :- |

|**US-06**|Recruiter|I want auto-shortlisting above a configurable threshold so that I don't need to manually review every candidate.|Shortlisting threshold adjustable (default 70%); auto-shortlisted candidates receive interview invitations; manual override works in both directions.|**High**|
| :- | :- | :- | :- | :- |

## **6.4 Interview Invitation**

|**US-07**|Recruiter|I want shortlisted candidates to receive a unique interview link via email so that each link is single-use and tied to that candidate.|Email delivered within 2 minutes of shortlisting; link is unique per candidate; expired/used links return a clear error.|**High**|
| :- | :- | :- | :- | :- |

|**US-08**|Candidate|I want the interview link to deep-link into the Android app so that I do not need to search for the app manually.|Opening the link on Android with the app installed launches directly to the introduction screen; without the app a web fallback explains how to install.|**Medium**|
| :- | :- | :- | :- | :- |

## **6.5 Async Video Interview (Android App)**

|**US-09**|Candidate|I want an introduction screen explaining the format, time limits, and no-re-record policy so that I am not surprised mid-interview.|Introduction screen shown before any question; candidate must tap 'I understand' to proceed.|**High**|
| :- | :- | :- | :- | :- |

|**US-10**|Candidate|I want each question displayed prominently with a think timer (30 s default) before recording begins so that I can collect my thoughts.|Think timer counts down visually; recording begins automatically after timer; candidate cannot skip the think time.|**High**|
| :- | :- | :- | :- | :- |

|**US-11**|Candidate|I want to know my remaining recording time clearly during each answer so that I can pace my response.|Countdown timer visible throughout recording; visual + subtle audio cue at 30 s remaining; recording stops at the limit.|**High**|
| :- | :- | :- | :- | :- |

|**US-12**|Candidate|I want my video uploaded in chunks so that a connectivity drop does not lose my recording.|Chunk upload with resume-on-failure; no answer already submitted is lost; candidate can resume from last submitted question on reconnect.|**High**|
| :- | :- | :- | :- | :- |

|**US-13**|Candidate|I want error states (no camera, upload failure) explained in plain English so that I know exactly what to do.|Zero technical error codes shown to candidate; every error state has a plain-English message and a clear action button.|**High**|
| :- | :- | :- | :- | :- |

## **6.6 Personalised Question Generation**

|**US-14**|Candidate|I want questions tailored to my specific profile and the JD so that the interview tests my actual background.|Candidate with Python listed prominently receives ≥ 1 Python-specific question; management-role candidate receives ≥ 1 seniority-calibrated behavioural question.|**High**|
| :- | :- | :- | :- | :- |

## **6.7 Transcription & Scoring**

|**US-15**|Recruiter|I want each video answer transcribed and scored on relevance, clarity, specificity, and depth so that I have structured signal per answer.|Transcription completes within 10 minutes for a 3-minute video on Railway CPU; score breakdown shows ≥ 4 dimensions per answer.|**High**|
| :- | :- | :- | :- | :- |

|**US-16**|Hiring Manager|I want a per-candidate scorecard with a hire/no-hire recommendation and confidence level so that I can make a fast initial decision.|Scorecard includes: 2–3 sentence answer summary, per-dimension score, hire signal with confidence %, and ≥ 3 follow-up questions.|**High**|
| :- | :- | :- | :- | :- |

## **6.8 Candidate Comparison**

|**US-17**|Hiring Manager|I want to select 2–4 candidates and compare their semantic scores and interview scorecards side by side so that I can make a consistent decision.|Comparison view shows all selected candidates in parallel columns; answer summaries for the same question displayed side by side; expandable to full summary.|**High**|
| :- | :- | :- | :- | :- |

|**US-18**|Hiring Manager|I want a plain-English recommended ranking with justification so that I can defend my hiring decision without re-reading every scorecard.|Ranking with ≥ 2-sentence justification per candidate generated by LLM; visible in comparison view.|**High**|
| :- | :- | :- | :- | :- |

# **7. Feature Specifications**

## **F-01: Job Description Analysis Engine**
### **7.1.1 Overview**
When a recruiter submits a JD (free text or paste), an LLM-powered parser extracts structured signal used to drive all downstream scoring, question generation, and comparison.

### **7.1.2 Extracted Fields**

|**Field**|**Type**|**Example Output**|**Notes**|
| :- | :- | :- | :- |
|Required Skills|String[]|["Python", "Kubernetes", "SQL"]|With seniority qualifier if stated|
|Preferred Skills|String[]|["Go", "Terraform"]|Weighted lower in scoring|
|Experience Range|Object|{ min: 3, max: 6, unit: "years" }|Handles ranges like '3-6 years' or '5+ years'|
|Seniority Level|Enum|"Senior" | "Lead" | "Mid"|Inferred from title + context|
|Role Level|Enum|"IC" | "Manager" | "Director"|Individual contributor vs. people manager|
|Implicit Signals|String[]|["startup tolerance", "stakeholder management"]|NLP inference from JD prose|
|Domain|String|"FinTech" | "E-commerce" | "SaaS"|Optional; inferred from company/context|

### **7.1.3 Acceptance Criteria**
- Parser returns all 7 field types for any real-world JD within 10 seconds.
- Implicit signal extraction catches ≥ 1 non-obvious signal in 80% of test JDs.
- Recruiter can manually edit any extracted field before scoring begins.

## **F-02: Candidate Scraping Pipeline**
### **7.2.1 Sources**

|**Source**|**Data Extracted**|
| :- | :- |
|LinkedIn public search|Name, current title, company, skills, experience summary snippet|
|Secondary job board (e.g., Naukri/Indeed public)|Same fields where available; profile URL|

### **7.2.2 Pipeline Requirements**
- Pagination: scraper must follow 'next page' until either 50 results or end of results per source.
- Rate limiting: exponential backoff on HTTP 429 or 503 responses; minimum 3 retries before marking source unavailable.
- Partial data: profiles with only name + title must be accepted and flagged with a 'Low Confidence' badge; never dropped.
- Deduplication: candidates appearing across both sources merged by name + company matching.
- No paid scraping proxies; solution must work on public search pages within Railway free tier.

### **7.2.3 Data Schema**

|**Field**|**Required?**|**Source**|**Fallback Behaviour**|
| :- | :- | :- | :- |
|name|Yes|Both|Drop profile only if name is unavailable|
|current\_title|Yes|Both|Mark as 'Unknown Title'; keep profile|
|current\_company|No|Both|Leave null; reduce confidence score|
|skills|No|Both|Leave empty array; score reflects absence|
|experience\_summary|No|Both|Leave null; LLM scores on available fields|
|profile\_url|No|Both|Leave null if unavailable|
|data\_confidence|Computed|System|"high" | "medium" | "low"|

## **F-03: Semantic Candidate Scoring**
### **7.3.1 Scoring Architecture**
The scorer uses sentence-transformer embeddings (e.g., all-MiniLM-L6-v2) to compute cosine similarity between JD requirement vectors and candidate profile vectors. Keyword overlap is explicitly prohibited as the primary signal.

### **7.3.2 Score Dimensions**

|**Dimension**|**Weight (default)**|**What It Measures**|
| :- | :- | :- |
|Technical Skills Match|40%|Semantic similarity between candidate skills/experience and required + preferred skills|
|Seniority Indicators|25%|Titles, scope of work, team size cues vs. JD seniority level|
|Domain Experience|20%|Industry or domain-specific terminology alignment|
|Implicit Signal Match|15%|Soft signals: startup tolerance, stakeholder language, etc.|

### **7.3.3 Red Flag Detection**
- Job hopping: > 3 jobs in < 24 months flagged unless titles suggest contracting pattern.
- Title inflation: 'Director' at a company with < 20 employees flagged with a note.
- Skill-level mismatch: skills listed that contradict stated years of experience (e.g., 'Kubernetes architect' with 6 months total experience).

### **7.3.4 Shortlisting Logic**
- Default auto-shortlist threshold: 70% composite score.
- Threshold adjustable per job posting by recruiter (range 50%–90%).
- Recruiter can manually add or remove any candidate from shortlist regardless of score.
- Manual overrides logged with timestamp for audit purposes.

## **F-04: Interview Invitation Workflow**
- Unique token-based interview link generated per shortlisted candidate.
- Email sent via a transactional email service (e.g., Resend or SendGrid free tier).
- Email includes: candidate name, role title, link, time limit per question, and expiry date.
- Links expire after 7 days; recruiter can regenerate an expired link from the candidate detail view.
- Invitation status tracked: Not Invited | Invited | Link Opened | In Progress | Completed.

## **F-05: Android Interview App (Expo/React Native)**
### **7.5.1 Screen Flow**
1. Deep link / direct open → Splash + Token Validation screen
1. Introduction screen: format, time limits, no-re-record policy, 'I Understand' CTA
1. Question screen (per question): question text, think timer, recording state, remaining time
1. Post-answer confirmation: 'Answer submitted' before advancing to next question
1. Review screen: list of all questions with submitted / not-submitted status
1. Submit screen: final confirmation; submission locked after this point

### **7.5.2 Think Timer & Recording**
- Think time: 30 seconds default; recruiter configurable per job (10 s – 120 s).
- Max recording time: 3 minutes default; recruiter configurable (1 min – 5 min).
- No re-record once an answer is submitted.
- Recording stops automatically at max time; candidate cannot exceed the limit.

### **7.5.3 Chunked Upload & Connectivity Resilience**
- Video recorded locally; uploaded in 512 KB chunks with a unique chunk index and session token.
- On upload failure: retry with exponential backoff (max 5 retries per chunk).
- On connectivity loss: local session persists; candidate returns to app and resumes from last successfully uploaded answer.
- Backend assembles chunks and confirms full upload before marking answer as received.

### **7.5.4 Error States (Candidate-Facing)**

|**Error**|**Plain-English Message**|**Action Offered**|
| :- | :- | :- |
|Camera permission denied|We need camera access to record your interview. Please allow it in your phone settings.|Open Settings button|
|Microphone permission denied|We need microphone access. Please allow it in your phone settings.|Open Settings button|
|Upload failure (no connectivity)|Your answer is saved on your device. We'll upload it as soon as you're back online.|Retry button + progress indicator|
|Session token expired|This interview link has expired. Please contact the company for a new link.|Copy support email button|
|Storage full|Your device is running low on storage. Please free up some space and try again.|Open device storage link|

## **F-06: LLM Question Generation**
Questions are generated per-candidate, not per-job, ensuring each interview tests the candidate's actual background against the JD requirements.

### **7.6.1 Generation Rules**
- Minimum 4, maximum 8 questions per interview.
- Mix: ≥ 2 technical questions referencing candidate's specific listed skills, ≥ 1 behavioural question calibrated to seniority level, ≥ 1 domain/role-specific scenario question.
- Questions must be phrased as open-ended prompts, not yes/no.
- Questions stored and locked at invite-send time; cannot change after candidate receives link.

## **F-07: Transcription & Answer Scoring Pipeline**
### **7.7.1 Transcription**
- Model: Whisper (open-source); model size chosen based on Railway CPU benchmark (documented in README).
- Audio extracted from video server-side before transcription.
- Target: 3-minute video transcribed in under 10 minutes on Railway free-tier CPU.
- Transcription triggered automatically upon successful full video assembly on Railway.

### **7.7.2 Answer Scoring Dimensions**

|**Dimension**|**Definition**|**Scoring Method**|
| :- | :- | :- |
|Relevance|Does the answer address the question and connect to the JD?|Cosine similarity between answer embedding and question + JD embeddings|
|Clarity|Is the answer well-structured and free of excessive filler words?|Filler word ratio (um, uh, like, you know) + sentence structure analysis|
|Specificity|Does the candidate cite concrete examples, metrics, or outcomes?|Named entity detection (numbers, dates, project names, company names)|
|Depth|Does the answer go beyond surface-level description?|Response length relative to question complexity + concept coverage breadth|

### **7.7.3 Scorecard Output**
- 2–3 sentence AI-generated summary per answer.
- Per-dimension score (0–100) per answer.
- Aggregate candidate score across all answers and all dimensions.
- Hire / No-Hire recommendation with confidence level (0–100%).
- 3–5 follow-up questions for the live interview stage.

## **F-08: Recruiter Web App — Views**
### **7.8.1 Job Posting Dashboard**
- All active job postings displayed as cards.
- Each card shows: role title, date posted, candidate count, average semantic score, interview completion rate.
- Quick actions: view pipeline, edit JD, close role.

### **7.8.2 Candidate Pipeline View**
- Ranked list of all candidates for a job sorted by semantic score (descending).
- Each row: name, current title, company, semantic score, shortlist status badge, interview status badge.
- One-click 'Send Invite' button per shortlisted candidate not yet invited.
- Filter controls: by score range, shortlist status, interview status, red flag present.

### **7.8.3 Candidate Detail View**
- Full semantic score breakdown with per-dimension scores.
- Red flag analysis with explanations.
- Full interview scorecard (after completion): per-question summaries, dimension scores, hire signal, follow-up questions.
- Shortlist override toggle with audit log.

### **7.8.4 Candidate Comparison View**
- Select 2–4 candidates for side-by-side comparison.
- Columns per candidate; rows = JD criteria scores, interview dimension scores, answer summaries per question.
- Expandable rows: click any question row to see full answer summaries for all compared candidates simultaneously.
- AI-generated ranking with plain-English justification at top of view.

# **8. Non-Functional Requirements**

|**ID**|**Category**|**Requirement**|**Target / Constraint**|
| :- | :- | :- | :- |
|NFR-01|Performance|Transcription latency|≤ 10 min per 3-min video on Railway free-tier CPU|
|NFR-02|Performance|Candidate scoring throughput|≥ 10 candidates scored per minute|
|NFR-03|Performance|Web app load time (initial)|< 3 seconds on a standard broadband connection|
|NFR-04|Reliability|Chunked upload success rate|≥ 99% of started uploads complete even with 1 connectivity drop|
|NFR-05|Reliability|Scraper uptime|Scraper must not crash on partial HTML or 429 responses; handle gracefully|
|NFR-06|Scalability|Infrastructure|All services deployable on Railway free tier within memory limits|
|NFR-07|Security|Interview link tokens|UUID v4 or cryptographically random 32-byte token; not guessable|
|NFR-08|Security|Candidate video storage|Videos stored with access-controlled URLs; not publicly listable|
|NFR-09|Usability|Recruiter onboarding|Recruiter can post a JD and view a scored pipeline with zero training|
|NFR-10|Usability|Candidate app clarity|Candidate can complete the full interview without reading any documentation|
|NFR-11|Accessibility|Candidate app error states|Zero technical error codes exposed to candidate in the UI|
|NFR-12|Compliance|Data handling|No candidate data stored beyond 90 days post role closure without explicit consent|
|NFR-13|Cost|External APIs|No paid transcription, scraping proxy, or video hosting APIs; open-source + Railway only|
|NFR-14|Documentation|Whisper benchmark|Model size, Railway CPU specs, and transcription time per video length documented in README|

# **9. System Architecture Overview**

The platform consists of three logical layers: the Recruiter Web App (React), the Android Candidate App (Expo/React Native), and the Railway Backend (REST API + ML workers). All persistent state lives in a PostgreSQL database hosted on Railway.

## **9.1 Component Map**

|**Component**|**Technology**|**Responsibility**|**Deployment**|
| :- | :- | :- | :- |
|Recruiter Web App|React + Tailwind CSS|All recruiter and hiring manager views|Railway static / Vercel|
|Candidate Android App|Expo / React Native|Interview recording, chunked upload, deep linking|Distributed as APK|
|API Gateway|Node.js / Fastify|REST endpoints, auth, business logic orchestration|Railway service|
|JD Analysis Worker|Python + OpenAI-compatible LLM (self-hosted or claude-sonnet via Anthropic API)|JD parsing, question generation, scorecard LLM calls|Railway worker|
|Scraping Worker|Python + Playwright / httpx|LinkedIn + secondary source scraping with backoff|Railway worker|
|Scoring Engine|Python + sentence-transformers|Embedding generation, cosine similarity scoring, red flag detection|Railway worker|
|Transcription Worker|Python + Whisper (CPU)|Audio extraction, transcription, answer scoring|Railway worker|
|File Storage|Railway Volume or Cloudflare R2 (free tier)|Chunked video assembly and storage|Railway / R2|
|Database|PostgreSQL on Railway|All structured data: jobs, candidates, scores, scorecards|Railway managed DB|
|Email Service|Resend or SendGrid (free tier)|Interview invitation emails|External (free tier)|

# **10. Core Data Model**

|**Entity**|**Key Fields**|**Relationships**|
| :- | :- | :- |
|Job|id, title, jd\_text, parsed\_jd (JSONB), shortlist\_threshold, status, created\_at|has many Candidates|
|Candidate|id, job\_id, name, title, company, skills[], experience\_summary, profile\_url, data\_confidence, scraped\_at|belongs to Job; has one CandidateScore; has one Interview|
|CandidateScore|id, candidate\_id, technical\_score, seniority\_score, domain\_score, implicit\_score, composite\_score, red\_flags (JSONB), shortlisted, shortlist\_override, override\_by, override\_at|belongs to Candidate|
|Interview|id, candidate\_id, token, status, questions (JSONB), expires\_at, started\_at, submitted\_at|belongs to Candidate; has many Answers|
|Answer|id, interview\_id, question\_index, video\_chunks\_received, video\_assembled, transcription, relevance\_score, clarity\_score, specificity\_score, depth\_score, summary, created\_at|belongs to Interview|
|Scorecard|id, interview\_id, aggregate\_score, hire\_signal, confidence, follow\_up\_questions (JSONB), ranking\_justification, generated\_at|belongs to Interview|

# **11. Key API Endpoints**

|**Method**|**Endpoint**|**Description**|**Auth**|
| :- | :- | :- | :- |
|POST|/api/jobs|Create job, trigger JD analysis|Recruiter session|
|GET|/api/jobs|List all jobs with pipeline stats|Recruiter session|
|GET|/api/jobs/:id/candidates|Ranked candidate pipeline for a job|Recruiter session|
|PATCH|/api/candidates/:id/shortlist|Manual shortlist override|Recruiter session|
|POST|/api/candidates/:id/invite|Send interview invitation email|Recruiter session|
|GET|/api/interview/:token|Validate token; return questions (candidate)|Token|
|POST|/api/interview/:token/chunk|Upload a video chunk for an answer|Token|
|POST|/api/interview/:token/submit|Mark interview as submitted|Token|
|GET|/api/candidates/:id/scorecard|Return full scorecard after processing|Recruiter session|
|POST|/api/comparison|Generate side-by-side comparison for 2–4 candidate IDs|Recruiter session|

# **12. Success Metrics**

## **12.1 Core Metrics**

|**Metric**|**Definition**|**Target**|**Measurement Method**|
| :- | :- | :- | :- |
|Semantic Scorer Accuracy|% of test candidates where a semantically equivalent profile ranks above a keyword-stuffed profile|≥ 85%|Manual A/B test with curated candidate pairs|
|Scraper Coverage|Candidates returned per JD from at least 2 sources|≥ 10 candidates|End-to-end test with a real JD posted|
|Scraper Resilience|Scraper success rate on sources returning 429 rate limit responses|100% handled (no crash)|Simulated rate-limit test in CI|
|Partial Profile Inclusion|% of partial (name+title only) profiles that appear in pipeline|100%|Inject partial profiles into scraper output; verify appearance|
|Chunked Upload Success|% of interviews completed despite 1 simulated connectivity drop mid-upload|≥ 99%|Physical device test with airplane mode toggle|
|Transcription Latency|Wall-clock time to transcribe a 3-minute video on Railway free-tier CPU|< 10 minutes|Benchmark test documented in README|
|Answer Score Differentiation|Score gap between a strong answer and a weak answer on the same question|≥ 20 percentage points|Manual evaluation with curated strong/weak answer pairs|
|Scorecard Completeness|% of submitted interviews that produce a complete scorecard without manual intervention|≥ 95%|End-to-end flow test across 20 test interviews|
|Comparison View Usefulness|User (evaluator) can identify the recommended hire from comparison view alone|Pass in evaluator walkthrough|Evaluator test session; no additional context given|
|Candidate App Error Clarity|% of error states that show zero technical codes|100%|Manual review of all error state screens|
|Recruiter Onboarding Time|Time for a non-technical recruiter to post a JD and reach a scored pipeline|< 5 minutes|Usability test with a non-technical participant|

## **12.2 Bonus Feature Metrics (If Implemented)**

|**Bonus Feature**|**Success Metric**|**Target**|
| :- | :- | :- |
|Live Interview Mode|WebRTC connection established and real-time transcript updates within 5 s of speech|≥ 1 successful live session on local network|
|Bias Detection|Bias audit report generated for each job posting; ≥ 1 signal detected in a seeded biased JD|100% of jobs have a bias report|
|Pipeline CRM|Recruiter can move candidate through all 6 stages and export pipeline CSV|Full CSV export validated|
|iOS Support|Expo Go loads interview flow on iOS; feature differences documented|README documents iOS delta|

# **13. Constraints & Assumptions**

## **13.1 Hard Constraints**
- All backend services on Railway free tier — no paid compute.
- All ML inference (transcription, scoring) CPU-bound within Railway memory limits.
- Android app built in Expo/React Native and distributed as a directly installable APK.
- No paid scraping proxies; scraper must work from Railway's IP range on public search pages.
- Transcription must use Whisper or equivalent open-source model; no paid transcription API.
- Live Railway URL operational at submission time.
- Public GitHub repository including Expo project.

## **13.2 Assumptions**
- LinkedIn and the secondary job board will have publicly accessible search result pages without mandatory authentication during development and evaluation.
- Railway free-tier CPU is sufficient for Whisper base or small model within the 10-minute SLA (to be confirmed via documented benchmark).
- Candidates will be evaluated on an Android device capable of running the generated APK (Android 8.0+).
- A transactional email free-tier plan (Resend or SendGrid) is sufficient for evaluation-volume email sends.

# **14. Delivery Timeline**

|**Day**|**Milestone**|**Done-When**|
| :- | :- | :- |
|Day 1|JD Analysis + Scraping MVP + Semantic Scorer|1 JD posted → 10 candidates scraped from ≥ 1 source → scored with breakdowns visible|
|Day 2|Full Scraping (2 sources) + Shortlisting + Email Invites + Expo Scaffold|Both sources return results; shortlist + override working; invite email sent; Expo app opens on physical Android device|
|Day 3|Expo Interview Recording Flow + Chunked Upload + Question Generation|Candidate completes interview on Android → chunked upload arrives at Railway backend|
|Day 4|Transcription Pipeline + Answer Scoring + Scorecard + Comparison View|Full scorecard generated for a submitted interview; comparison view functional|
|Day 5|UI Polish + Benchmarks + Error Handling + README + APK Build|Railway URL stable; APK tested on device; README complete with benchmarks; screen recording walkthrough done|

# **15. Out of Scope (v1)**

- Paid tier infrastructure (AWS, GCP, Azure compute).
- iOS App Store distribution (Expo Go iOS support is a bonus, not a requirement).
- Authenticated LinkedIn scraping via official LinkedIn API (requires partnership approval).
- Automated offer letter generation or HRIS integration.
- Real-time collaborative scorecard editing by multiple recruiters simultaneously.
- Multi-language transcription (English-only for v1; Whisper is multilingual by default but not a requirement).

# **16. Open Questions**

|**#**|**Question**|**Owner**|**Resolution Needed By**|
| :- | :- | :- | :- |
|OQ-01|Which Whisper model size (tiny / base / small) meets the < 10 min transcription SLA on Railway CPU? Must be benchmarked.|Dev|Day 1|
|OQ-02|Which secondary job board (Naukri, Indeed, Shine) returns the most accessible public candidate data without requiring login?|Dev|Day 1|
|OQ-03|What transactional email provider (Resend vs SendGrid) has the most generous free-tier daily send limit for evaluation?|Dev|Day 2|
|OQ-04|Can Railway free-tier volumes handle chunked video assembly for 3-minute videos (≈ 50–150 MB per answer)?|Dev|Day 3|
|OQ-05|Does Cloudflare R2 free tier (10 GB/month) provide sufficient storage for evaluation-period video files?|Dev|Day 3|
|OQ-06|What is the rate-limit pattern for the chosen secondary job board, and does exponential backoff with jitter sufficiently avoid blocks?|Dev|Day 2|

# **Appendix A: Glossary**

|**Term**|**Definition**|
| :- | :- |
|JD|Job Description — the free-text role specification posted by a recruiter|
|Semantic Matching|Similarity scoring based on meaning and context, not keyword overlap|
|Whisper|Open-source speech recognition model by OpenAI; used for video transcription|
|Chunked Upload|Breaking a large file into smaller pieces uploaded sequentially with resume support|
|Sentence Transformer|A neural network model that converts text into fixed-size semantic vectors|
|Cosine Similarity|A metric for comparing two vectors; used to measure semantic distance between JD requirements and candidate profiles|
|Expo|A React Native framework for building cross-platform mobile apps with APK export support|
|Railway|A cloud infrastructure platform used as the deployment target for all backend services|
|Red Flag|An auto-detected signal in a candidate profile that warrants recruiter attention (e.g., title inflation, job hopping)|
|Shortlist|A curated subset of candidates invited to complete the async video interview|
|Scorecard|A structured per-candidate document generated after interview analysis containing scores, summaries, and recommendations|
|Deep Link|A URL that opens directly to a specific screen inside a mobile app rather than a browser|
|Implicit Signal|A non-explicit requirement inferred from JD prose (e.g., 'fast-paced environment' → startup tolerance)|
|Think Timer|A countdown before recording begins, giving the candidate time to organise their response|

# **Appendix B: Submission Deliverables Checklist**

|**#**|**Deliverable**|**Format**|**Status**|
| :- | :- | :- | :- |
|D-01|Public GitHub repository including Expo project|GitHub URL|[ ] Pending|
|D-02|Live Railway URL (operational at submission time)|HTTPS URL|[ ] Pending|
|D-03|Android APK linked from README for direct download|.apk file|[ ] Pending|
|D-04|README: architecture overview|Markdown section|[ ] Pending|
|D-05|README: semantic scoring approach|Markdown section|[ ] Pending|
|D-06|README: scraping sources and rate limiting strategy|Markdown section|[ ] Pending|
|D-07|README: Whisper model benchmarks on Railway CPU|Table with model size / video length / wall-clock time|[ ] Pending|
|D-08|README: chunked upload implementation|Markdown section|[ ] Pending|
|D-09|README: deployment instructions|Step-by-step|[ ] Pending|
|D-10|Screen recording or written walkthrough (max 5 min)|Video or written doc|[ ] Pending|

