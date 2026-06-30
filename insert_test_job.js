const { Client } = require('pg');
const { randomUUID } = require('crypto');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_wEZ3MgaWhQY1@ep-silent-meadow-aigju76k-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });
  await client.connect();

  const jobId = 'c055de97-805a-4bb7-a598-595138cab285';
  await client.query(`
    INSERT INTO jobs (id, title, jd_text, shortlist_threshold, status)
    VALUES ($1, 'Senior Backend Engineer', 'Looking for a senior backend engineer.', 70, 'parsing')
    ON CONFLICT DO NOTHING
  `, [jobId]);

  console.log('Inserted job ID:', jobId);
  await client.end();
}
run().catch(console.error);
