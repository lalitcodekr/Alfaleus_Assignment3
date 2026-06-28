'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ScoreBreakdown } from '@/components/ui/ScoreBreakdown';
import { InterviewScorecard } from '@/components/ui/InterviewScorecard';
import { useComparisonStore } from '@/store/comparisonStore';

interface CandidateDetail {
  id: string;
  name: string;
  title?: string;
  experienceSummary?: string;
  shortlisted?: boolean;
}

interface CandidateScores {
  technicalScore?: number;
  seniorityScore?: number;
  domainScore?: number;
  implicitScore?: number;
  compositeScore?: number;
  redFlags?: string[];
  shortlisted?: boolean;
}

interface ScorecardData {
  status: string;
  scorecard?: {
    aggregateScore: number;
    hireSignal: 'Strong Hire' | 'Hire' | 'No Hire';
    confidence: number;
    rankingJustification?: string;
    followUpQuestions?: string[];
  };
  answers?: {
    questionIndex: number;
    transcription?: string;
    relevanceScore?: number;
    clarityScore?: number;
  }[];
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;
  const { add } = useComparisonStore();
  const queryClient = useQueryClient();

  const { data: candidateData } = useQuery<{ candidate: CandidateDetail; scores: CandidateScores }>({
    queryKey: ['candidate', candidateId],
    queryFn: () => api.get(`/api/candidates/${candidateId}`),
  });

  const { data: scorecardData, isLoading: scorecardLoading } = useQuery<ScorecardData>({
    queryKey: ['scorecard', candidateId],
    queryFn: () => api.get(`/api/candidates/${candidateId}/scorecard`),
    refetchInterval: (query) => query.state.data?.status === 'processing' ? 10_000 : false,
  });

  const shortlistMutation = useMutation({
    mutationFn: () => api.patch(`/api/candidates/${candidateId}/shortlist`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['candidate', candidateId] }),
  });

  const candidate = candidateData?.candidate;
  const scores = candidateData?.scores;
  const compositeScore = scores?.compositeScore ?? 0;

  return (
    <div style={{ minHeight: '100vh', padding: '48px 24px 120px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
          <button id="candidate-back-btn" onClick={() => router.back()} className="btn btn-ghost" style={{ padding: '10px 16px', fontSize: 14, borderRadius: 'var(--radius-full)' }}>
            ← Back
          </button>
          {candidate && (
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-accent-bg)', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: 'var(--color-primary)', flexShrink: 0, boxShadow: '0 0 16px var(--color-primary-glow)' }}>
              {getInitials(candidate.name)}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 2 }}>{candidate?.name || 'Loading…'}</h1>
            {candidate?.title && <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{candidate.title}</p>}
          </div>
          <div style={{ padding: '12px 20px', borderRadius: 'var(--radius-full)', background: 'var(--color-accent-bg)', border: '1px solid rgba(255,90,0,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontWeight: 500 }}>AI Score</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{Math.round(compositeScore)}</span>
          </div>
          {candidate?.shortlisted && <span className="badge badge-primary" style={{ fontSize: 13, padding: '8px 14px' }}>✓ Shortlisted</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 14 }}>Experience Summary</p>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>{candidate?.experienceSummary || 'No summary available.'}</p>
            </div>
            {scores && (
              <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 18 }}>Score Breakdown</p>
                <ScoreBreakdown technical={scores.technicalScore} seniority={scores.seniorityScore} domain={scores.domainScore} implicit={scores.implicitScore} />
              </div>
            )}
          </div>
          <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-lg)' }}>
            {scorecardLoading ? (
              <div style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 60 }}>
                <div className="pulse-dot" style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--color-primary)', margin: '0 auto 16px' }} />
                Loading scorecard…
              </div>
            ) : scorecardData?.status === 'not_started' || scorecardData?.status === 'in_progress' ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>🎤</div>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 500 }}>Interview not completed yet.</p>
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>Send the candidate an invite from the pipeline.</p>
              </div>
            ) : scorecardData?.status === 'processing' ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div className="pulse-dot" style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--color-primary)', margin: '0 auto 20px' }} />
                <p style={{ color: 'var(--color-text-primary)', fontWeight: 500, marginBottom: 8 }}>Generating AI scorecard…</p>
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>Refreshes automatically every 10s.</p>
              </div>
            ) : scorecardData?.scorecard ? (
              <InterviewScorecard scorecard={scorecardData.scorecard} answers={scorecardData.answers || []} technicalScore={scores?.technicalScore} seniorityScore={scores?.seniorityScore} domainScore={scores?.domainScore} implicitScore={scores?.implicitScore} />
            ) : (
              <p style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 60 }}>No scorecard available.</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid var(--color-border)', padding: '16px 32px', display: 'flex', justifyContent: 'flex-end', gap: 12, zIndex: 100 }}>
        <button id="candidate-compare-btn" className="btn btn-ghost" style={{ borderRadius: 'var(--radius-full)' }} onClick={() => { add(candidateId); router.push('/comparison'); }}>
          + Add to Comparison
        </button>
        <button id="candidate-shortlist-btn" className="btn btn-outline" style={{ borderRadius: 'var(--radius-full)' }} onClick={() => shortlistMutation.mutate()}>
          {candidate?.shortlisted ? '✕ Remove from Shortlist' : '✓ Add to Shortlist'}
        </button>
      </div>
    </div>
  );
}
