'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
        // Switch to sign in tab and show toast
        setIsSignUp(false);
        setToast({ message: 'Account created successfully! Please sign in.', type: 'success' });
      } else {
        await api.post('/api/auth/sign-in/email', { email, password });
        router.push('/');
      }
    } catch {
      setError(isSignUp ? 'Sign up failed. User may already exist.' : 'Invalid email or password.');
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
      if (res.url) {
        window.location.href = res.url;
      }
    } catch {
      setToast({ message: `Failed to connect with ${provider}. Check your API keys.`, type: 'error' });
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            🎯 TalentIQ
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
            AI-Powered Recruitment
          </p>
        </div>

        {/* Card */}
        <div className="surface-elevated" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
          
          {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 32, borderBottom: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setToast(null); }}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: !isSignUp ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: !isSignUp ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: !isSignUp ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setToast(null); }}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: isSignUp ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: isSignUp ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: isSignUp ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            Sign Up
          </button>
        </div>

          {toast && (
            <div style={{ 
              padding: '12px', 
              marginBottom: 16, 
              background: toast.type === 'success' ? 'rgba(52, 168, 83, 0.1)' : 'rgba(234, 67, 53, 0.1)', 
              borderLeft: `4px solid ${toast.type === 'success' ? '#34A853' : '#EA4335'}`, 
              color: toast.type === 'success' ? '#34A853' : '#EA4335', 
              borderRadius: '4px', 
              fontSize: 13 
            }}>
              {toast.message}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {isSignUp && (
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="login-name" style={{ display: 'block', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  id="login-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
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
            )}

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recruiter@company.com"
                autoComplete="email"
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

            <div style={{ marginBottom: 24 }}>
              <label htmlFor="login-password" style={{ display: 'block', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignUp ? "new-password" : "current-password"}
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

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 24 }}
              disabled={loading}
            >
              {loading ? (isSignUp ? 'Signing up…' : 'Signing in…') : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }}></div>
              <span style={{ margin: '0 12px', fontSize: 13, color: 'var(--color-text-secondary)' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }}></div>
            </div>

            <button
              type="button"
              onClick={() => handleSocialSignIn('google')}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                <path fill="#4285F4" d="M23.745 12.27c0-.825-.075-1.62-.21-2.385H12.15v4.515h6.51c-.285 1.47-1.11 2.715-2.385 3.555v2.94h3.855c2.25-2.07 3.615-5.13 3.615-8.625z" />
                <path fill="#34A853" d="M12.15 24c3.255 0 5.985-1.08 7.98-2.91l-3.855-2.94c-1.08.72-2.46 1.155-4.125 1.155-3.165 0-5.85-2.145-6.81-5.025H1.365v3.015C3.36 21.285 7.425 24 12.15 24z" />
                <path fill="#FBBC05" d="M5.34 14.28c-.24-.72-.375-1.485-.375-2.28s.135-1.56.375-2.28V6.705H1.365C.54 8.355 0 10.125 0 12s.54 3.645 1.365 5.295l3.975-3.015z" />
                <path fill="#EA4335" d="M12.15 4.695c1.77 0 3.36.615 4.605 1.8l3.435-3.435C18.12 1.155 15.39 0 12.15 0 7.425 0 3.36 2.715 1.365 6.705l3.975 3.015c.96-2.88 3.645-5.025 6.81-5.025z" />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleSocialSignIn('github')}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 8, color: 'var(--color-text-primary)' }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Continue with GitHub
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

