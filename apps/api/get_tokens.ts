import { db } from './src/db/client';
import { interviews } from './src/db/schema';
async function run() {
  const result = await db.select().from(interviews);
  console.log(result.map(r => ({token: r.token, status: r.status})));
  process.exit(0);
}
run();
