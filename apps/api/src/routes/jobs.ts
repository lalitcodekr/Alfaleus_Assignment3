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
