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
            const res = await fetch('http://localhost:8001/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job_id, jd_text: jobRecord.jdText })
            });

            if (!res.ok) throw new Error('JD Analysis Worker returned error');
        } catch (err) {
            console.error('Failed to analyze job', err);
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
