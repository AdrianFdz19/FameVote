'use client';

import React from 'react';
import Header from '@/app/components/header';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';
import useSWR from 'swr';

const fetcher = ( url: string ) => fetch(url).then(res => res.json());

export default function HomePage() {

  const { isAuthenticated } = useAuth();

  const { data, error, isLoading } = useSWR('/api/votes/results', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  });

  let totalVotes;

  if (isLoading) {
    totalVotes = <p>Loading...</p>
  } else if (data) {
    totalVotes = <p>{data.totalVotes}</p>
  } else if (error) {
    totalVotes = <p>Error trying fetching the total votes</p>
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-rose-500 selection:text-white relative">
      <Header />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto pt-8 pb-16 border-b border-neutral-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-mono tracking-wider uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Live Event • Season 2026
          </div>

          <h1 className="text-4xl sm:text-7xl font-bold tracking-tight text-white mb-6 uppercase">
            Decide Who Stays. <br />
            <span className="text-neutral-500">Shape The Finale.</span>
          </h1>

          <p className="text-neutral-400 text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
            The ultimate community-driven voting platform. Cast your daily votes in real time, support your favorite contenders, and follow the live leaderboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/vote"
                className="w-full sm:w-auto bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs uppercase tracking-wider py-4 px-8 transition-colors border border-white"
              >
                Cast Your Vote
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-mono text-xs uppercase tracking-wider py-4 px-8 transition-colors border border-neutral-800"
              >
                Sign In to Account
              </Link>
            )}
          </div>
        </section>

        {/* METRICS & STATUS BAR */}
        <section className="py-12 border-b border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="bg-neutral-900/50 border border-neutral-800 p-6">
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-500 block mb-2">
              Active Voters
            </span>
            <span className="text-3xl font-mono font-bold text-white">
              125000
            </span>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 p-6">
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-500 block mb-2">
              Total Votes Cast
            </span>
            <span className="text-3xl font-mono font-bold text-rose-500">{ totalVotes }</span>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 p-6">
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-500 block mb-2">
              Next Live Broadcast
            </span>
            <span className="text-3xl font-mono font-bold text-white">21:00 EST</span>
          </div>
        </section>

        {/* HOW IT WORKS / RULES */}
        <section className="py-16">
          <div className="mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-rose-500 block mb-2">
              Protocol Rules
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              How FamVote Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-neutral-800 p-6 bg-neutral-900/30">
              <span className="text-xs font-mono text-neutral-500 block mb-4">01 // AUTHENTICATION</span>
              <h3 className="text-lg font-bold text-white mb-2">Verified Voting</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Log in to claim your daily vote quota. One authenticated session guarantees a fair and fraud-free voting process.
              </p>
            </div>

            <div className="border border-neutral-800 p-6 bg-neutral-900/30">
              <span className="text-xs font-mono text-neutral-500 block mb-4">02 // RATE LIMITING</span>
              <h3 className="text-lg font-bold text-white mb-2">Daily Quotas & Cooldowns</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Every user gets 10 votes per day with enforced cooldown intervals between casts to prevent automated spamming.
              </p>
            </div>

            <div className="border border-neutral-800 p-6 bg-neutral-900/30">
              <span className="text-xs font-mono text-neutral-500 block mb-4">03 // LIVE BROADCAST</span>
              <h3 className="text-lg font-bold text-white mb-2">Nightly Results</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Polls lock ahead of the evening live stream. Tally totals are calculated and revealed live during the show.
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="mt-8 bg-neutral-900 border border-neutral-800 p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Ready to support your participant?
            </h3>
            <p className="text-neutral-400 text-sm font-mono">
              Voting lines are open now. Daily limits reset every midnight UTC.
            </p>
          </div>
          <Link
            href="/vote"
            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs uppercase tracking-wider py-4 px-8 transition-colors shrink-0 text-center"
          >
            Enter Voting Booth
          </Link>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-neutral-800 mt-20 py-8 text-center font-mono text-xs text-neutral-600">
        FamVote Engine • All Rights Reserved © 2026
      </footer>
    </div>
  );
}