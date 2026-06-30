import { db } from './src/db/client';
import { jobs } from './src/db/schema';
import { eq } from 'drizzle-orm';
async function run() {
  const result = await db.select().from(jobs).where(eq(jobs.status, 'parsing'));
  for (const j of result) {
    console.log('Retriggering', j.id);
    const res = await fetch(`http://localhost:3001/api/jobs/${j.id}/retrigger`, {
        method: 'POST'
    });
    console.log(await res.text());
  }
  process.exit(0);
}
run();
