import { db } from "./apps/api/src/db/client";
import { sessions } from "./apps/api/src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
    const all = await db.select().from(sessions);
    console.log("Total sessions:", all.length);
    console.log("Sessions:", all.map(s => s.token.substring(0, 15) + "..."));
    process.exit(0);
}
run().catch(console.error);
