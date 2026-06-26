import { Hono } from 'hono';
import { requireAuth } from '../middleware/requireAuth';
import { db } from '../db/client';
import { candidates, candidateScores, interviews, scorecards, answers, jobs } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

export const comparisonRouter = new Hono();

// POST /api/comparison — Compare 2-4 candidates
comparisonRouter.post('/', requireAuth, async (c) => {
    const body = await c.req.json<{ candidate_ids: string[] }>();
    const { candidate_ids } = body;

    if (!candidate_ids || candidate_ids.length < 2 || candidate_ids.length > 4) {
        return c.json({ error: 'comparison requires 2-4 candidate_ids' }, 400);
    }

    // Fetch all candidate data with scores
    const candidatesData = await db.select().from(candidates).where(inArray(candidates.id, candidate_ids));
    const scoresData = await db.select().from(candidateScores).where(inArray(candidateScores.candidateId, candidate_ids));

    // For each candidate, fetch their scorecard (if interview done)
    const interviewsData = await db.select().from(interviews).where(inArray(interviews.candidateId, candidate_ids));
    const interviewIds = interviewsData.map(i => i.id).filter(Boolean);
    
    const scorecardsData = interviewIds.length > 0
        ? await db.select().from(scorecards).where(inArray(scorecards.interviewId, interviewIds))
        : [];

    // Build a unified comparison object per candidate
    const comparisonData = candidatesData.map(candidate => {
        const score = scoresData.find(s => s.candidateId === candidate.id);
        const interview = interviewsData.find(i => i.candidateId === candidate.id);
        const scorecard = interview ? scorecardsData.find(s => s.interviewId === interview.id) : null;
        return {
            id: candidate.id,
            name: candidate.name,
            title: candidate.currentTitle || 'Unknown',
            total_score: score?.totalScore || 0,
            scores: {
                technical: score?.technicalScore || 0,
                seniority: score?.seniorityScore || 0,
                domain: score?.domainScore || 0,
                implicit: score?.implicitScore || 0,
            },
            interview_status: interview?.status || 'not_started',
            scorecard: scorecard ? {
                aggregate_score: scorecard.aggregateScore,
                hire_signal: scorecard.hireSignal,
                confidence: scorecard.confidence,
                ranking_justification: scorecard.rankingJustification,
            } : null
        };
    });

    // LLM-generated ranking narrative
    let ranking_narrative = '';
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey) {
        const anthropic = new Anthropic({ apiKey });
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            messages: [{
                role: 'user',
                content: `You are a senior technical recruiter. Compare these ${candidate_ids.length} candidates and generate a concise ranked recommendation (2-4 sentences). Focus on who to hire first and why.
                
Candidates:
${JSON.stringify(comparisonData, null, 2)}

Return only the plain-English recommendation text, no JSON.`
            }]
        });
        ranking_narrative = (response.content[0] as any).text;
    } else {
        const sorted = [...comparisonData].sort((a, b) => b.total_score - a.total_score);
        ranking_narrative = `Based on semantic scoring, ${sorted[0].name} ranks highest with a score of ${sorted[0].total_score.toFixed(1)}.`;
    }

    return c.json({
        candidates: comparisonData.sort((a, b) => b.total_score - a.total_score),
        ranking_narrative,
    });
});
