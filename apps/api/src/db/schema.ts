import { pgTable, text, timestamp, boolean, integer, jsonb, varchar, customType, real } from 'drizzle-orm/pg-core';

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(384)';
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
});

export const jobs = pgTable('jobs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: text('user_id').references(() => user.id),
  title: text('title').notNull(),
  jdText: text('jd_text').notNull(),
  parsedJd: jsonb('parsed_jd'),
  shortlistThreshold: integer('shortlist_threshold').default(70),
  status: varchar('status', { length: 50 }).default('parsing'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const candidates = pgTable('candidates', {
  id: varchar('id', { length: 255 }).primaryKey(),
  jobId: varchar('job_id', { length: 255 }).references(() => jobs.id).notNull(),
  name: text('name').notNull(),
  title: text('title'),
  company: text('company'),
  skills: text('skills').array(),
  experienceSummary: text('experience_summary'),
  profileUrl: text('profile_url'),
  dataConfidence: varchar('data_confidence', { length: 20 }),
  embedding: vector('embedding'),
  scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
});

export const candidateScores = pgTable('candidate_scores', {
  id: varchar('id', { length: 255 }).primaryKey(),
  candidateId: varchar('candidate_id', { length: 255 }).references(() => candidates.id).notNull(),
  technicalScore: real('technical_score'),
  seniorityScore: real('seniority_score'),
  domainScore: real('domain_score'),
  implicitScore: real('implicit_score'),
  compositeScore: real('composite_score'),
  redFlags: jsonb('red_flags'),
  shortlisted: boolean('shortlisted').default(false),
  shortlistOverride: boolean('shortlist_override').default(false),
  overrideBy: varchar('override_by', { length: 255 }),
  overrideAt: timestamp('override_at'),
});

export const interviews = pgTable('interviews', {
  id: varchar('id', { length: 255 }).primaryKey(),
  candidateId: varchar('candidate_id', { length: 255 }).references(() => candidates.id).notNull(),
  token: varchar('token', { length: 64 }).unique().notNull(),
  status: varchar('status', { length: 50 }).default('not_invited'),
  questions: jsonb('questions'),
  expiresAt: timestamp('expires_at').notNull(),
  startedAt: timestamp('started_at'),
  submittedAt: timestamp('submitted_at'),
});

export const answers = pgTable('answers', {
  id: varchar('id', { length: 255 }).primaryKey(),
  interviewId: varchar('interview_id', { length: 255 }).references(() => interviews.id).notNull(),
  questionIndex: integer('question_index').notNull(),
  videoChunksReceived: integer('video_chunks_received').default(0),
  videoAssembled: boolean('video_assembled').default(false),
  transcription: text('transcription'),
  relevanceScore: real('relevance_score'),
  clarityScore: real('clarity_score'),
  specificityScore: real('specificity_score'),
  depthScore: real('depth_score'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const scorecards = pgTable('scorecards', {
  id: varchar('id', { length: 255 }).primaryKey(),
  interviewId: varchar('interview_id', { length: 255 }).references(() => interviews.id).notNull(),
  aggregateScore: real('aggregate_score'),
  hireSignal: varchar('hire_signal', { length: 20 }),
  confidence: real('confidence'),
  followUpQuestions: jsonb('follow_up_questions'),
  rankingJustification: text('ranking_justification'),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
});

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(()=> user.id)
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(()=> user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at')
});
