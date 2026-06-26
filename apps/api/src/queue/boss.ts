import PgBoss from 'pg-boss';

// Initialize with the database URL from environment
const boss = new PgBoss(process.env.DATABASE_URL!);

boss.on('error', (error) => console.error('pg-boss error:', error));

export async function initQueue() {
    await boss.start();
    console.log('pg-boss queue started');

    await startWorker('jd-analysis', async (job) => {
        const { job_id } = job.data as { job_id: string };
        const { db } = await import('../db/client');
        const { jobs } = await import('../db/schema');
        const { eq } = await import('drizzle-orm');

        const [jobRecord] = await db.select().from(jobs).where(eq(jobs.id, job_id));
        if (!jobRecord) return;

        try {
            const workerUrl = process.env.JD_ANALYSIS_WORKER_URL || 'http://localhost:8001';
            const res = await fetch(`${workerUrl}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job_id, jd_text: jobRecord.jdText })
            });

            if (!res.ok) throw new Error('JD Analysis Worker returned error');

            const data = await res.json() as { data: { required_skills: string[]; seniority_level: string; domain: string } };
            // Enqueue scraping after analysis succeeds
            await enqueue('scrape-candidates', {
                job_id,
                query: `${data.data?.seniority_level ?? ''} ${data.data?.domain ?? jobRecord.title}`.trim(),
            });
        } catch (err) {
            console.error('Failed to analyze job', err);
            await db.update(jobs).set({ status: 'error' }).where(eq(jobs.id, job_id));
        }
    });

    await startWorker('scrape-candidates', async (job) => {
        const { job_id, query } = job.data as { job_id: string; query: string };
        const { db } = await import('../db/client');
        const { jobs } = await import('../db/schema');
        const { eq } = await import('drizzle-orm');

        try {
            const workerUrl = process.env.SCRAPER_WORKER_URL || 'http://localhost:8002';
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
}

export async function enqueue<T = any>(jobName: string, payload: T, options?: PgBoss.SendOptions) {
    return await boss.send(jobName, payload as object, options);
}

export async function startWorker<T = any>(jobName: string, handler: (job: PgBoss.Job<T>) => Promise<void>, options?: PgBoss.WorkOptions) {
    await boss.work(jobName, options || {}, handler);
}

export { boss };
