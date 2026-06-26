'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ScoreBreakdown } from '@/components/ui/ScoreBreakdown';
import { InterviewScorecard } from '@/components/ui/InterviewScorecard';
import { useComparisonStore } from '@/store/comparisonStore';

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
    aggregateScore?: number;
    hireSignal?: string;
    confidence?: number;
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
    refetchInterval: (query) => {
      return query.state.data?.status === 'processing' ? 10_000 : false;
    },
  });

  const shortlistMutation = useMutation({
    mutationFn: () => api.patch(`/api/candidates/${candidateId}/shortlist`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['candidate', candidateId] }),
  });

  const candidate = candidateData?.candidate;
  const scores = candidateData?.scores;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button
            id="candidate-back-btn"
            onClick={() => router.back()}
            className="btn btn-ghost"
            style={{ padding: '8px 12px', fontSize: 13 }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{candidate?.name || 'Candidate'}</h1>
          {candidate?.currentTitle && (
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{candidate.currentTitle}</span>
          )}
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left: Profile */}
          <div>
            <div className="surface" style={{ padding: '24px', marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                {candidate?.summary || 'No summary available.'}
              </p>
            </div>

            {scores && (
              <div className="surface" style={{ padding: '24px' }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Score Breakdown
                </p>
                <ScoreBreakdown
                  technical={scores.technicalScore}
                  seniority={scores.seniorityScore}
                  domain={scores.domainScore}
                  implicit={scores.implicitScore}
                />
              </div>
            )}
          </div>

          {/* Right: Scorecard */}
          <div className="surface" style={{ padding: '24px' }}>
            {scorecardLoading ? (
              <div style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 40 }}>
                Loading scorecard…
              </div>
            ) : scorecardData?.status === 'not_started' || scorecardData?.status === 'in_progress' ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 8 }}>Interview not completed yet.</p>
              </div>
            ) : scorecardData?.status === 'processing' ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div className="pulse-dot" style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--color-primary)', margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--color-text-secondary)' }}>Generating AI scorecard… refreshing automatically.</p>
              </div>
            ) : scorecardData?.scorecard ? (
              <InterviewScorecard
                scorecard={scorecardData.scorecard}
                answers={scorecardData.answers || []}
                technicalScore={scores?.technicalScore}
                seniorityScore={scores?.seniorityScore}
                domainScore={scores?.domainScore}
                implicitScore={scores?.implicitScore}
              />
            ) : (
              <p style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 40 }}>
                No scorecard available.
              </p>
            )}
          </div>
        </div>

        {/* Sticky action bar */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--color-bg-surface)',
            borderTop: '1px solid var(--color-border)',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            zIndex: 100,
          }}
        >
          <button
            id="candidate-shortlist-btn"
            className="btn btn-outline"
            onClick={() => shortlistMutation.mutate()}
          >
            {candidate?.shortlisted ? 'Remove from Shortlist' : 'Override — Add to Shortlist'}
          </button>
          <button
            id="candidate-compare-btn"
            className="btn btn-ghost"
            onClick={() => {
              add(candidateId);
              router.push('/comparison');
            }}
          >
            + Add to Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
