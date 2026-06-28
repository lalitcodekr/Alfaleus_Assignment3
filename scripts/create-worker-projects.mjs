#!/usr/bin/env node
/**
 * TalentIQ — Create separate Railway projects for each worker (free tier workaround)
 * Railway free tier: 1 service per project, 5 projects per account
 * Projects needed: api, scraper-worker, jd-analysis-worker, scorer-worker, transcriber-worker
 */

const TOKEN = 'WNSxrH-CXt-ZvqvnHnAFpyeXnlxANlYPuQA2vnfzier';

const workers = [
  { name: 'talentiq-scraper',     displayName: 'scraper-worker' },
  { name: 'talentiq-jd-analysis', displayName: 'jd-analysis-worker' },
  { name: 'talentiq-scorer',      displayName: 'scorer-worker' },
  { name: 'talentiq-transcriber', displayName: 'transcriber-worker' },
];

async function gql(query, variables = {}) {
  const res = await fetch('https://backboard.railway.app/graphql/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2));
  return json.data;
}

async function createProject(name) {
  const data = await gql(
    `mutation projectCreate($input: ProjectCreateInput!) {
      projectCreate(input: $input) { id name }
    }`,
    { input: { name, defaultEnvironmentName: 'production' } }
  );
  return data.projectCreate;
}

async function main() {
  console.log('Creating separate Railway projects for each worker...\n');
  for (const w of workers) {
    try {
      const proj = await createProject(w.name);
      console.log(`✓ Created project: ${w.name}`);
      console.log(`  Project ID: ${proj.id}`);
      console.log(`  Dashboard: https://railway.app/project/${proj.id}`);
      console.log('');
    } catch (err) {
      console.error(`✗ Failed ${w.name}:`, err.message.slice(0, 200));
    }
  }
  console.log('Next: Connect each project to GitHub repo in Railway dashboard');
  console.log('      Set root directory to the worker subfolder');
}

main().catch(console.error);
