import PgBoss from 'pg-boss';

// Initialize with the database URL from environment
const boss = new PgBoss(process.env.DATABASE_URL!);

boss.on('error', (error) => console.error('pg-boss error:', error));

export async function initQueue() {
    await boss.start();
    console.log('pg-boss queue started');
}

export async function enqueue<T = any>(jobName: string, payload: T, options?: PgBoss.SendOptions) {
    return await boss.send(jobName, payload as object, options);
}

export async function startWorker<T = any>(jobName: string, handler: (job: PgBoss.Job<T>) => Promise<void>, options?: PgBoss.WorkOptions) {
    await boss.work(jobName, options || {}, handler);
}

export { boss };
