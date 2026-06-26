'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface NewJobModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewJobModal({ onClose, onSuccess }: NewJobModalProps) {
  const [title, setTitle] = useState('');
  const [jdText, setJdText] = useState('');
  const [threshold, setThreshold] = useState(70);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !jdText) {
      setError('Role title and job description are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/api/jobs', { title, jd_text: jdText, shortlist_threshold: threshold });
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create job.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="surface-elevated"
        style={{ width: '100%', maxWidth: 560, padding: '32px', borderRadius: 'var(--radius-xl)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Post a New Role</h2>
          <button
            id="new-job-modal-close"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', fontSize: 20 }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Role Title */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="job-title" style={{ display: 'block', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Role Title
            </label>
            <input
              id="job-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--color-bg-base)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {/* JD Text */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="job-jd" style={{ display: 'block', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Job Description
            </label>
            <textarea
              id="job-jd"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={8}
              placeholder="Paste the full job description here…"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--color-bg-base)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>

          {/* Threshold */}
          <div style={{ marginBottom: 24 }}>
            <label htmlFor="job-threshold" style={{ display: 'block', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Shortlist Threshold: <strong style={{ color: 'var(--color-primary)' }}>{threshold}%</strong>
            </label>
            <input
              id="job-threshold"
              type="range"
              min={50}
              max={90}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-primary)' }}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 16 }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button id="new-job-cancel" type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button id="new-job-submit" type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
              {loading ? 'Posting…' : 'Post Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
