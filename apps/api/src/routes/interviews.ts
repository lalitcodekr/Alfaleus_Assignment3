import { Hono } from 'hono';
import { db } from '../db/client';
import { interviews, candidates, jobs } from '../db/schema';
import { eq } from 'drizzle-orm';

export const interviewsRouter = new Hono();

// GET /api/interviews/:token — Fetch interview details
interviewsRouter.get('/:token', async (c) => {
    const token = c.req.param('token');
    
    // Fetch interview by token
    const [interview] = await db.select().from(interviews).where(eq(interviews.token, token));
    if (!interview) return c.json({ error: 'invalid_token' }, 404);
    
    // Check if expired
    if (new Date(interview.expiresAt).getTime() < Date.now()) {
        return c.json({ error: 'token_expired' }, 403);
    }
    
    // Check if already submitted
    if (interview.status === 'completed' || interview.submittedAt) {
        return c.json({ error: 'already_submitted' }, 403);
    }
    
    // Update status to link_opened if invited
    if (interview.status === 'invited') {
        await db.update(interviews)
            .set({ status: 'link_opened' })
            .where(eq(interviews.id, interview.id));
    }
    
    // Fetch related candidate and job for UI display
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, interview.candidateId));
    const [job] = await db.select().from(jobs).where(eq(jobs.id, interview.jobId));
    
    return c.json({
        questions: interview.questions,
        candidate_name: candidate?.name,
        role_title: job?.title,
        time_limits: 5 // minutes per question
    });
});
