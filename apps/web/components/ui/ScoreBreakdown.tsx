'use client';

interface Dimension {
  label: string;
  score: number;
}

interface ScoreBreakdownProps {
  technical?: number;
  seniority?: number;
  domain?: number;
  implicit?: number;
}

function getBarColor(score: number) {
  if (score >= 70) return 'linear-gradient(90deg, var(--color-primary-dark), var(--color-primary))';
  if (score >= 40) return 'linear-gradient(90deg, #b45309, var(--color-warning))';
  return 'linear-gradient(90deg, #3f3f46, var(--color-text-tertiary))';
}

function DimensionRow({ label, score }: Dimension) {
  const gradient = getBarColor(score);
  const textColor = score >= 70 ? 'var(--color-primary)' : score >= 40 ? 'var(--color-warning)' : 'var(--color-text-tertiary)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <span style={{ width: 90, fontSize: 13, color: 'var(--color-text-secondary)', flexShrink: 0, fontWeight: 500 }}>
        {label}
      </span>
      <div style={{
        flex: 1,
        height: 8,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 999,
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          width: `${Math.min(100, score)}%`,
          height: '100%',
          background: gradient,
          borderRadius: 999,
          boxShadow: score >= 70 ? '0 0 10px var(--color-primary-glow)' : 'none',
          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
      <span style={{
        width: 36,
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        color: textColor,
        fontWeight: 600,
        textAlign: 'right',
        flexShrink: 0,
      }}>
        {Math.round(score)}
      </span>
    </div>
  );
}

export function ScoreBreakdown({ technical = 0, seniority = 0, domain = 0, implicit = 0 }: ScoreBreakdownProps) {
  const dimensions: Dimension[] = [
    { label: 'Technical', score: technical },
    { label: 'Seniority', score: seniority },
    { label: 'Domain', score: domain },
    { label: 'Implicit', score: implicit },
  ];

  return (
    <div>
      {dimensions.map((d) => (
        <DimensionRow key={d.label} label={d.label} score={d.score} />
      ))}
    </div>
  );
}
