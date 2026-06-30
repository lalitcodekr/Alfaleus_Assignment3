import * as dotenv from "dotenv";
dotenv.config({ path: "./apps/api/.env" });

import { db } from "./apps/api/src/db/client";
import { jobs } from "./apps/api/src/db/schema";
import { eq, ne } from "drizzle-orm";

async function run() {
    const allJobs = await db.select().from(jobs).where(ne(jobs.status, 'completed'));
    console.log("Stuck jobs found:", allJobs.length);
    for (const j of allJobs) {
        console.log("Retriggering job:", j.id, j.title);
        const res = await fetch(`http://localhost:3001/api/jobs/${j.id}/retrigger`, {
            method: 'POST'
        });
        const data = await res.json();
        console.log("Result:", data);
    }
    process.exit(0);
}
run().catch(console.error);
