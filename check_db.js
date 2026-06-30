const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_wEZ3MgaWhQY1@ep-silent-meadow-aigju76k-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  await client.connect();
  
  // Check all jobs in db
  const jobs = await client.query('SELECT id, title, status, created_at FROM jobs ORDER BY created_at DESC;');
  console.log('\n=== JOBS IN DB ===');
  console.log(jobs.rows);

  // Check if pgboss schema even exists
  const schemaCheck = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'pgboss';");
  console.log('\n=== PGBOSS SCHEMA EXISTS ===', schemaCheck.rows.length > 0 ? 'YES' : 'NO');
  
  if (schemaCheck.rows.length > 0) {
    // Check all pgboss jobs
    const pgbossJobs = await client.query("SELECT id, name, state, created_on FROM pgboss.job ORDER BY created_on DESC LIMIT 20;");
    console.log('\n=== PGBOSS JOBS ===');
    console.log(pgbossJobs.rows);

    // Check versions table to understand pg-boss state
    const versions = await client.query("SELECT version, maintained_on FROM pgboss.version;");
    console.log('\n=== PGBOSS VERSION ===');
    console.log(versions.rows);
  }

  // Check candidates table
  const candidates = await client.query('SELECT COUNT(*) as count FROM candidates;');
  console.log('\n=== CANDIDATES COUNT ===', candidates.rows[0].count);

  await client.end();
}
run().catch(console.error);
