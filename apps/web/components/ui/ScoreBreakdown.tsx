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
  if (score >= 70) return 'var(--color-primary)';
  if (score >= 40) return 'var(--color-warning)';
  return 'var(--color-text-tertiary)';
}

function DimensionRow({ label, score }: Dimension) {
  const color = getBarColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <span style={{ width: 90, fontSize: 12, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
        {label}
      </span>
      <div style={{
        flex: 1,
        height: 6,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 999,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(100, score)}%`,
          height: '100%',
          background: color,
          borderRadius: 999,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{
        width: 36,
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color,
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
