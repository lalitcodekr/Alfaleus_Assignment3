import { db } from './src/db/client';
import { jobs } from './src/db/schema';
async function run() {
  const result = await db.select().from(jobs);
  console.log('All jobs:', result.map(j => ({ id: j.id, userId: j.userId, status: j.status })));
  process.exit(0);
}
run();
