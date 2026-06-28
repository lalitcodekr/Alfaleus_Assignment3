'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PipelineRow } from '@/components/ui/PipelineRow';

interface Candidate {
  id: string;
  name: string;
  title?: string;
  company?: string;
  compositeScore?: number;
  shortlisted?: boolean;
  dataConfidence?: string;
  redFlags?: string[];
  interviewStatus?: 'not_invited' | 'invited' | 'in_progress' | 'completed' | 'expired';
}

export default function JobPipelinePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ candidates: Candidate[] }>({
    queryKey: ['candidates', jobId],
    queryFn: () => api.get<{ candidates: Candidate[] }>(`/api/jobs/${jobId}/candidates`),
  });

  const candidates = data?.candidates || [];

  const inviteMutation = useMutation({
    mutationFn: (candidateId: string) =>
      api.post(`/api/candidates/${candidateId}/invite`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', jobId] });
    },
  });

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pulse-dot" style={{ width: 16, height: 16, background: 'var(--color-primary)', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40 }}>
          <button
            id="pipeline-back-btn"
            onClick={() => router.push('/')}
            className="btn btn-ghost"
            style={{ padding: '10px 16px', fontSize: 14, borderRadius: 'var(--radius-full)', background: 'var(--color-bg-surface)' }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Candidate Pipeline</h1>
          <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--color-text-secondary)', background: 'var(--color-bg-surface)', padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} <span style={{ opacity: 0.5, margin: '0 8px' }}>|</span> {candidates.filter(c => c.shortlisted).length} shortlisted
          </span>
        </div>

        {/* Pipeline list */}
        <div className="glass" style={{ overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
          {candidates.length === 0 ? (
            <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              <div className="pulse-dot" style={{ width: 12, height: 12, background: 'var(--color-primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
              No candidates yet. Scraping in progress…
            </div>
          ) : (
            candidates.map((c, i) => (
              <PipelineRow
                key={c.id}
                rank={i + 1}
                name={c.name}
                title={c.title}
                score={c.compositeScore || 0}
                shortlisted={c.shortlisted}
                interviewStatus={c.interviewStatus || 'not_invited'}
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
