import { db } from './apps/api/src/db/client';
import { jobs, candidates } from './apps/api/src/db/schema';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';

async function main() {
    const allJobs = await db.select().from(jobs).orderBy(jobs.createdAt);
    console.log("=== JOBS ===");
    for (const job of allJobs) {
        console.log(`[${job.id}] Status: ${job.status}, Created: ${job.createdAt}`);
    }

    const sql = postgres(process.env.DATABASE_URL as string);
    const pgJobs = await sql`SELECT id, name, data, state, createdon, startedon, completedon FROM pgboss.job ORDER BY createdon DESC LIMIT 5`;
    console.log("=== PGBOSS JOBS ===");
    for (const job of pgJobs) {
        console.log(`[${job.name}] State: ${job.state}, Created: ${job.createdon}`);
    }

    process.exit(0);
}

main().catch(console.error);
