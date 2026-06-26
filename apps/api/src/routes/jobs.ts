import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/client';
import { jobs, candidates } from '../db/schema';
import { enqueue } from '../queue/boss';
import { requireAuth } from '../middleware/requireAuth';
import { desc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const jobsRouter = new Hono();

jobsRouter.use('*', requireAuth);

const createJobSchema = z.object({
    title: z.string().min(1),
    jd_text: z.string().min(10),
    shortlist_threshold: z.number().min(0).max(100).optional(),
});

jobsRouter.post('/', zValidator('json', createJobSchema), async (c) => {
    const { title, jd_text, shortlist_threshold } = c.req.valid('json');
    const jobId = randomUUID();

    await db.insert(jobs).values({
        id: jobId,
        title,
        jdText: jd_text,
        shortlistThreshold: shortlist_threshold ?? 70,
        status: 'parsing',
    });

    await enqueue('jd-analysis', { job_id: jobId });

    return c.json({ job_id: jobId }, 202);
});

jobsRouter.get('/', async (c) => {
    const allJobs = await db.select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        createdAt: jobs.createdAt,
        candidateCount: sql<number>`count(distinct ${candidates.id})::int`,
    }).from(jobs)
      .leftJoin(candidates, sql`${jobs.id} = ${candidates.jobId}`)
      .groupBy(jobs.id)
      .orderBy(desc(jobs.createdAt));

    return c.json({ jobs: allJobs });
});

jobsRouter.get('/:id/candidates', async (c) => {
    const jobId = c.req.param('id');
    const { score_min, score_max, shortlisted, interview_status, has_red_flag } = c.req.query();
    
    // Using dynamic query building with Drizzle
    const { and, eq, gte, lte, desc, isNotNull, sql } = await import('drizzle-orm');
    const { candidateScores } = await import('../db/schema');
    
    const filters = [eq(candidates.jobId, jobId)];
    
    if (score_min) filters.push(gte(candidateScores.compositeScore, parseFloat(score_min)));
    if (score_max) filters.push(lte(candidateScores.compositeScore, parseFloat(score_max)));
    if (shortlisted !== undefined) filters.push(eq(candidateScores.shortlisted, shortlisted === 'true'));
    // Note: If red_flags is stored as JSONB array, we can check if it's not empty
    if (has_red_flag === 'true') filters.push(sql`jsonb_array_length(${candidateScores.redFlags}) > 0`);
    
    const results = await db.select({
        id: candidates.id,
        name: candidates.name,
        title: candidates.title,
        company: candidates.company,
        dataConfidence: candidates.dataConfidence,
        compositeScore: candidateScores.compositeScore,
        shortlisted: candidateScores.shortlisted,
        redFlags: candidateScores.redFlags,
    })
    .from(candidates)
    .leftJoin(candidateScores, eq(candidates.id, candidateScores.candidateId))
    .where(and(...filters))
    .orderBy(desc(candidateScores.compositeScore));
    
    return c.json({ candidates: results });
});
