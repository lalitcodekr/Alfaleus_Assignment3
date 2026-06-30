import { db } from './src/db/client';
import { jobs } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { enqueue } from './src/queue/boss';

async function run() {
  const result = await db.select().from(jobs).where(eq(jobs.status, 'parsing'));
  for (const j of result) {
    console.log('Retriggering scraper for', j.id);
    const workerUrl = process.env.SCRAPER_WORKER_URL || 'http://localhost:8001';
    console.log(`Sending to ${workerUrl}`);
    const scrapeRes = await fetch(`${workerUrl}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            job_id: j.id,
            query: `Senior ${j.title}`,
            max_results: 30,
        }),
    });
    console.log('Scraper response:', await scrapeRes.text());
    
    await db.update(jobs).set({ status: 'scoring_pending' }).where(eq(jobs.id, j.id));
    
    // Now trigger scorer
    const { candidates } = await import('./src/db/schema');
    const allCands = await db.select().from(candidates).where(eq(candidates.jobId, j.id));
    const scorerUrl = process.env.SCORER_WORKER_URL || 'http://localhost:8003';
    
    for (const cand of allCands) {
        await fetch(`${scorerUrl}/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job_id: j.id, candidate_id: cand.id })
        });
    }
    await db.update(jobs).set({ status: 'completed' }).where(eq(jobs.id, j.id));
    console.log('Done', j.id);
  }
  process.exit(0);
}
run();
