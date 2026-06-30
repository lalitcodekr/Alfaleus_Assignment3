import { db } from './src/db/client';
import { jobs } from './src/db/schema';
import { eq, isNull } from 'drizzle-orm';
async function run() {
  const result = await db.select().from(jobs);
  console.log('All jobs:', result.map(j => ({ id: j.id, userId: j.userId })));
  
  const result2 = await db.select().from(jobs).where(eq(jobs.userId, 'some-user-id'));
  console.log('Filtered jobs:', result2.map(j => ({ id: j.id, userId: j.userId })));
  process.exit(0);
}
run();
