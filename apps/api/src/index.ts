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

app.use(
    '/api/*',
    cors({
        origin: (origin) => {
            const allowed = [
                'http://localhost:3000',
                process.env.FRONTEND_URL || '',
                'https://talentiq-web.onrender.com',
            ].filter(Boolean);
            if (!origin || allowed.includes(origin)) return origin || '*';
            return null;
        },
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
        credentials: true,
    })
);

// Start pg-boss queue in background (server starts immediately; queue becomes ready within seconds)
initQueue().catch(err => {
    console.error('[startup] Failed to start pg-boss queue:', err);
});

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
