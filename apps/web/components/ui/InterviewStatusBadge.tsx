'use client';

type InterviewStatus = 'not_invited' | 'invited' | 'in_progress' | 'completed' | 'expired';

const STATUS_CONFIG: Record<InterviewStatus, { label: string; dotColor: string; textColor: string; bg: string; border: string; pulse?: boolean }> = {
  not_invited:  { label: 'Not Invited',   dotColor: 'var(--color-text-tertiary)', textColor: 'var(--color-text-tertiary)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
  invited:      { label: 'Invited',        dotColor: 'var(--color-info)',           textColor: 'var(--color-info)',           bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.3)' },
  in_progress:  { label: 'In Progress',    dotColor: 'var(--color-primary)',        textColor: 'var(--color-primary)',        bg: 'var(--color-accent-bg)', border: 'rgba(255,122,0,0.3)',  pulse: true },
  completed:    { label: 'Completed',      dotColor: 'var(--color-success)',        textColor: 'var(--color-success)',        bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.3)' },
  expired:      { label: 'Link Expired',   dotColor: 'var(--color-danger)',         textColor: 'var(--color-danger)',         bg: 'var(--color-danger-bg)', border: 'rgba(239,68,68,0.3)' },
};

export function InterviewStatusBadge({ status }: { status: InterviewStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_invited;

  return (
    <span
      className="badge"
      style={{
        background: cfg.bg,
        color: cfg.textColor,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span
        className={cfg.pulse ? 'pulse-dot' : ''}
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: cfg.dotColor,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}
