TalentIQ Design System	v1.0

**TALENTIQ**

**Design System Documentation**

*AI-Powered Talent Screening & Interview Intelligence Platform*

Version 1.0  ·  Visual Language, Components & Layout Specification

Companion to: AI-Powered Talent Screening & Interview Intelligence Platform — PRD v1.0

June 2026


# **Table of Contents**






**FOUNDATION**
# **1. Design Philosophy**
The platform's visual identity — internally named “Midnight Ember” — pairs a near-black, layered surface system with a single warm-orange accent (#FF7A00). The aesthetic is confident and data-forward: it borrows Material You's tonal elevation model and pill-shaped controls, then reserves all color saturation for the moments that matter — scores, calls to action, and live status.
## **1.1 Principles**
- Orange is a signal, not a decoration. It appears only on primary actions, active/selected states, scores, and AI-generated content — never as general decoration.
- Hierarchy through tone, not just size. Five near-black surface tones (#0A0A0A → #222222) create depth without ever using pure black or harsh borders.
- Soft geometry throughout. Large radii (16–48px) and pill-shaped buttons signal approachability — this is a hiring tool used by nervous candidates as much as recruiters.
- Data gets its own typeface. Roboto Mono is reserved exclusively for scores, percentages, and timestamps, separating “measured” content from prose.
- Glow is earned, not constant. Ember glow effects appear on hover/active states only — the resting UI stays calm and low-contrast.
## **1.2 Two Platforms, One System**

|**Surface**|**Audience**|**Density**|**Key constraint**|
| :- | :- | :- | :- |
|Web App (Recruiter Portal)|Recruiters & Hiring Managers|Information-dense, desktop-first|Usable by a non-technical hiring manager without training|
|Android App (Candidate Interview)|Job Candidates|Minimal, single-task per screen|Must be usable by a first-time, possibly nervous candidate with no guidance|

**FOUNDATION**
# **2. Color System**
All colors are derived from a single #FF7A00 ember-orange seed against a five-step near-black surface scale. The palette intentionally excludes pure black (#000000) to avoid harsh contrast on OLED and standard displays alike.
## **2.1 Surfaces**
Surfaces build hierarchy through tonal steps rather than borders. Each step up represents one level of visual elevation: card → nested panel → chip/badge area.

|**Swatch**|**Name**|**Hex**|**Usage**|
| :- | :- | :- | :- |
| |**Background**|#0A0A0A|App background / page canvas|
| |**Surface**|#141414|Cards, sidebar, default panel|
| |**Surface Low**|#1A1A1A|Card hover state, nested sections|
| |**Surface Mid**|#1E1E1E|Chips, badge background, table headers|
| |**Overlay**|#222222|Modal scrims, deepest nested layer|
| |**Border**|#2A2A2A|Hairline dividers — used sparingly|
## **2.2 Primary Palette — Ember**

|**Swatch**|**Name**|**Hex**|**Usage**|
| :- | :- | :- | :- |
| |**Primary**|#FF7A00|CTAs, active states, scores, links|
| |**Amber**|#FF9A1F|Secondary highlight, mid-range scores|
| |**Tertiary**|#D95F02|FAB background, deep accent|

*Tints (rgba 5%/10%/20% of #FF7A00) are used for badge fills, icon tiles and focus backgrounds rather than flat hex values — see Section 6.2 for usage.*
## **2.3 Semantic & Text Colors**

|**Swatch**|**Name**|**Hex**|**Usage**|
| :- | :- | :- | :- |
| |**Success**|#4ADE80|Strong Hire, completed states|
| |**Warning**|#FBBF24|Invited / in-review states|
| |**Danger**|#F87171|No Hire, red-flag alerts|
| |**On Surface**|#F5F5F5|Primary text on dark surfaces|
| |**On Muted**|#A1A1AA|Secondary text, metadata|
| |**On Subtle**|#6B6B6B|Disabled / least-emphasis text|
## **2.4 Usage Rule**
*Color alone never carries meaning. Every status color is paired with a text label or icon (see Section 7.7) to satisfy accessibility requirements for color-blind users.*

**FOUNDATION**
# **3. Typography**
Roboto carries all UI text; Roboto Mono is reserved for data. Three weights only — 400 (Regular), 500 (Medium), 700 (Bold) — keep the system simple to implement and audit.
## **3.1 Type Scale**

|**Style**|**Size / Weight / Line-height**|**Used for**|
| :- | :- | :- |
|Display Large|56px / 700 / 1.1|Marketing hero headlines|
|Headline Large|40px / 700 / 1.2|Page titles, job titles|
|Headline Medium|32px / 700 / 1.25|Section titles, candidate name|
|Title Large|24px / 500 / 1.3|Card headings, panel titles|
|Title Medium|18px / 500 / 1.4|Sub-headings, group labels|
|Body Large|15px / 400 / 1.6|Descriptions, answer summaries|
|Body Medium|13px / 400 / 1.5|UI labels, table cells, captions|
|Label / Eyebrow|11px / 700 / uppercase / 0.12em tracking|Section labels, badges|
|Mono / Data|Roboto Mono, 400–500|Scores, percentages, timestamps|
## **3.2 Visual Hierarchy Preview**
**Hire smarter**

**Senior Backend Engineer**

**Candidate Pipeline**

Interview Scorecard

4 years experience · Staff Engineer at Razorpay · Bangalore, IN

87%   composite\_score: 0.87   2026-06-25T14:32:00Z

*Sizes above are scaled down for print legibility; ratios match the web specification in Section 3.1.*

**FOUNDATION**
# **4. Spacing & Layout Grid**
A 4px base unit drives every margin, padding, and gap. Generous whitespace is a deliberate signal of product quality — avoid tightening spacing to fit more content.
## **4.1 Spacing Scale**

|**Token**|**Value**|**Typical use**|
| :- | :- | :- |
|xs|4px|Icon gaps, tight inline spacing|
|sm|8px|Badge padding, row gaps|
|—|12px|Form field internal padding|
|md|16px|Card internal gaps, nav items|
|lg|24px|Card padding (mobile), grid gutters|
|xl|32px|Section sub-group spacing|
|2xl|48px|Section padding (tablet)|
|3xl|64px|Section padding (desktop)|
|4xl|96px|Major section breaks|
## **4.2 Web App Grid (Desktop)**
- Container: 1400px max-width · 12 columns · 24px gutter
- Sidebar: 240px fixed · Content area: fluid · Detail panel: 320px (toggleable split view)
## **4.3 Android App Grid**
- 4 columns · 16px gutter · 16px horizontal margin
- Bottom navigation height: 56px · respect OS safe-area insets
- Minimum touch target: 44×44px

**FOUNDATION**
# **5. Radius, Borders & Elevation**
## **5.1 Corner Radius Scale**

|**Token**|**Value**|**Applied to**|
| :- | :- | :- |
|radius-xs|8px|Tags, small icon containers|
|radius-sm|12px|Inputs, chips|
|radius-md|16px|Dropdowns, nested panels|
|radius-lg|24px|Cards — default container radius|
|radius-xl|28px|Dialogs, FAB|
|radius-xxl|48px|Hero containers|
|radius-pill|9999px|Buttons, badges, avatars|
## **5.2 Border Rules**

|**Border**|**Spec**|**Where**|
| :- | :- | :- |
|Default|1px · #2A2A2A|Used only where tonal contrast alone is insufficient|
|Focus|2px · #FF7A00 + 2px offset|Every interactive element on keyboard focus|
|Glass|1px · white @ 8% + backdrop blur|Overlaid panels, hero badges|
|Accent|1px · primary @ 25%|Featured cards, active rows, selected items|
## **5.3 Shadow & Glow Levels**

|**Level**|**Use**|
| :- | :- |
|shadow-sm|Resting elevation for cards|
|shadow-md|Hover state, drawers|
|shadow-lg|Dialogs, toasts|
|glow-sm|Button hover|
|glow-md|FAB and CTA hover|
|glow-lg|Hero score ring|

*Glow (a soft orange radial shadow) appears only on hover/active states. The resting UI never glows — this keeps the dashboard calm when scanning many rows.*

**COMPONENT LIBRARY**
# **6. Core UI Components**
## **6.1 Buttons**
All buttons are pill-shaped without exception. State changes use opacity/elevation layers, never hue shifts. Every button scales to 0.95 on press for tactile feedback.

|**Variant**|**Style**|**Typical labels**|
| :- | :- | :- |
|Filled (Primary)|Solid #FF7A00, white text, shadow-sm → glow-sm on hover|Send Invite, Post Job, Submit Interview, Get Started|
|Tonal (Secondary)|Surface-mid background, on-surface text|View Details, Export CSV, Cancel, Download APK|
|Outlined|Transparent, 1px border, primary text|Override Shortlist, Regenerate Link|
|Ghost|Transparent, primary text, no border|Nav actions, inline links, “View all →”|
|FAB|56px circle, tertiary fill, glow-md on hover|Add new job (single floating action)|

- Sizes: Small (32px) · Default (40px) · Large (48px)
## **6.2 Badges & Chips**
Semantic color communicates status at a glance; every badge pairs color with a text label so meaning never depends on color alone.

|**Badge**|**Color**|**Meaning**|
| :- | :- | :- |
|Shortlisted|Primary tint|Auto-shortlisted above threshold, or manually added|
|Strong Hire / Hire|Success|Positive interview outcome|
|Invited / In Progress|Warning|Awaiting or mid-interview|
|No Hire / ⚠ Red Flag|Danger|Negative outcome or detected risk signal|
|Not Invited / Low Confidence|Neutral (surface-mid)|No action taken yet, or partial profile data|
|⚡ AI-generated|Glass (primary @10%, blurred border)|Content produced by the AI pipeline (questions, summaries, rankings)|
## **6.3 Input Fields**
Material 3 “filled” style: rounded top corners, flat bottom, with a 2px bottom border as the state indicator — #2A2A2A at rest, #FF7A00 on focus.

|<p>/\* Material Filled Text Field pattern \*/</p><p>.input-field input {</p><p>`  `background: #1A1A1A;</p><p>`  `border-bottom: 2px solid #2A2A2A;      /\* rest \*/</p><p>`  `border-radius: 12px 12px 0 0;          /\* top rounded only \*/</p><p>`  `height: 52px;</p><p>}</p><p>.input-field input:focus {</p><p>`  `border-bottom-color: #FF7A00;          /\* ember on focus \*/</p><p>}</p>|
| :- |
## **6.4 Cards & Surfaces**
Cards rest at #141414 and lift to #1A1A1A plus shadow-md and a subtle glow on hover — the hover state is the primary interaction signal; cards do not need visible borders.

- Card padding: 28px (desktop) / 24px (mobile) · Radius: 24px (radius-lg)
- Icon tiles inside cards: 44×44px, primary @20% fill, rotate −4° and scale 1.05 on card hover

**COMPONENT LIBRARY**
# **7. Platform-Specific Components**
These components are unique to the talent-screening domain and map directly to PRD features F-03 through F-08 (see Appendix A).
## **7.1 Candidate Score Ring**
A circular SVG progress indicator. Ring color maps to score range — it is the single most-repeated visual element in the product, appearing on pipeline rows, candidate cards, and the comparison view.

|**Score range**|**Ring color**|**Meaning**|
| :- | :- | :- |
|≥ 70% (shortlist threshold)|#FF7A00 — Primary|Strong match · shortlisted|
|40–69%|#FF9A1F — Amber|Borderline · below default threshold|
|< 40%|#6B6B6B — Subtle gray|Low match · not shortlisted|
|<p>/\* Score ring formula \*/</p><p>circumference = 2π × r            // r=32 → 201.06</p><p>dashoffset = circumference × (1 - score/100)</p><p>// e.g. 87% → 201.06 × 0.13 = 26.14</p><p>transform: rotate(-90deg)         // start from 12 o'clock</p>|||

- Sizes: 80px on pipeline rows/cards · 120px on the candidate detail page
- Accessibility: every ring carries aria-label="87% match score" — never color alone
## **7.2 Pipeline Row**
The recruiter's primary decision surface (PRD US-04, US-06). Each row must convey enough to make a shortlist call without opening the detail view.

Anatomy, left to right:

- Rank number (mono) → Avatar (initials, primary-tint circle) → Name + role/skills/location metadata
- Shortlist badge → Interview status (dot + label, see 7.7) → Score ring or numeric score (mono, primary)
- Primary action button (Invite / View →), contextual to status

*Rows for shortlisted candidates get a faint accent background (primary @4%) and accent border to separate them from the rest of the list at a glance.*
## **7.3 Semantic Score Breakdown**
Horizontal progress bars shown in the candidate detail panel, one per JD-derived dimension (PRD US-04).

- Typical dimensions: Technical Skills · Seniority Indicators · Domain Experience · Implicit Signals
- Bar fill: primary orange above 70%, muted gray below — numeric value in mono type at the right edge
## **7.4 Interview Scorecard**
Generated after transcription and answer scoring (PRD F-07). Structure, top to bottom:

- AI-generated badge + processing timestamp
- Hire Signal banner — Strong Hire / Hire (green) or No Hire (red), with a confidence percentage in mono type, right-aligned
- Answer Dimensions — Relevance, Clarity, Specificity, Depth — each a labelled progress bar, color-coded by score
- Per-question Answer Summary — 1–2 sentence AI summary in a shaded callout block
- Suggested Follow-up Questions — list of AI-generated prompts for the live round, left-bordered in primary orange
## **7.5 Candidate Comparison Grid**
Side-by-side view for 2–4 candidates (PRD US-06.2 / comparison dashboard). An AI ranking narrative sits above the grid; the best score in each row is highlighted in primary orange and bold.

- Row groups: Semantic Scores → Interview Scorecard → Recommendation, each with a labelled section header row
- Recommendation row shows the Hire Signal badge for each candidate side by side
## **7.6 Red Flag Display**
Auto-detected risk signals (PRD US-05) shown in the candidate detail panel, below the score breakdown. Flags inform — they never block.

- Each flag: warning icon + bold issue title + one-sentence explanation, on a danger-tinted card (danger @8% fill, 1px danger @20% border)
- Always paired with two actions: “Override — Keep shortlisted” (outlined) and “Remove from shortlist” (ghost)
- Example flags: job-hopping pattern, title inflation relative to company stage, skill-level mismatch vs. years of experience
## **7.7 Interview Status Indicators**
Five discrete lifecycle states. The pulsing dot is reserved for the one live state; every dot is paired with a text label.

|**State**|**Dot color**|**Meaning**|
| :- | :- | :- |
|Not Invited|Subtle gray|Awaiting recruiter action|
|Invited|Warning amber|Email sent, link active|
|In Progress|Primary orange (pulsing, 1.8s)|Candidate is recording right now|
|Completed|Success green|Scorecard available|
|Link Expired|Subtle gray (row dimmed)|7 days elapsed — needs regeneration|

**LAYOUTS**
# **8. Screen Layouts**
## **8.1 Job Posting Dashboard (Web)**
The recruiter's home screen. A stat row (total candidates, shortlisted, interviews, hires) sits above a card grid of active jobs.

- Each job card: title + posted date + Active badge → three inline stats (Candidates / Avg Score / Interviewed) → “View Pipeline →” button
- Grid terminates in a dashed “Post a new role” card, always last
## **8.2 Candidate Pipeline View (Web)**
Full ranked list for one job. A filter sidebar (Score / Status / Flag / Confidence) sits left; an optional split-view detail panel opens right when a row is selected, so recruiters never lose their place in the list.
## **8.3 Candidate Detail View (Web)**
Full-page profile. Left column: avatar, profile summary, semantic score breakdown, red flags. Right column: interview scorecard, hire signal, Q&A summaries, follow-up questions. A sticky bottom action bar holds “Override Shortlist” and “Add to Comparison →” so they are reachable while scrolling.
## **8.4 Android Candidate App**
Five screens, deliberately minimal (PRD F-05, US-08–US-10). The recording screen is the most critical — question text must dominate the viewport, and no technical error codes are ever shown to the candidate.

|**Screen**|**Purpose**|**Key element**|
| :- | :- | :- |
|Introduction|Sets expectations before the interview starts|Plain-language rules list + single “I understand, let's begin” CTA|
|Think-Time / Question|Shows the question with a countdown before recording|Large question text + circular countdown ring (amber)|
|Recording|Active answer capture|Pulsing “● REC” badge, live timer, time-remaining overlay, progress bar|
|Connectivity Error|Reassures candidate during network loss|Plain-English message + per-question upload status + “Retry upload”|
|Review & Submit|Final confirmation before submission|Checklist of submitted answers + “Submit Interview ✓”|

*Android copy rule: zero technical error codes, ever. Every error state pairs a plain-English explanation with exactly one clear recovery action.*

**SYSTEM**
# **9. Motion & Animation**
One easing curve is used everywhere: cubic-bezier(0.2, 0, 0, 1) — a smooth, Material-You-style deceleration. Motion communicates state change through scale and glow, never through layout shifts or hue changes.

|**Motion**|**Spec**|**Used for**|
| :- | :- | :- |
|Micro|200ms|Color/opacity/border-color transitions — inputs, badge hover|
|Standard|300ms|Card hover (scale + shadow + glow), button hover, drawer open|
|Large surface|400–500ms|Page transitions, dialog appear, comparison view load|
|Press feedback|scale(0.95) on :active|All buttons and the FAB|
|Card hover|scale(1.015) + shadow-md + glow-sm|Feature cards, pipeline rows|
|Status pulse|1\.8s infinite, opacity 1→0.4|In-Progress interview dot only — max one pulsing element per screen|
|Reduced motion|prefers-reduced-motion: reduce|Transform/scale durations drop to ~0; color transitions are kept|

**SYSTEM**
# **10. Accessibility Standards**
Dark surfaces make contrast easy to achieve but require deliberate verification. Every interactive element needs a visible focus ring, and no status is ever communicated by color alone.
## **10.1 Verified Contrast Ratios (against background)**

|**Text / Element**|**Ratio**|**Result**|
| :- | :- | :- |
|Body text — #F5F5F5 on #0A0A0A|16\.4 : 1|Pass — AAA|
|Muted text — #A1A1AA on #0A0A0A|6\.1 : 1|Pass — AA|
|Primary — #FF7A00 on #0A0A0A|5\.2 : 1|Pass — AA|
|White text on #FF7A00 fill|3\.1 : 1|Pass for large/bold text only|
## **10.2 Non-negotiable Rules**
- Focus ring: 2px solid #FF7A00, 2px offset, on every interactive element
- Touch targets: minimum 44×44px throughout the Android app
- Decorative glows and background blur shapes: aria-hidden="true"
- Score rings: always paired with aria-label, e.g. "87% match score" — number and color together, never color alone
- Status dots: always paired with a visible text label (“In Progress”, not just a pulsing dot)
- Android error states: plain English only, zero technical codes, exactly one clear recovery action

**SYSTEM**
# **11. Implementation Reference — CSS Tokens**
Design tokens as CSS custom properties, ready to paste into globals.css. Names mirror the Tailwind config structure referenced in the project's tech-stack document for a direct migration.

|<p>:root {</p><p>`  `/\* Surfaces \*/</p><p>`  `--color-bg: #0A0A0A;            --color-surface: #141414;</p><p>`  `--color-surface-low: #1A1A1A;   --color-surface-mid: #1E1E1E;</p><p>`  `--color-overlay: #222222;       --color-border: #2A2A2A;</p><p></p><p>`  `/\* Primary — Ember \*/</p><p>`  `--color-primary: #FF7A00;       --color-amber: #FF9A1F;</p><p>`  `--color-tertiary: #D95F02;</p><p></p><p>`  `/\* Text \*/</p><p>`  `--color-on-surface: #F5F5F5;    --color-muted: #A1A1AA;</p><p>`  `--color-subtle: #6B6B6B;</p><p></p><p>`  `/\* Semantic \*/</p><p>`  `--color-success: #4ADE80;       --color-warning: #FBBF24;</p><p>`  `--color-danger: #F87171;</p><p></p><p>`  `/\* Radius \*/</p><p>`  `--radius-xs: 8px;   --radius-sm: 12px;  --radius-md: 16px;</p><p>`  `--radius-lg: 24px;  --radius-xl: 28px;  --radius-xxl: 48px;</p><p>`  `--radius-pill: 9999px;</p><p></p><p>`  `/\* Typography \*/</p><p>`  `--font-body: 'Roboto', sans-serif;</p><p>`  `--font-mono: 'Roboto Mono', monospace;</p><p></p><p>`  `/\* Motion \*/</p><p>`  `--ease: cubic-bezier(0.2, 0, 0, 1);</p><p>`  `--dur-fast: 200ms;  --dur-std: 300ms;  --dur-slow: 400ms;</p><p>}</p>|
| :- |



**APPENDIX**
# **Appendix A — Component-to-Feature Mapping**
Cross-reference between this design system and the feature specifications in the companion PRD (Section 7, F-01 through F-08).

|**PRD Feature**|**Design components used**|
| :- | :- |
|F-01 — Job Description Analysis Engine|Input fields (textarea), tag/chip list for extracted skills|
|F-02 — Candidate Scraping Pipeline|Pipeline row, Low Confidence badge, status badges|
|F-03 — Semantic Candidate Scoring|Score ring, semantic score breakdown bars, red flag cards|
|F-04 — Interview Invitation Workflow|Interview status indicators, filled/tonal buttons, email-style notices|
|F-05 — Android Interview App|Full Android screen set (Section 8.4): intro, think-time, recording, error, review|
|F-06 — LLM Question Generation|Suggested follow-up question list (Section 7.4), AI-generated badge|
|F-07 — Transcription & Answer Scoring Pipeline|Interview scorecard, hire signal banner, answer dimension bars|
|F-08 — Recruiter Web App Views|Dashboard, pipeline view, candidate detail view, comparison grid|
# **Appendix B — Component Naming Conventions**
Suggested component file names for the React (web) and React Native/Expo (Android) codebases, to keep naming consistent with this document's section numbers.

|**Component**|**Suggested file name**|
| :- | :- |
|Score Ring (7.1)|ScoreRing.tsx|
|Pipeline Row (7.2)|PipelineRow.tsx|
|Score Breakdown Bars (7.3)|ScoreBreakdown.tsx|
|Interview Scorecard (7.4)|InterviewScorecard.tsx|
|Comparison Grid (7.5)|ComparisonGrid.tsx|
|Red Flag Card (7.6)|RedFlagCard.tsx|
|Interview Status Dot (7.7)|InterviewStatusBadge.tsx|
|Android: Think-Timer Screen (8.4)|ThinkTimerScreen.tsx|
|Android: Recording Screen (8.4)|RecordingScreen.tsx|

Page  of 
