'use client';

import { ScoreBreakdown } from './ScoreBreakdown';

interface AnswerSummary {
  questionIndex: number;
  question?: string;
  transcription?: string;
  summary?: string;
  relevanceScore?: number;
}

interface ScorecardData {
  aggregateScore: number;
  hireSignal: 'Strong Hire' | 'Hire' | 'No Hire';
  confidence: number;
  rankingJustification?: string;
  followUpQuestions?: string[];
}

interface InterviewScorecardProps {
  scorecard: ScorecardData;
  answers?: AnswerSummary[];
  technicalScore?: number;
  seniorityScore?: number;
  domainScore?: number;
  implicitScore?: number;
  generatedAt?: string;
}

function HireSignalBanner({ signal }: { signal: string }) {
  const cls =
    signal === 'Strong Hire'
      ? 'hire-signal-strong'
      : signal === 'Hire'
      ? 'hire-signal-hire'
      : 'hire-signal-no';
  return (
    <div className={cls} style={{ padding: '12px 16px', marginBottom: 20 }}>
      <span style={{ fontWeight: 700, fontSize: 16 }}>{signal}</span>
    </div>
  );
}

export function InterviewScorecard({
  scorecard,
  answers = [],
  technicalScore = 0,
  seniorityScore = 0,
  domainScore = 0,
  implicitScore = 0,
  generatedAt,
}: InterviewScorecardProps) {
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span className="badge badge-primary">🤖 AI Generated</span>
        {generatedAt && (
          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            {new Date(generatedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <HireSignalBanner signal={scorecard.hireSignal} />

      {/* Overall Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
          {Math.round(scorecard.aggregateScore)}
        </span>
        <div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Aggregate Score</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            {scorecard.confidence}% confidence
          </p>
        </div>
      </div>

      {/* Dimension Breakdown */}
      <div className="surface-elevated" style={{ padding: '16px', marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Score Dimensions
        </p>
        <ScoreBreakdown
          technical={technicalScore}
          seniority={seniorityScore}
          domain={domainScore}
          implicit={implicitScore}
        />
      </div>

      {/* Justification */}
      {scorecard.rankingJustification && (
        <div
          className="surface-elevated"
          style={{ padding: '16px', marginBottom: 20, borderLeft: '3px solid var(--color-primary)' }}
        >
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            {scorecard.rankingJustification}
          </p>
        </div>
      )}

      {/* Per-question answers */}
      {answers.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Answers
          </p>
          {answers.map((a) => (
            <div
              key={a.questionIndex}
              className="surface-elevated"
              style={{ padding: '14px 16px', marginBottom: 10 }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Q{a.questionIndex + 1}. {a.question || 'Question'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {a.summary || a.transcription || 'Processing…'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Follow-up questions */}
      {scorecard.followUpQuestions && scorecard.followUpQuestions.length > 0 && (
        <div>
          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Follow-up Questions
          </p>
          {scorecard.followUpQuestions.map((q, i) => (
            <div
              key={i}
              style={{
                borderLeft: '3px solid var(--color-primary)',
                paddingLeft: 12,
                marginBottom: 10,
                color: 'var(--color-text-secondary)',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {q}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
