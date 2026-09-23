'use client';

import React, { useState, useEffect } from 'react';

interface HeaderProps {
  userId?: string | null;
  onLogoutSuccess?: () => void;
}

export default function Header({ userId: initialUserId, onLogoutSuccess }: HeaderProps) {
  const [userId, setUserId] = useState<string | null>(initialUserId || null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(!initialUserId);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // Sync state if initialUserId changes externally
  useEffect(() => {
    if (initialUserId) {
      setUserId(initialUserId);
      setIsCheckingAuth(false);
    }
  }, [initialUserId]);

  // Check auth session automatically if no prop was provided
  useEffect(() => {
    if (initialUserId) return;

    async function checkAuthSession() {
      try {
        const res = await fetch('/api/vote/status');
        if (res.ok) {
          const data = await res.json();
          if (data.userId) {
            setUserId(data.userId);
          }
        }
      } catch (err) {
        console.error('Failed to verify session status:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkAuthSession();
  }, [initialUserId]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        setUserId(null);
        if (onLogoutSuccess) {
          onLogoutSuccess();
        } else {
          window.location.href = '/auth/login';
        }
      } else {
        console.error('Failed to log out');
      }
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isAuthenticated = Boolean(userId);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Status Indicator */}
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-rose-600/30 group-hover:scale-105 transition-transform duration-200">
              F
            </div>
            <span className="font-bold text-lg tracking-tight text-white group-hover:text-rose-400 transition-colors">
              Fam<span className="text-rose-500">Vote</span>
            </span>
          </a>

          {/* Live Badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Event
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {isCheckingAuth ? (
            /* Loading Skeleton */
            <div className="h-8 w-24 bg-neutral-900 border border-neutral-800 rounded-xl animate-pulse" />
          ) : isAuthenticated ? (
            /* LOGGED IN DISPLAY */
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="max-w-[120px] truncate">{userId}</span>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <span>Signing out...</span>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Sign Out</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* LOGGED OUT DISPLAY */
            <div className="flex items-center gap-3">
              <a
                href="/auth/login"
                className="text-xs font-semibold text-neutral-300 hover:text-white transition-colors px-3 py-2"
              >
                Sign In
              </a>
              <a
                href="/auth/register"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold tracking-wide shadow-md shadow-rose-600/20 transition-all duration-200 active:scale-95"
              >
                Get Started
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}