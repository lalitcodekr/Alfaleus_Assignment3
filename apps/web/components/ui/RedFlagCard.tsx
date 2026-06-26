'use client';

interface RedFlagCardProps {
  title: string;
  explanation: string;
  onOverride?: () => void;
  onRemove?: () => void;
}

export function RedFlagCard({ title, explanation, onOverride, onRemove }: RedFlagCardProps) {
  return (
    <div
      style={{
        background: 'var(--color-danger-bg)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
        {/* Warning icon */}
        <span
          aria-hidden="true"
          style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}
        >⚠️</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-danger)', marginBottom: 4 }}>
            {title}
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            {explanation}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {onOverride && (
          <button
            id={`flag-override-${title.replace(/\s+/g, '-').toLowerCase()}`}
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '6px 12px' }}
            onClick={onOverride}
          >
            Override — Keep shortlisted
          </button>
        )}
        {onRemove && (
          <button
            id={`flag-remove-${title.replace(/\s+/g, '-').toLowerCase()}`}
            className="btn"
            style={{ fontSize: 12, padding: '6px 12px', background: 'rgba(239,68,68,0.15)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.3)' }}
            onClick={onRemove}
          >
            Remove from shortlist
          </button>
        )}
      </div>
    </div>
  );
}
