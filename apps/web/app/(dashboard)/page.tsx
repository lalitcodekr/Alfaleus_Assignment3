'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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
      } catch {
        alert('Failed to delete job.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/sign-out', {});
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const totalCandidates = jobs.reduce((acc, job) => acc + (job.candidateCount || 0), 0);
  const totalInterviews = jobs.reduce((acc, job) => acc + (job.interviewedCount || 0), 0);
  const avgSystemScore = jobs.length > 0 
    ? Math.round(jobs.reduce((acc, job) => acc + (job.avgScore || 0), 0) / jobs.length) 
    : 0;

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Orbs */}
      <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(255,90,0,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: 800, height: 800, background: 'radial-gradient(circle, rgba(255,90,0,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Top Navbar */}
      <nav style={{ position: 'relative', zIndex: 10, background: 'rgba(5,5,5,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 0 20px var(--color-primary-glow)' }}>🎯</div>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>TalentIQ</span>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: 13, color: 'var(--color-text-tertiary)' }}>
            Logout ⏏
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Welcome back
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 15 }}>
              Here&apos;s what&apos;s happening with your recruitment pipeline today.
            </p>
          </div>
          <button
            id="post-job-btn"
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: 15, borderRadius: 'var(--radius-full)', boxShadow: '0 4px 20px var(--color-primary-glow)' }}
            onClick={() => setModalOpen(true)}
          >
            + Post a Role
          </button>
        </div>

        {/* Global Stats Dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 48 }}>
          {[
            { label: 'Active Roles', value: jobs.length, icon: '💼' },
            { label: 'Total Candidates', value: totalCandidates, icon: '👥' },
            { label: 'Interviews Completed', value: totalInterviews, icon: '🎤' },
            { label: 'Avg Pipeline Quality', value: avgSystemScore > 0 ? `${avgSystemScore}/100` : '--', icon: '📈' }
          ].map((stat, i) => (
            <div key={i} className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)' }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--color-text-primary)' }}>Your Active Roles</h2>

        {/* Job Cards Grid */}
        {isLoading ? (
          <div style={{ color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 80 }}>
            <div className="pulse-dot" style={{ width: 16, height: 16, background: 'var(--color-primary)', borderRadius: '50%', margin: '0 auto 20px' }} />
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
                gap: 16,
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
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                +
              </div>
              <span style={{ fontWeight: 600 }}>Create New Role</span>
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
