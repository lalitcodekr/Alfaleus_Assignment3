'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ComparisonGrid } from '@/components/ui/ComparisonGrid';
import { useComparisonStore } from '@/store/comparisonStore';

interface ComparisonResponse {
  candidates: {
    id: string;
    name: string;
    title: string;
    total_score: number;
    scores: { technical: number; seniority: number; domain: number; implicit: number };
    interview_status: string;
    scorecard: { aggregate_score: number; hire_signal: string; confidence: number; ranking_justification: string } | null;
  }[];
  ranking_narrative: string;
}

export default function ComparisonPage() {
  const router = useRouter();
  const { selectedIds, remove, clear } = useComparisonStore();

  const { data, isLoading, error } = useQuery<ComparisonResponse>({
    queryKey: ['comparison', selectedIds],
    queryFn: () => api.post<ComparisonResponse>('/api/comparison', { candidate_ids: selectedIds }),
    enabled: selectedIds.length >= 2,
  });

  if (selectedIds.length < 2) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ fontSize: 48 }}>⚖️</div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 18, fontWeight: 500 }}>Select at least 2 candidates to compare.</p>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: 14 }}>Go to a candidate profile and click "Add to Comparison".</p>
        <button id="comparison-back-btn" className="btn btn-ghost" style={{ borderRadius: 'var(--radius-full)', marginTop: 8 }} onClick={() => router.push('/')}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button id="comparison-back-btn" className="btn btn-ghost" style={{ borderRadius: 'var(--radius-full)' }} onClick={() => router.back()}>← Back</button>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Candidate Comparison</h1>
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: 14 }}>{selectedIds.length} candidates selected</p>
            </div>
          </div>
          <button id="comparison-clear-btn" className="btn btn-ghost" style={{ borderRadius: 'var(--radius-full)', color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.3)' }} onClick={clear}>
            Clear All
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--color-text-tertiary)' }}>
            <div className="pulse-dot" style={{ width: 16, height: 16, background: 'var(--color-primary)', borderRadius: '50%', margin: '0 auto 20px' }} />
            <p style={{ fontWeight: 500, fontSize: 16 }}>Generating AI comparison…</p>
          </div>
        ) : error ? (
          <div style={{ color: 'var(--color-danger)', textAlign: 'center', padding: 60, background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-lg)' }}>
            Failed to load comparison. Please try again.
          </div>
        ) : data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {data.ranking_narrative && (
              <div className="glass" style={{ padding: '24px 28px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--color-primary)' }}>
                <p style={{ fontSize: 11, color: 'var(--color-primary)', marginBottom: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>🤖 AI Ranking Recommendation</p>
                <p style={{ fontSize: 15, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>{data.ranking_narrative}</p>
              </div>
            )}
            <div className="glass" style={{ overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
              <ComparisonGrid candidates={data.candidates} onRemove={remove} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
