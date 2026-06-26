import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/client';
import { candidates, candidateScores } from '../db/schema';
import { requireAuth } from '../middleware/requireAuth';
import { eq, sql } from 'drizzle-orm';

export const candidatesRouter = new Hono();

candidatesRouter.use('*', requireAuth);

// GET /api/candidates/:id — Return full candidate details including scores
candidatesRouter.get('/:id', async (c) => {
    const candidateId = c.req.param('id');
    
    const [candidate] = await db.select()
        .from(candidates)
        .where(eq(candidates.id, candidateId));
        
    if (!candidate) return c.json({ error: 'Candidate not found' }, 404);
    
    const [score] = await db.select()
        .from(candidateScores)
        .where(eq(candidateScores.candidateId, candidateId));
        
    return c.json({ candidate, score });
});

// PATCH /api/candidates/:id/shortlist — Manual shortlist override
const shortlistSchema = z.object({
    shortlisted: z.boolean(),
});

candidatesRouter.patch('/:id/shortlist', zValidator('json', shortlistSchema), async (c) => {
    const candidateId = c.req.param('id');
    const { shortlisted } = c.req.valid('json');
    const user = c.get('user'); // populated by requireAuth middleware
    
    await db.update(candidateScores)
        .set({
            shortlisted,
            shortlistOverride: true,
            overrideBy: user.id,
            overrideAt: sql`now()`,
        })
        .where(eq(candidateScores.candidateId, candidateId));
        
    const [updatedScore] = await db.select()
        .from(candidateScores)
        .where(eq(candidateScores.candidateId, candidateId));
        
    return c.json({ score: updatedScore });
});
