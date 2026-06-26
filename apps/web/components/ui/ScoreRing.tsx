'use client';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

function getColor(score: number) {
  if (score >= 70) return 'var(--color-primary)';
  if (score >= 40) return 'var(--color-warning)';
  return 'var(--color-score-low, #6B6B74)';
}

export function ScoreRing({ score, size = 56, strokeWidth = 5 }: ScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getColor(score);

  return (
    <svg
      width={size}
      height={size}
      role="img"
      aria-label={`${Math.round(score)}% match score`}
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      {/* Score label */}
      <text
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        fill={color}
        fontSize={size < 50 ? 11 : 13}
        fontWeight="700"
        fontFamily="var(--font-mono)"
        aria-hidden="true"
      >
        {Math.round(score)}
      </text>
    </svg>
  );
}
