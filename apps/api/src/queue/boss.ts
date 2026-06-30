import PgBoss from 'pg-boss';

// Initialize with the database URL from environment
const boss = new PgBoss(process.env.DATABASE_URL!);

boss.on('error', (error) => console.error('pg-boss error:', error));

// Track whether boss has finished starting to prevent enqueue() from being called too early
let bossStartPromise: Promise<void> | null = null;

export async function waitForBoss(): Promise<void> {
    if (bossStartPromise) await bossStartPromise;
}

export async function initQueue() {
    bossStartPromise = boss.start().then(() => {
        console.log('pg-boss queue started');
    });
    await bossStartPromise;

    await startWorker('jd-analysis', async (job) => {
        const { job_id } = job.data as { job_id: string };
        const { db } = await import('../db/client');
        const { jobs } = await import('../db/schema');
        const { eq } = await import('drizzle-orm');

        const [jobRecord] = await db.select().from(jobs).where(eq(jobs.id, job_id));
        if (!jobRecord) return;

        try {
            const workerUrl = process.env.JD_ANALYSIS_WORKER_URL || 'http://localhost:8002';
            const res = await fetch(`${workerUrl}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job_id, jd_text: jobRecord.jdText })
            });

            let data = { data: { seniority_level: '', domain: '' } };
            if (!res.ok) {
                console.warn('[jobs] JD Analysis Worker returned error, falling back to mock JD data to allow scraping to proceed.');
                data = { data: { seniority_level: 'Senior', domain: 'Software Engineering' } };
            } else {
                data = await res.json() as { data: { required_skills: string[]; seniority_level: string; domain: string } };
            }

            // Enqueue scraping after analysis succeeds or falls back
            await enqueue('scrape-candidates', {
                job_id,
                query: `${data.data?.seniority_level ?? ''} ${data.data?.domain ?? jobRecord.title}`.trim(),
            });
        } catch (err) {
            console.error('Failed to analyze job, applying fallback', err);
            await enqueue('scrape-candidates', {
                job_id,
                query: jobRecord.title,
            });
        }
    });

    await startWorker('scrape-candidates', async (job) => {
        const { job_id, query } = job.data as { job_id: string; query: string };
        const { db } = await import('../db/client');
        const { jobs } = await import('../db/schema');
        const { eq } = await import('drizzle-orm');

        try {
            const workerUrl = process.env.SCRAPER_WORKER_URL || 'http://localhost:8001';
            const res = await fetch(`${workerUrl}/scrape`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job_id, query, max_results: 50 })
            });

            if (!res.ok) throw new Error('Scraper Worker returned error');
            await db.update(jobs).set({ status: 'scoring_pending' }).where(eq(jobs.id, job_id));

            // Enqueue scoring after scraping
            await enqueue('score-candidates', { job_id });
        } catch (err) {
            console.error('Failed to scrape candidates', err);
            await db.update(jobs).set({ status: 'error' }).where(eq(jobs.id, job_id));
        }
    });

    await startWorker('score-candidates', async (job) => {
        const { job_id } = job.data as { job_id: string };
        const { db } = await import('../db/client');
        const { jobs, candidates } = await import('../db/schema');
        const { eq } = await import('drizzle-orm');

        try {
            // Get all candidates for the job
            const allCandidates = await db.select().from(candidates).where(eq(candidates.jobId, job_id));
            
            const workerUrl = process.env.SCORER_WORKER_URL || 'http://localhost:8003';
            
            // Process in batches of 10 to not overwhelm the scorer worker
            const batchSize = 10;
            for (let i = 0; i < allCandidates.length; i += batchSize) {
                const batch = allCandidates.slice(i, i + batchSize);
                await Promise.all(batch.map(async (candidate) => {
                    const res = await fetch(`${workerUrl}/score`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ job_id, candidate_id: candidate.id })
                    });
                    if (!res.ok) {
                        console.error(`Failed to score candidate ${candidate.id}:`, await res.text());
                    }
                }));
            }

            await db.update(jobs).set({ status: 'completed' }).where(eq(jobs.id, job_id));
            console.log(`Finished scoring ${allCandidates.length} candidates for job ${job_id}`);
        } catch (err) {
            console.error('Failed to score candidates', err);
            await db.update(jobs).set({ status: 'error' }).where(eq(jobs.id, job_id));
        }
    });

    await startWorker('transcribe-answer', async (job) => {
        const payload = job.data as { answer_id: string, r2_key: string, question_index: number, interview_id: string };
        const workerUrl = process.env.TRANSCRIBER_WORKER_URL || 'http://localhost:8004';
        
        try {
            const res = await fetch(`${workerUrl}/transcribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Transcriber worker failed: ${errText}`);
            }
            console.log(`Successfully transcribed answer ${payload.answer_id}`);
        } catch (err) {
            console.error('Failed to transcribe answer', err);
            throw err; // pg-boss will retry
        }
    });
}

export async function enqueue<T = any>(jobName: string, payload: T, options?: PgBoss.SendOptions) {
    // Wait for boss to be ready before trying to send
    await waitForBoss();
    let result;
    if (options) {
        result = await boss.send(jobName, payload as object, options);
    } else {
        result = await boss.send(jobName, payload as object);
    }
    if (result === null) {
        console.error(`[pg-boss] enqueue('${jobName}') returned null — job may not have been queued!`);
    } else {
        console.log(`[pg-boss] enqueued '${jobName}' with id: ${result}`);
    }
    return result;
}

export async function startWorker<T = any>(jobName: string, handler: (job: PgBoss.Job<T>) => Promise<void>, options?: PgBoss.WorkOptions) {
    if (options && Object.keys(options).length > 0) {
        await (boss.work as any)(jobName, options, handler);
    } else {
        await (boss.work as any)(jobName, handler);
    }
}

export { boss };
