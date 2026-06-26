'use client';

import { ScoreRing } from './ScoreRing';

interface ComparisonCandidate {
  id: string;
  name: string;
  title?: string;
  total_score: number;
  scores: {
    technical: number;
    seniority: number;
    domain: number;
    implicit: number;
  };
  scorecard?: {
    hire_signal?: string;
    confidence?: number;
  } | null;
}

interface ComparisonGridProps {
  candidates: ComparisonCandidate[];
  onRemove?: (id: string) => void;
}

function ScoreCell({ score, isBest }: { score: number; isBest: boolean }) {
  return (
    <td
      style={{
        padding: '12px 16px',
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        fontWeight: isBest ? 700 : 400,
        color: isBest ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        borderBottom: '1px solid var(--color-border)',
        textAlign: 'center',
      }}
    >
      {Math.round(score)}
      {isBest && ' ★'}
    </td>
  );
}

export function ComparisonGrid({ candidates, onRemove }: ComparisonGridProps) {
  const dimensions: Array<{ key: keyof ComparisonCandidate['scores']; label: string }> = [
    { key: 'technical', label: 'Technical' },
    { key: 'seniority', label: 'Seniority' },
    { key: 'domain', label: 'Domain' },
    { key: 'implicit', label: 'Implicit Signals' },
  ];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
        <thead>
          <tr>
            <th
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--color-text-tertiary)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              Metric
            </th>
            {candidates.map((c) => (
              <th
                key={c.id}
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  borderBottom: '1px solid var(--color-border)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <ScoreRing score={c.total_score} size={44} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {c.name}
                  </span>
                  {c.title && (
                    <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{c.title}</span>
                  )}
                  {onRemove && (
                    <button
                      id={`comparison-remove-${c.id}`}
                      onClick={() => onRemove(c.id)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-tertiary)',
                        cursor: 'pointer',
                        fontSize: 16,
                        lineHeight: 1,
                      }}
                      aria-label={`Remove ${c.name} from comparison`}
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Overall */}
          <tr>
            <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
              Overall Score
            </td>
            {candidates.map((c) => {
              const best = Math.max(...candidates.map((x) => x.total_score));
              return <ScoreCell key={c.id} score={c.total_score} isBest={c.total_score === best} />;
            })}
          </tr>

          {/* Dimensions */}
          {dimensions.map(({ key, label }) => (
            <tr key={key}>
              <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                {label}
              </td>
              {candidates.map((c) => {
                const scores = candidates.map((x) => x.scores[key]);
                const best = Math.max(...scores);
                return <ScoreCell key={c.id} score={c.scores[key]} isBest={c.scores[key] === best} />;
              })}
            </tr>
          ))}

          {/* Hire Signal */}
          <tr>
            <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
              Hire Signal
            </td>
            {candidates.map((c) => (
              <td key={c.id} style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: c.scorecard?.hire_signal === 'Strong Hire'
                    ? 'var(--color-success)'
                    : c.scorecard?.hire_signal === 'Hire'
                    ? 'var(--color-primary)'
                    : c.scorecard?.hire_signal === 'No Hire'
                    ? 'var(--color-danger)'
                    : 'var(--color-text-tertiary)',
                }}>
                  {c.scorecard?.hire_signal || '—'}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
