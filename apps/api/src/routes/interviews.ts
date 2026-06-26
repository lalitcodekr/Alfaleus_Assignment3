import { Hono } from 'hono';
import { db } from '../db/client';
import { interviews, candidates, jobs } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { uploadToR2 } from '../storage/r2Client';
import { assembleChunks } from '../storage/chunkAssembler';
import { answers } from '../db/schema';
import { randomBytes } from 'crypto';

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
    
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, interview.candidateId));
    const [job] = await db.select().from(jobs).where(eq(jobs.id, candidate?.jobId || ''));
    
    return c.json({
        questions: interview.questions,
        candidate_name: candidate?.name,
        role_title: job?.title,
        time_limits: 5 // minutes per question
    });
});

// POST /api/interviews/:token/chunk — Upload video chunk
interviewsRouter.post('/:token/chunk', async (c) => {
    const token = c.req.param('token');
    
    // Parse form data since it contains binary file
    const body = await c.req.parseBody();
    const questionIndex = parseInt(body.question_index as string);
    const chunkIndex = parseInt(body.chunk_index as string);
    const totalChunks = parseInt(body.total_chunks as string);
    const chunkFile = body.chunk as File;
    
    if (isNaN(questionIndex) || isNaN(chunkIndex) || isNaN(totalChunks) || !chunkFile) {
        return c.json({ error: 'invalid_request' }, 400);
    }
    
    // Fetch interview
    const [interview] = await db.select().from(interviews).where(eq(interviews.token, token));
    if (!interview) return c.json({ error: 'invalid_token' }, 404);
    
    // Get or create the answer record
    let [answer] = await db.select().from(answers).where(
        and(eq(answers.interviewId, interview.id), eq(answers.questionIndex, questionIndex))
    );
    
    if (!answer) {
        const id = randomBytes(16).toString('hex');
        await db.insert(answers).values({
            id,
            interviewId: interview.id,
            questionIndex,
            videoChunksReceived: 0,
        });
        [answer] = await db.select().from(answers).where(eq(answers.id, id));
    }
    
    // Upload chunk to R2
    const chunkKey = `interviews/${token}/q${questionIndex}/chunk_${chunkIndex}`;
    const arrayBuffer = await chunkFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await uploadToR2(chunkKey, buffer, 'application/octet-stream');
    
    // Increment chunks received
    await db.update(answers)
        .set({ videoChunksReceived: sql`${answers.videoChunksReceived} + 1` })
        .where(eq(answers.id, answer.id));
        
    const [updatedAnswer] = await db.select().from(answers).where(eq(answers.id, answer.id));
    
    let assembled = false;
    if (updatedAnswer.videoChunksReceived === totalChunks) {
        // Assemble chunks asynchronously so we don't block the client
        assembleChunks(token, questionIndex, totalChunks, answer.id, interview.id);
        assembled = true;
    }
    
    return c.json({ received: true, chunkIndex, assembled });
});

// POST /api/interviews/:token/submit — Complete interview
interviewsRouter.post('/:token/submit', async (c) => {
    const token = c.req.param('token');
    
    // Fetch interview
    const [interview] = await db.select().from(interviews).where(eq(interviews.token, token));
    if (!interview) return c.json({ error: 'invalid_token' }, 404);
    
    await db.update(interviews)
        .set({ 
            status: 'completed',
            submittedAt: sql`now()`
        })
        .where(eq(interviews.id, interview.id));
        
    return c.json({ submitted: true });
});

// GET /api/interviews/:token/status — Get per-question upload status
interviewsRouter.get('/:token/status', async (c) => {
    const token = c.req.param('token');
    
    const [interview] = await db.select().from(interviews).where(eq(interviews.token, token));
    if (!interview) return c.json({ error: 'invalid_token' }, 404);
    
    const allAnswers = await db.select({
        questionIndex: answers.questionIndex,
        videoChunksReceived: answers.videoChunksReceived,
        videoAssembled: answers.videoAssembled
    }).from(answers).where(eq(answers.interviewId, interview.id));
    
    return c.json({ answers: allAnswers });
});
