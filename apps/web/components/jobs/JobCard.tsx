'use client';

import Link from 'next/link';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    createdAt: string;
    status?: string;
    candidateCount?: number;
    avgScore?: number;
    interviewedCount?: number;
  };
  onDelete?: (id: string) => void;
}

export function JobCard({ job, onDelete }: JobCardProps) {
  return (
    <Link
      id={`job-card-${job.id}`}
      href={`/jobs/${job.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        className="glass card-hover"
        style={{ padding: '24px', cursor: 'pointer', position: 'relative', borderRadius: 'var(--radius-lg)' }}
      >
        {/* Status & Delete */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span className="badge badge-success" style={{ fontSize: 11 }}>
            ● Active
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {new Date(job.createdAt).toLocaleDateString()}
            </span>
            {onDelete && (
              <button
                className="btn btn-ghost"
                style={{ padding: '4px', border: 'none', color: 'var(--color-text-tertiary)' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(job.id);
                }}
                title="Delete Job"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 20, lineHeight: 1.3 }}>
          {job.title}
        </h2>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Candidates', value: job.candidateCount ?? 0 },
            { label: 'Avg Score', value: job.avgScore ? Math.round(job.avgScore) : '—' },
            { label: 'Interviewed', value: job.interviewedCount ?? 0 },
          ].map((stat) => (
            <div key={stat.label} style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 14,
            color: 'var(--color-primary)',
            fontWeight: 500,
          }}
        >
          View Pipeline →
        </span>
      </div>
    </Link>
  );
}
