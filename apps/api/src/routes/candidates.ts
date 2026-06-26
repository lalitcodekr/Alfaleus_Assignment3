import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/client';
import { candidates, candidateScores, scorecards, answers } from '../db/schema';
import { requireAuth } from '../middleware/requireAuth';
import { eq, sql } from 'drizzle-orm';

import { Resend } from 'resend';
import { render } from '@react-email/render';
import { InvitationEmail } from '../email/InvitationEmail';
import { tokenService } from '../interview/tokenService';
import { jobs, interviews } from '../db/schema';
import React from 'react';

export const candidatesRouter = new Hono();

candidatesRouter.use('*', requireAuth);

// POST /api/candidates/:id/invite — Generate token, create interview, and send email
candidatesRouter.post('/:id/invite', async (c) => {
    const candidateId = c.req.param('id');
    
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, candidateId));
    if (!candidate) return c.json({ error: 'Candidate not found' }, 404);
    
    const [job] = await db.select().from(jobs).where(eq(jobs.id, candidate.jobId!));
    if (!job) return c.json({ error: 'Job not found' }, 404);
    
    // Generate token and create interview record
    const { token } = await tokenService.createInterviewRecord(candidate.id, job.id);
    
    // Generate questions using JD analysis worker
    const workerUrl = process.env.JD_ANALYSIS_WORKER_URL || 'http://localhost:8001';
    let generatedQuestions = null;
    try {
        const res = await fetch(`${workerUrl}/generate-questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                parsed_jd: job.parsedJd,
                candidate_profile: {
                    title: candidate.title,
                    skills: candidate.skills,
                    experience: candidate.experienceSummary
                }
            })
        });
        if (res.ok) {
            const data = await res.json();
            generatedQuestions = data.data.questions;
        } else {
            console.error('Failed to generate questions:', await res.text());
        }
    } catch (err) {
        console.error('Error calling question generator:', err);
    }
    
    // Render email HTML
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
    const interviewLink = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/interview/${token}`;
    
    // @ts-ignore - bypassing potential JSX pragma conflicts for now
    const html = await render(
        React.createElement(InvitationEmail, {
            candidateName: candidate.name,
            roleTitle: job.title,
            companyName: "Alfaleus Demo",
            interviewLink,
            timePerQuestion: 5,
            expiryDate,
        })
    );
    
    // Send email via Resend
    if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        try {
            await resend.emails.send({
                from: 'Alfaleus <interviews@alfaleus.com>',
                to: ['candidate@example.com'], // Usually candidate.email, mocked for demo
                subject: `Invitation to interview for ${job.title}`,
                html,
            });
        } catch (err) {
            console.error("Resend error:", err);
        }
    } else {
        console.log(`[Mock Email] To: ${candidate.name}, Link: ${interviewLink}`);
    }
    
    // Update interview status to invited and store questions
    await db.update(interviews)
        .set({ 
            status: 'invited',
            questions: generatedQuestions 
        })
        .where(eq(interviews.token, token));
        
    return c.json({ invited: true, token });
});

// GET /api/candidates/:id/scorecard
candidatesRouter.get('/:id/scorecard', async (c) => {
    const candidateId = c.req.param('id');
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, candidateId));
    if (!candidate) return c.json({ error: 'not_found' }, 404);
    
    const [interview] = await db.select().from(interviews).where(eq(interviews.candidateId, candidateId));
    if (!interview) return c.json({ status: 'not_started' });
    
    if (interview.status !== 'completed') {
        return c.json({ status: 'in_progress' });
    }
    
    const [scorecard] = await db.select().from(scorecards).where(eq(scorecards.interviewId, interview.id));
    if (!scorecard) {
        return c.json({ status: 'processing' });
    }
    
    const allAnswers = await db.select().from(answers).where(eq(answers.interviewId, interview.id));
    
    return c.json({
        status: 'completed',
        scorecard,
        answers: allAnswers
    });
});

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
