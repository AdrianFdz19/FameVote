'use client';

import React, { useState, useEffect } from 'react';
import Header from '../components/header';

interface Participant {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  votes: number;
}

const INITIAL_PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Elena Rostova', role: 'The Strategist', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80', votes: 1420 },
  { id: '2', name: 'Marcus Vance', role: 'The Competitor', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80', votes: 980 },
  { id: '3', name: 'Sofia Chen', role: 'The Peacemaker', imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&q=80', votes: 2150 },
  { id: '4', name: 'Mateo Silva', role: 'The Charismatic', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80', votes: 1730 },
  { id: '5', name: 'Aria Taylor', role: 'The Wildcard', imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&q=80', votes: 890 },
];

export default function VotingPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_PARTICIPANTS);
  const [votesLeft, setVotesLeft] = useState<number>(10);
  const [votedId, setVotedId] = useState<string | null>(null);
  const [cooldownTime, setCooldownTime] = useState<number>(0);
  const [animateBadge, setAnimateBadge] = useState<boolean>(false);
  const [isModalDismissed, setIsModalDismissed] = useState<boolean>(false);

  // 1. Initial useEffect: Validates cookie and initializes state from Redis
  useEffect(() => {
    async function initUserSession() {
      try {
        const statusRes = await fetch('/api/vote/status');

        if (!statusRes.ok) return;

        const statusData = await statusRes.json();
        setUserId(statusData.userId);
        setVotesLeft(statusData.votesLeft);
        setCooldownTime(statusData.cooldownTime);
      } catch (err) {
        console.error('Failed to initialize session:', err);
      }
    }

    initUserSession();
  }, []);

  // 2. Cooldown Countdown Timer
  useEffect(() => {
    if (cooldownTime <= 0) return;

    const timer = setInterval(() => {
      setCooldownTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownTime]);

  // 3. Vote Handler
  const handleVote = async (candidateId: string) => {
    if (!userId || votesLeft <= 0) return;

    try {
      setVotedId(candidateId);
      setAnimateBadge(true);

      const response = await fetch(`/api/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, candidateId }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to submit vote');
        setVotedId(null);
        setAnimateBadge(false);
        return;
      }

      setVotesLeft(data.votesLeft);
      setCooldownTime(10);

      if (data.candidateTotalVotes) {
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === candidateId ? { ...p, votes: data.candidateTotalVotes } : p
          )
        );
      }

      setTimeout(() => {
        setVotedId(null);
        setAnimateBadge(false);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setVotedId(null);
      setAnimateBadge(false);
    }
  };

  const isButtonDisabled = votesLeft === 0 || cooldownTime > 0 || !userId;
  const showCompletionModal = votesLeft === 0 && !isModalDismissed;

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-rose-500 selection:text-white relative overflow-x-hidden">
      {/* Dynamic Keyframes */}
      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(0.8); }
          50% { opacity: 1; transform: translateY(-40px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-80px) scale(1); }
        }
        .animate-float-up {
          animation: floatUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-rose-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

      <Header />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <header className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold tracking-wider uppercase mb-4">
            Grand Finale • Live Voting
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-200 to-neutral-400 mb-4">
            Who should be saved this week?
          </h1>
          <p className="text-neutral-400 text-base sm:text-lg">
            Support your favorite participant. Daily vote limits are enforced to keep the competition fair.
          </p>
        </header>

        {/* Counter Badge */}
        <div className="sticky top-20 z-20 flex justify-center mb-8">
          <div className={`flex items-center gap-3 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 px-6 py-3 rounded-full shadow-2xl transition-transform duration-300 ${animateBadge ? 'scale-110 border-rose-500/50 shadow-rose-500/20' : 'scale-100'
            }`}>
            <span className="text-sm font-medium text-neutral-300">Votes remaining:</span>
            <span className={`text-lg font-bold px-2.5 py-0.5 rounded-full transition-all duration-300 ${votesLeft > 0 ? 'bg-rose-500 text-white' : 'bg-neutral-800 text-neutral-500'
              }`}>
              {votesLeft}
            </span>
          </div>
        </div>

        {/* Participants Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {participants.map((participant) => {
            const isJustVoted = votedId === participant.id;

            return (
              <div
                key={participant.id}
                className={`group relative bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-rose-500/10 ${isJustVoted
                    ? 'scale-105 border-rose-500 ring-2 ring-rose-500/50 shadow-2xl shadow-rose-500/20'
                    : 'scale-100 hover:border-rose-500/50'
                  }`}
              >
                {/* Floating Burst Particles */}
                {isJustVoted && (
                  <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
                    <span className="animate-float-up absolute text-rose-500 font-black text-3xl drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]">
                      +1 VOTE!
                    </span>
                    <span className="animate-float-up absolute text-rose-400 text-2xl -translate-x-12 -translate-y-4 delay-100">
                      ❤️
                    </span>
                    <span className="animate-float-up absolute text-rose-400 text-2xl translate-x-12 -translate-y-2 delay-200">
                      🔥
                    </span>
                  </div>
                )}

                {/* Image Container */}
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-800">
                  <img
                    src={participant.imageUrl}
                    alt={participant.name}
                    className={`w-full h-full object-cover transition-transform duration-500 ${isJustVoted ? 'scale-110 brightness-110' : 'group-hover:scale-105'
                      }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-80" />

                  {/* Role Badge */}
                  <span className="absolute top-3 left-3 bg-neutral-950/80 backdrop-blur-md text-neutral-300 text-xs font-medium px-2.5 py-1 rounded-md border border-neutral-800">
                    {participant.role}
                  </span>
                </div>

                {/* Info & Action */}
                <div className="p-5 flex flex-col flex-grow justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-wide group-hover:text-rose-400 transition-colors">
                      {participant.name}
                    </h3>
                    <p className={`text-sm mt-1 font-mono transition-colors duration-300 ${isJustVoted ? 'text-rose-400 font-bold' : 'text-neutral-400'
                      }`}>
                      {participant.votes.toLocaleString()} total votes
                    </p>
                  </div>

                  <button
                    onClick={() => handleVote(participant.id)}
                    disabled={isButtonDisabled}
                    className={`mt-6 w-full py-3 px-4 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 shadow-md ${isJustVoted
                        ? 'bg-emerald-600 text-white scale-95 shadow-emerald-600/30'
                        : !isButtonDisabled
                          ? 'bg-rose-600 hover:bg-rose-500 active:scale-95 text-white shadow-rose-600/20'
                          : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      }`}
                  >
                    {!userId
                      ? 'Loading...'
                      : isJustVoted
                        ? 'Voted! ✓'
                        : votesLeft === 0
                          ? 'Votes Exhausted'
                          : cooldownTime > 0
                            ? `Wait ${cooldownTime}s...`
                            : 'Vote Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* OVERLAY MODAL */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/90 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 p-8 sm:p-12 shadow-2xl relative">

            {/* Minimal Header Line */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
              <span className="text-xs font-mono uppercase tracking-widest text-rose-500">
                Session Complete
              </span>
              <span className="text-xs font-mono text-neutral-500">
                STATUS: 200 OK
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Daily Limit Reached
            </h2>

            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed mb-8">
              Thank you for participating. All your allocated daily votes have been successfully recorded on the ledger. Final results will be presented tonight during the broadcast.
            </p>

            {/* Broadcast Schedule Card */}
            <div className="bg-neutral-950 border border-neutral-800 p-4 mb-8 grid grid-cols-2 gap-4 text-left font-mono text-xs">
              <div>
                <span className="text-neutral-500 block mb-1 uppercase">Live Stream:</span>
                <span className="text-white font-bold">21:00 EST / 18:00 PST</span>
              </div>
              <div>
                <span className="text-neutral-500 block mb-1 uppercase">Poll Status:</span>
                <span className="text-emerald-400 font-bold">Processing Stream</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setIsModalDismissed(true)}
                className="w-full sm:w-auto flex-1 bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs uppercase tracking-wider py-3.5 px-6 transition-colors"
              >
                Review Votes
              </button>
              <a
                href="/"
                className="w-full sm:w-auto flex-1 text-center bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono text-xs uppercase tracking-wider py-3.5 px-6 transition-colors border border-neutral-700"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}