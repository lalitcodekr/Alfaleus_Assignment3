'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ComparisonGrid } from '@/components/ui/ComparisonGrid';
import { useComparisonStore } from '@/store/comparisonStore';

export default function ComparisonPage() {
  const router = useRouter();
  const { selectedIds, remove, clear } = useComparisonStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['comparison', selectedIds],
    queryFn: () => api.post<any>('/api/comparison', { candidate_ids: selectedIds }),
    enabled: selectedIds.length >= 2,
  });

  if (selectedIds.length < 2) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>
          Select at least 2 candidates to compare.
        </p>
        <button id="comparison-back-btn" className="btn btn-ghost" onClick={() => router.push('/')}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button id="comparison-back-btn" className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }} onClick={() => router.back()}>
              ← Back
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Candidate Comparison</h1>
          </div>
          <button id="comparison-clear-btn" className="btn btn-ghost" onClick={clear}>
            Clear Comparison
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-tertiary)' }}>
            Generating AI comparison…
          </div>
        ) : error ? (
          <div style={{ color: 'var(--color-danger)', textAlign: 'center', padding: 40 }}>
            Failed to load comparison.
          </div>
        ) : data ? (
          <>
            {/* AI Narrative */}
            {data.ranking_narrative && (
              <div
                className="surface"
                style={{ padding: '20px 24px', marginBottom: 24, borderLeft: '4px solid var(--color-primary)' }}
              >
                <p style={{ fontSize: 12, color: 'var(--color-primary)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  🤖 AI Ranking Recommendation
                </p>
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                  {data.ranking_narrative}
                </p>
              </div>
            )}

            {/* Comparison Grid */}
            <div className="surface" style={{ overflow: 'hidden' }}>
              <ComparisonGrid candidates={data.candidates} onRemove={remove} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
