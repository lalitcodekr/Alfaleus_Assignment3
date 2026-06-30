'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      if (isSignUp) {
        await api.post('/api/auth/sign-up/email', { email, password, name });
        setIsSignUp(false);
        setToast({ message: '✓ Account created! Please sign in.', type: 'success' });
      } else {
        await api.post('/api/auth/sign-in/email', { email, password });
        router.push('/');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '';
      setToast({
        message: errorMessage && !errorMessage.startsWith('Request failed') ? errorMessage : (isSignUp ? 'Sign up failed.' : 'Invalid email or password.'),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialSignIn(provider: 'google' | 'github') {
    try {
      const res = await api.post<{ url: string }>('/api/auth/sign-in/social', {
        provider,
        callbackURL: window.location.origin,
      });
      if (res.url) window.location.href = res.url;
    } catch {
      setToast({ message: `Failed to connect with ${provider}.`, type: 'error' });
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s ease',
    fontFamily: 'var(--font-body)',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative orbs */}
      <div style={{
        position: 'fixed', top: '20%', left: '10%', width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(255,90,0,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '20%', right: '10%', width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(255,90,0,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 'var(--radius-lg)',
            background: 'var(--color-primary)', fontSize: 26, marginBottom: 16,
            boxShadow: '0 0 32px var(--color-primary-glow)',
          }}>
            🎯
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 6, letterSpacing: '-0.02em' }}>
            TalentIQ
          </h1>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 14 }}>
            AI-Powered Recruitment Platform
          </p>
        </div>

        {/* Card */}
        <div className="surface-elevated" style={{ padding: '36px', borderRadius: 'var(--radius-xl)' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: 28, background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', padding: 4 }}>
            {['Sign In', 'Sign Up'].map((tab) => {
              const active = tab === 'Sign In' ? !isSignUp : isSignUp;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => { setIsSignUp(tab === 'Sign Up'); setToast(null); }}
                  style={{
                    flex: 1, padding: '10px 0', background: active ? 'var(--color-bg-elevated)' : 'transparent',
                    border: active ? '1px solid var(--color-border)' : '1px solid transparent',
                    borderRadius: 'var(--radius-sm)',
                    color: active ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                    fontWeight: active ? 600 : 400, cursor: 'pointer', fontSize: 14,
                    transition: 'all 0.2s ease', fontFamily: 'var(--font-body)',
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Toast */}
          {toast && (
            <div style={{
              padding: '12px 16px', marginBottom: 20,
              background: toast.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
              borderRadius: 'var(--radius-md)', fontSize: 13,
            }}>
              {toast.message}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {isSignUp && (
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="login-name" style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Full Name
                </label>
                <input
                  id="login-name" type="text" value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                id="login-email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recruiter@company.com"
                autoComplete="email"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label htmlFor="login-password" style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Password
              </label>
              <input
                id="login-password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            <button
              id="login-submit" type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, borderRadius: 'var(--radius-md)', fontWeight: 600 }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
                  {isSignUp ? 'Creating account…' : 'Signing in…'}
                </span>
              ) : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              <span style={{ margin: '0 16px', fontSize: 12, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button" onClick={() => handleSocialSignIn('google')}
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: 'center', padding: '12px', borderRadius: 'var(--radius-md)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path fill="#4285F4" d="M23.745 12.27c0-.825-.075-1.62-.21-2.385H12.15v4.515h6.51c-.285 1.47-1.11 2.715-2.385 3.555v2.94h3.855c2.25-2.07 3.615-5.13 3.615-8.625z" />
                  <path fill="#34A853" d="M12.15 24c3.255 0 5.985-1.08 7.98-2.91l-3.855-2.94c-1.08.72-2.46 1.155-4.125 1.155-3.165 0-5.85-2.145-6.81-5.025H1.365v3.015C3.36 21.285 7.425 24 12.15 24z" />
                  <path fill="#FBBC05" d="M5.34 14.28c-.24-.72-.375-1.485-.375-2.28s.135-1.56.375-2.28V6.705H1.365C.54 8.355 0 10.125 0 12s.54 3.645 1.365 5.295l3.975-3.015z" />
                  <path fill="#EA4335" d="M12.15 4.695c1.77 0 3.36.615 4.605 1.8l3.435-3.435C18.12 1.155 15.39 0 12.15 0 7.425 0 3.36 2.715 1.365 6.705l3.975 3.015c.96-2.88 3.645-5.025 6.81-5.025z" />
                </svg>
                Google
              </button>
              <button
                type="button" onClick={() => handleSocialSignIn('github')}
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: 'center', padding: '12px', borderRadius: 'var(--radius-md)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                GitHub
              </button>
            </div>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--color-text-tertiary)' }}>
          Secure sign-in powered by TalentIQ
        </p>
      </div>
    </div>
  );
}

