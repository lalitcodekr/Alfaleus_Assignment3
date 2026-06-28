import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/client';
import { jobs, candidates, candidateScores, interviews, answers, scorecards } from '../db/schema';
import { enqueue } from '../queue/boss';
import { requireAuth } from '../middleware/requireAuth';
import { desc, sql, eq, inArray } from 'drizzle-orm';
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

    // Try pg-boss queue first; fall back to direct HTTP call if queue isn't ready
    const queued = await enqueue('jd-analysis', { job_id: jobId });
    if (!queued) {
        // pg-boss returned null — trigger the worker directly as a fire-and-forget
        console.warn('[jobs] pg-boss not ready, triggering JD analysis worker directly');
        const workerUrl = process.env.JD_ANALYSIS_WORKER_URL || 'http://localhost:8001';
        fetch(`${workerUrl}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_id: jobId, jd_text }),
        }).then(async (res) => {
            if (!res.ok) {
                console.error('[jobs] Direct JD worker call failed:', await res.text());
                return;
            }
            const data = await res.json() as { data: { seniority_level?: string; domain?: string } };
            await enqueue('scrape-candidates', {
                job_id: jobId,
                query: `${data.data?.seniority_level ?? ''} ${data.data?.domain ?? title}`.trim(),
            });
        }).catch(err => console.error('[jobs] Direct JD worker error:', err));
    }

    return c.json({ job_id: jobId }, 202);
});

// Admin endpoint to manually re-trigger the full pipeline for a stuck job
jobsRouter.post('/:id/retrigger', async (c) => {
    const jobId = c.req.param('id');
    const { eq } = await import('drizzle-orm');

    const [jobRecord] = await db.select().from(jobs).where(eq(jobs.id, jobId));
    if (!jobRecord) return c.json({ error: 'Job not found' }, 404);

    console.log(`[admin] Re-triggering pipeline for job: ${jobId}`);

    const workerUrl = process.env.JD_ANALYSIS_WORKER_URL || 'http://localhost:8001';
    try {
        const res = await fetch(`${workerUrl}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_id: jobId, jd_text: jobRecord.jdText }),
        });
        if (!res.ok) {
            const errText = await res.text();
            return c.json({ error: `JD worker failed: ${errText}` }, 500);
        }
        const data = await res.json() as { data: { seniority_level?: string; domain?: string } };
        await db.update(jobs).set({ status: 'parsing' }).where(eq(jobs.id, jobId));

        // Now trigger scraper
        const scraperUrl = process.env.SCRAPER_WORKER_URL || 'http://localhost:8002';
        const scrapeRes = await fetch(`${scraperUrl}/scrape`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                job_id: jobId,
                query: `${data.data?.seniority_level ?? ''} ${data.data?.domain ?? jobRecord.title}`.trim(),
                max_results: 30,
            }),
        });
        if (!scrapeRes.ok) {
            return c.json({ error: `Scraper failed: ${await scrapeRes.text()}`, jd_analysis: data.data }, 500);
        }
        const scrapeData = await scrapeRes.json();

        return c.json({ success: true, jd_analysis: data.data, scrape: scrapeData });
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

jobsRouter.get('/', async (c) => {
    const allJobs = await db.select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        createdAt: jobs.createdAt,
        candidateCount: sql<number>`count(distinct ${candidates.id})::int`,
        avgScore: sql<number>`avg(candidate_scores.composite_score)::real`,
        interviewedCount: sql<number>`count(distinct case when interviews.status != 'not_invited' then interviews.id end)::int`,
    }).from(jobs)
      .leftJoin(candidates, sql`${jobs.id} = ${candidates.jobId}`)
      .leftJoin(sql`candidate_scores`, sql`${candidates.id} = candidate_scores.candidate_id`)
      .leftJoin(sql`interviews`, sql`${candidates.id} = interviews.candidate_id`)
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

jobsRouter.delete('/:id', async (c) => {
    const jobId = c.req.param('id');
    try {
        await db.transaction(async (tx) => {
            const jobCandidates = await tx.select({ id: candidates.id }).from(candidates).where(eq(candidates.jobId, jobId));
            const candidateIds = jobCandidates.map(c => c.id);

            if (candidateIds.length > 0) {
                const candidateInterviews = await tx.select({ id: interviews.id }).from(interviews).where(inArray(interviews.candidateId, candidateIds));
                const interviewIds = candidateInterviews.map(i => i.id);

                if (interviewIds.length > 0) {
                    await tx.delete(answers).where(inArray(answers.interviewId, interviewIds));
                    await tx.delete(scorecards).where(inArray(scorecards.interviewId, interviewIds));
                }
                await tx.delete(interviews).where(inArray(interviews.candidateId, candidateIds));
                await tx.delete(candidateScores).where(inArray(candidateScores.candidateId, candidateIds));
                await tx.delete(candidates).where(eq(candidates.jobId, jobId));
            }
            await tx.delete(jobs).where(eq(jobs.id, jobId));
        });
        return c.json({ success: true });
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});
