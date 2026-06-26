'use client';

import Link from 'next/link';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    createdAt: string;
    status?: string;
  };
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Link
      id={`job-card-${job.id}`}
      href={`/jobs/${job.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div
        className="surface card-hover"
        style={{ padding: '24px', cursor: 'pointer' }}
      >
        {/* Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span className="badge badge-success" style={{ fontSize: 11 }}>
            ● Active
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            {new Date(job.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 20, lineHeight: 1.3 }}>
          {job.title}
        </h2>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Candidates', value: '—' },
            { label: 'Avg Score', value: '—' },
            { label: 'Interviewed', value: '—' },
          ].map((stat) => (
            <div key={stat.label} style={{ flex: 1, textAlign: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
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
