'use client';

import { ScoreRing } from './ScoreRing';
import { InterviewStatusBadge } from './InterviewStatusBadge';

interface PipelineRowProps {
  rank: number;
  name: string;
  title?: string;
  score: number;
  shortlisted?: boolean;
  interviewStatus?: 'not_invited' | 'invited' | 'in_progress' | 'completed' | 'expired';
  onInvite?: () => void;
  onView?: () => void;
}

function AvatarCircle({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      aria-hidden="true"
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'var(--color-accent-bg)',
        border: '1px solid rgba(255,122,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 13,
        color: 'var(--color-primary)',
        flexShrink: 0,
        fontFamily: 'var(--font-mono)',
      }}
    >
      {initials}
    </div>
  );
}

export function PipelineRow({
  rank,
  name,
  title,
  score,
  shortlisted,
  interviewStatus = 'not_invited',
  onInvite,
  onView,
}: PipelineRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 20px',
        background: shortlisted ? 'var(--color-accent-bg)' : 'transparent',
        borderBottom: '1px solid var(--color-border)',
        transition: 'background 0.15s ease',
      }}
    >
      {/* Rank */}
      <span
        style={{
          width: 28,
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--color-text-tertiary)',
          flexShrink: 0,
        }}
      >
        #{rank}
      </span>

      {/* Avatar */}
      <AvatarCircle name={name} />

      {/* Name + Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 2 }}>
          {name}
        </p>
        {title && (
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {title}
          </p>
        )}
      </div>

      {/* Shortlist badge */}
      {shortlisted && (
        <span className="badge badge-primary">✓ Shortlisted</span>
      )}

      {/* Interview status */}
      <InterviewStatusBadge status={interviewStatus} />

      {/* Score ring */}
      <ScoreRing score={score} size={48} />

      {/* Action */}
      {interviewStatus === 'not_invited' ? (
        <button
          id={`invite-btn-${name.replace(/\s+/g, '-').toLowerCase()}`}
          className="btn btn-primary"
          style={{ fontSize: 13, padding: '8px 16px', flexShrink: 0 }}
          onClick={onInvite}
        >
          Send Invite
        </button>
      ) : (
        <button
          id={`view-btn-${name.replace(/\s+/g, '-').toLowerCase()}`}
          className="btn btn-ghost"
          style={{ fontSize: 13, padding: '8px 16px', flexShrink: 0 }}
          onClick={onView}
        >
          View →
        </button>
      )}
    </div>
  );
}
