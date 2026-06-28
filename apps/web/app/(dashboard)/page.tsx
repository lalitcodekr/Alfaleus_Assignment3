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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 4 }}>
              🎯 TalentIQ
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
              AI-Powered Recruitment Dashboard
            </p>
          </div>
          <button
            id="post-job-btn"
            className="btn btn-primary"
            onClick={() => setModalOpen(true)}
          >
            + Post a Role
          </button>
        </div>

        {/* Job Cards Grid */}
        {isLoading ? (
          <div style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 60 }}>
            Loading jobs…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {(jobs || []).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}

            {/* New role CTA card */}
            <button
              id="new-role-card-btn"
              onClick={() => setModalOpen(true)}
              style={{
                border: '2px dashed var(--color-border-strong)',
                borderRadius: 'var(--radius-lg)',
                background: 'transparent',
                color: 'var(--color-text-tertiary)',
                cursor: 'pointer',
                padding: '40px 24px',
                fontSize: 14,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border-strong)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
              }}
            >
              <span style={{ fontSize: 28 }}>+</span>
              <span>Post a new role</span>
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
