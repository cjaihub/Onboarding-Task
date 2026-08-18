'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register({
          username,
          email,
          first_name: firstName,
          last_name: lastName,
          password,
          password_confirm: passwordConfirm,
        });
      }
      router.replace('/');
    } catch (err) {
      setError((err as Error).message || 'Something went wrong');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--surface-base)' }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(220,38,38,0.05) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(220,38,38,0.03) 0%, transparent 50%)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}>
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            USALAMA
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>
            Engineering Operations Platform
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
        >
          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-red-600 to-red-400" />

          {/* Mode Tabs */}
          <div className="flex border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${
                  mode === m
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'border-b-2 border-transparent'
                }`}
                style={{ color: mode === m ? '#dc2626' : 'var(--text-muted)' }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl p-4 text-sm"
                style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#f87171' }}>
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Register-only fields */}
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                    className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-colors outline-none focus:ring-2 focus:ring-red-600"
                    style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    placeholder="Alice"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-colors outline-none focus:ring-2 focus:ring-red-600"
                    style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    placeholder="Smith"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-colors outline-none focus:ring-2 focus:ring-red-600"
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  placeholder="alice@company.com"
                />
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-colors outline-none focus:ring-2 focus:ring-red-600"
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                placeholder="alice"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full rounded-xl px-4 py-3 pr-12 text-sm font-medium transition-colors outline-none focus:ring-2 focus:ring-red-600"
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-colors outline-none focus:ring-2 focus:ring-red-600"
                  style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  placeholder="••••••••"
                />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black uppercase tracking-wider text-white transition-all shadow-lg mt-2"
              style={{ background: isPending ? '#991b1b' : '#dc2626' }}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            {/* Dev quick-fill */}
            {mode === 'login' && (
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <p className="text-xs text-center mb-2" style={{ color: 'var(--text-muted)' }}>
                  Dev accounts:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { user: 'alice', pass: 'Alice123!' },
                    { user: 'bob', pass: 'Bob12345!' },
                    { user: 'charlie', pass: 'Charlie1!' },
                  ].map(({ user, pass }) => (
                    <button
                      key={user}
                      type="button"
                      onClick={() => { setUsername(user); setPassword(pass); }}
                      className="rounded-lg py-1.5 text-xs font-bold transition-colors"
                      style={{ background: 'var(--surface-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                    >
                      {user}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Usalama Engineering · Internal Platform
        </p>
      </div>
    </div>
  );
}
