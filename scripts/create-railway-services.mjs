#!/usr/bin/env node
/**
 * TalentIQ — Railway Service Creator + Deployer
 * Uses Railway GraphQL API to create 5 services from the GitHub repo
 * and trigger deployments with the correct Dockerfile paths.
 */

const TOKEN = 'WNSxrH-CXt-ZvqvnHnAFpyeXnlxANlYPuQA2vnfzier';
const PROJECT_ID = '43739b04-3ebd-49f8-a71d-cfd1e7abd334';
const ENVIRONMENT_ID = 'a026d163-615f-4565-a0ac-631e1b2cd556';
const GITHUB_REPO = 'lalitcodekr/Alfaleus_Assignment3';
const BRANCH = 'main';

const services = [
  {
    name: 'api',
    dockerfile: 'apps/api/Dockerfile',
    rootDirectory: 'apps/api',
    port: 3001,
  },
  {
    name: 'scraper-worker',
    dockerfile: 'workers/scraper/Dockerfile',
    rootDirectory: 'workers/scraper',
    port: 8001,
  },
  {
    name: 'jd-analysis-worker',
    dockerfile: 'workers/jd-analysis/Dockerfile',
    rootDirectory: 'workers/jd-analysis',
    port: 8002,
  },
  {
    name: 'scorer-worker',
    dockerfile: 'workers/scorer/Dockerfile',
    rootDirectory: 'workers/scorer',
    port: 8003,
  },
  {
    name: 'transcriber-worker',
    dockerfile: 'workers/transcriber/Dockerfile',
    rootDirectory: 'workers/transcriber',
    port: 8004,
  },
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
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors, null, 2));
  }
  return json.data;
}

async function createService(name) {
  console.log(`\n→ Creating service: ${name}`);
  const data = await gql(
    `mutation serviceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) { id name }
    }`,
    {
      input: {
        projectId: PROJECT_ID,
        name,
        source: {
          repo: GITHUB_REPO,
          branch: BRANCH,
        },
      },
    }
  );
  return data.serviceCreate.id;
}

async function setServiceConfig(serviceId, svc) {
  console.log(`  → Configuring ${svc.name} (Dockerfile: ${svc.dockerfile})`);
  await gql(
    `mutation serviceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
    }`,
    {
      serviceId,
      environmentId: ENVIRONMENT_ID,
      input: {
        buildConfig: {
          builder: 'DOCKERFILE',
          dockerfilePath: svc.dockerfile,
        },
        startCommand: null,
        rootDirectory: '/',  // repo root since Dockerfile paths are relative to root
        numReplicas: 1,
      },
    }
  );
}

async function deployService(serviceId, name) {
  console.log(`  → Triggering deployment for ${name}`);
  const data = await gql(
    `mutation serviceInstanceDeploy($serviceId: String!, $environmentId: String!) {
      serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
    }`,
    { serviceId, environmentId: ENVIRONMENT_ID }
  );
  return data.serviceInstanceDeploy;
}

async function main() {
  console.log('🚀 TalentIQ — Creating Railway services from GitHub...\n');
  console.log(`Project: generous-elegance (${PROJECT_ID})`);
  console.log(`Repo: ${GITHUB_REPO} @ ${BRANCH}`);

  for (const svc of services) {
    try {
      const serviceId = await createService(svc.name);
      console.log(`  ✓ Created ${svc.name} (id: ${serviceId})`);
      await setServiceConfig(serviceId, svc);
      console.log(`  ✓ Configured ${svc.name}`);
      await deployService(serviceId, svc.name);
      console.log(`  ✓ Deploy triggered for ${svc.name}`);
    } catch (err) {
      console.error(`  ✗ Error with ${svc.name}:`, err.message);
    }
  }

  console.log('\n✅ All services created and deployments triggered!');
  console.log(`   Monitor at: https://railway.app/project/${PROJECT_ID}`);
  console.log('\n   After services are live, check the API URL from Railway dashboard');
  console.log('   and update README.md + mobile/eas.json with EXPO_PUBLIC_API_URL');
}

main().catch(console.error);
