import 'dotenv/config'; // Ensure env vars are loaded early
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { logger } from 'hono-pino';
import { cors } from 'hono/cors';
import { auth } from './auth/auth';
import { requireAuth } from './middleware/requireAuth';
import { initQueue } from './queue/boss';

const app = new Hono();

app.use(logger());

// Start pg-boss queue (using async IIFE to avoid top-level await issues in CJS if any)
initQueue().catch(err => {
    console.error('Failed to start pg-boss:', err);
});

app.use(
    '/api/*',
    cors({
        origin: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
        credentials: true,
    })
);

import { jobsRouter } from './routes/jobs';
import { candidatesRouter } from './routes/candidates';
import { interviewsRouter } from './routes/interviews';
import { comparisonRouter } from './routes/comparison';

// Better Auth routes (signup, login, etc)
app.on(['POST', 'GET'], '/api/auth/**', (c) => {
    return auth.handler(c.req.raw);
});

app.route('/api/jobs', jobsRouter);
app.route('/api/candidates', candidatesRouter);
app.route('/api/interviews', interviewsRouter);
app.route('/api/comparison', comparisonRouter);

app.get('/', (c) => c.json({ status: 'ok' }));

// Example protected route using requireAuth middleware
app.get('/api/me', requireAuth, (c) => {
    const user = c.get('user');
    return c.json({ user });
});

app.onError((err, c) => {
    console.error(`[Error] ${err}`);
    return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

const port = Number(process.env.PORT) || 3001;
console.log(`Starting Hono server on port ${port}...`);

serve({
    fetch: app.fetch,
    port,
});
