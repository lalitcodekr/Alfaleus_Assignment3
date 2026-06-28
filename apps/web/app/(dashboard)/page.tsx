'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { JobCard } from '@/components/jobs/JobCard';
import { NewJobModal } from '@/components/jobs/NewJobModal';

interface Job {
  id: string;
  title: string;
  createdAt: string;
  status: string;
  candidateCount?: number;
  avgScore?: number;
  interviewedCount?: number;
}


export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery<{ jobs: Job[] }>({
    queryKey: ['jobs'],
    queryFn: () => api.get<{ jobs: Job[] }>('/api/jobs'),
  });

  const jobs = data?.jobs || [];

  const handleDeleteJob = async (id: string) => {
    if (confirm('Are you sure you want to completely delete this role? All candidates, scores, and interviews will be permanently lost.')) {
      try {
        await api.delete(`/api/jobs/${id}`);
        refetch();
      } catch (err) {
        alert('Failed to delete job.');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '48px 24px' }}>
      {/* Header */}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
              🎯 TalentIQ
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>
              AI-Powered Recruitment Dashboard
            </p>
          </div>
          <button
            id="post-job-btn"
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: 15, borderRadius: 'var(--radius-full)' }}
            onClick={() => setModalOpen(true)}
          >
            + Post a Role
          </button>
        </div>

        {/* Job Cards Grid */}
        {isLoading ? (
          <div style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 60 }}>
            <div className="pulse-dot" style={{ width: 12, height: 12, background: 'var(--color-primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
            Loading your roles…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {(jobs || []).map((job) => (
              <JobCard key={job.id} job={job} onDelete={handleDeleteJob} />
            ))}

            {/* New role CTA card */}
            <button
              id="new-role-card-btn"
              onClick={() => setModalOpen(true)}
              className="glass"
              style={{
                border: '2px dashed var(--color-border-strong)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--color-text-tertiary)',
                cursor: 'pointer',
                padding: '40px 24px',
                fontSize: 15,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                transition: 'all 0.2s ease',
                minHeight: '260px'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-bg)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border-strong)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 8 }}>
                +
              </div>
              <span style={{ fontWeight: 500 }}>Post a new role</span>
            </button>
          </div>
        )}
      </div>

      {modalOpen && (
        <NewJobModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
