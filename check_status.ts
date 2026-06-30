import * as dotenv from "dotenv";
dotenv.config({ path: "./apps/api/.env" });
import { db } from "./src/db/client";
import { jobs } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
    const { candidates } = await import("./src/db/schema");
    const cands = await db.select().from(candidates).where(eq(candidates.jobId, "65fa5040-4ee3-4222-95b5-b73cbc02ad7a"));
    console.log("Candidates found:", cands.length);
    console.log(cands);
}
run().catch(console.error);
