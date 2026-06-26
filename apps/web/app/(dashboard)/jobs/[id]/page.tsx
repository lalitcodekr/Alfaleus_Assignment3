'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PipelineRow } from '@/components/ui/PipelineRow';
import { useComparisonStore } from '@/store/comparisonStore';

interface Candidate {
  id: string;
  name: string;
  currentTitle?: string;
  totalScore?: number;
  shortlisted?: boolean;
  interviewStatus?: string;
}

export default function JobPipelinePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { add } = useComparisonStore();
  const queryClient = useQueryClient();

  const { data: candidates, isLoading } = useQuery<Candidate[]>({
    queryKey: ['candidates', jobId],
    queryFn: () => api.get<Candidate[]>(`/api/jobs/${jobId}/candidates`),
  });

  const inviteMutation = useMutation({
    mutationFn: (candidateId: string) =>
      api.post(`/api/candidates/${candidateId}/invite`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', jobId] });
    },
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--color-text-tertiary)' }}>Loading pipeline…</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button
            id="pipeline-back-btn"
            onClick={() => router.push('/')}
            className="btn btn-ghost"
            style={{ padding: '8px 12px', fontSize: 13 }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Candidate Pipeline</h1>
        </div>

        {/* Pipeline list */}
        <div className="surface" style={{ overflow: 'hidden' }}>
          {(candidates || []).length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              No candidates yet. Scraping in progress…
            </div>
          ) : (
            (candidates || []).map((c, i) => (
              <PipelineRow
                key={c.id}
                rank={i + 1}
                name={c.name}
                title={c.currentTitle}
                score={c.totalScore || 0}
                shortlisted={c.shortlisted}
                interviewStatus={(c.interviewStatus as any) || 'not_invited'}
                onInvite={() => inviteMutation.mutate(c.id)}
                onView={() => router.push(`/candidates/${c.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
