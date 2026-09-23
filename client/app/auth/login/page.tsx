'use client';

import Header from '@/app/components/header';
import React, { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      // Redirect to dashboard/voting page upon successful login
      window.location.href = '/';
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-rose-500 selection:text-white flex flex-col relative overflow-hidden">
      {/* 1. Header fixed at the top */}
      <Header />

      {/* 2. Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-rose-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none z-0" />

      {/* 3. Centered Main Section */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-rose-500/5">
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold tracking-wider uppercase mb-3">
              Priority Access
            </span>
            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-200 to-neutral-400">
              Sign In
            </h1>
            <p className="text-neutral-400 text-sm mt-2">
              Enter your credentials to continue and cast your votes.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm text-center font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full px-4 py-3 bg-neutral-950/80 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all duration-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-neutral-950/80 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all duration-200 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 shadow-md mt-2 ${
                !isLoading
                  ? 'bg-rose-600 hover:bg-rose-500 active:scale-95 text-white shadow-rose-600/20'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Authenticating...' : 'Sign In to FamVote'}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-neutral-500">
            Don't have an account yet?{' '}
            <a href="/auth/register" className="text-rose-400 hover:underline font-medium">
              Sign up here
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}