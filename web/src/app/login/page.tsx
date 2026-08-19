'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import Image from 'next/image';

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
    <div className="min-h-screen flex w-full bg-slate-900">
      
      {/* Left Side - Graphic / Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 overflow-hidden flex-col justify-between items-start p-12">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 0% 0%, rgba(220, 38, 38, 0.15) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(220, 38, 38, 0.05) 0%, transparent 50%)'
        }}></div>
        
        {/* Abstract shapes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-2xl font-black tracking-tight">USALAMA</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="text-5xl font-bold text-white leading-tight">
            Engineering Operations <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">Elevated.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Manage projects, automate workflows, and track work items in a secure, beautiful environment designed for elite engineering teams.
          </p>
        </div>

        <div className="relative z-10 text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Usalama Platform. All rights reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 pointer-events-none lg:hidden" style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(220, 38, 38, 0.05) 0%, transparent 70%)'
        }}></div>

        <div className="w-full max-w-md relative z-10">
          
          <div className="lg:hidden flex flex-col items-center mb-8">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20 mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">USALAMA</h1>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl overflow-hidden p-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-slate-400 text-sm mb-8">
              {mode === 'login' ? 'Enter your details to access your workspace.' : 'Sign up to join your team\'s workspace.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 rounded-xl p-4 text-sm bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2 text-slate-400">FIRST NAME</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      required
                      className="w-full rounded-xl px-4 py-3 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                      placeholder="Alice"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2 text-slate-400">LAST NAME</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                      placeholder="Smith"
                    />
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold mb-2 text-slate-400">EMAIL</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl px-4 py-3 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    placeholder="alice@company.com"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-2 text-slate-400">USERNAME</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full rounded-xl px-4 py-3 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  placeholder="alice"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-slate-400">PASSWORD</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full rounded-xl px-4 py-3 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold mb-2 text-slate-400">CONFIRM PASSWORD</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full rounded-xl px-4 py-3 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center disabled:opacity-70"
              >
                {isPending && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>

            {mode === 'login' && (
              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <p className="text-xs text-center text-slate-500 font-medium mb-3">QUICK DEV LOGIN</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { user: 'alice', pass: 'Alice123!' },
                    { user: 'bob', pass: 'Bob12345!' },
                    { user: 'charlie', pass: 'Charlie1!' },
                  ].map(({ user, pass }) => (
                    <button
                      key={user}
                      type="button"
                      onClick={() => { setUsername(user); setPassword(pass); }}
                      className="py-2 text-xs font-bold bg-slate-900 border border-slate-700 text-slate-400 rounded-lg hover:text-white hover:border-slate-500 transition-colors"
                    >
                      {user}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
