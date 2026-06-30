import * as dotenv from "dotenv";
dotenv.config({ path: "./apps/api/.env" });

import { db } from "./apps/api/src/db/client";
import { jobs, candidates } from "./apps/api/src/db/schema";
import { eq } from "drizzle-orm";
import pgBoss from "pg-boss";

async function run() {
    const allJobs = await db.select().from(jobs);
    console.log("Jobs in DB:");
    for (const j of allJobs) {
        console.log(j.id, j.title, j.status);
    }
    const allCandidates = await db.select().from(candidates);
    console.log("Total candidates:", allCandidates.length);

    const boss = new pgBoss(process.env.DATABASE_URL!);
    await boss.start();
    const queues = ['jd-analysis', 'scrape-candidates', 'score-candidates', 'transcribe-answer'];
    for (const q of queues) {
        const count = await boss.getQueueSize(q);
        console.log(`Queue ${q} size: ${count}`);
    }
    await boss.stop();
    process.exit(0);
}
run().catch(console.error);
