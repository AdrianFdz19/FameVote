'use client';

import React, { useState, useEffect } from 'react';

interface Participant {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  votes: number;
}

const INITIAL_PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Elena Rostova', role: 'La Estratega', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80', votes: 1420 },
  { id: '2', name: 'Marcus Vance', role: 'El Competidor', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80', votes: 980 },
  { id: '3', name: 'Sofia Chen', role: 'La Pacifista', imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&q=80', votes: 2150 },
  { id: '4', name: 'Mateo Silva', role: 'El Carismático', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80', votes: 1730 },
  { id: '5', name: 'Aria Taylor', role: 'La Impredecible', imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&q=80', votes: 890 },
];

export default function VotingPage() {
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_PARTICIPANTS);
  const [votesLeft, setVotesLeft] = useState<number>(10);
  const [votedId, setVotedId] = useState<string | null>(null);
  const [cooldownTime, setCooldownTime] = useState<number>(0);

  // Efecto para manejar el conteo regresivo de 5 segundos
  useEffect(() => {
    if (cooldownTime <= 0) return;

    const timer = setInterval(() => {
      setCooldownTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownTime]);

  const handleVote = (id: string) => {
    // Si no quedan votos o está en cooldown, no hace nada
    if (votesLeft <= 0 || cooldownTime > 0) return;

    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, votes: p.votes + 1 } : p))
    );
    setVotesLeft((prev) => prev - 1);
    
    // Inicia el delay de 5 segundos
    setCooldownTime(5);

    // Feedback visual de click en la tarjeta
    setVotedId(id);
    setTimeout(() => setVotedId(null), 600)
  };

  const isButtonDisabled = votesLeft === 0 || cooldownTime > 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-rose-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-rose-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <header className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold tracking-wider uppercase mb-4">
            Gran Final • Votación En Vivo
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-200 to-neutral-400 mb-4">
            ¿Quién debe salvarse esta semana?
          </h1>
          <p className="text-neutral-400 text-base sm:text-lg">
            Apoya a tu participante favorito. Tienes un límite de votos diarios para mantener la competencia justa.
          </p>
        </header>

        {/* Counter Badge */}
        <div className="sticky top-6 z-20 flex justify-center mb-10">
          <div className="flex items-center gap-3 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 px-6 py-3 rounded-full shadow-2xl">
            <span className="text-sm font-medium text-neutral-300">Votos disponibles:</span>
            <span className={`text-lg font-bold px-2.5 py-0.5 rounded-full ${votesLeft > 0 ? 'bg-rose-500 text-white' : 'bg-neutral-800 text-neutral-500'}`}>
              {votesLeft}
            </span>
          </div>
        </div>

        {/* Grid de Participantes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {participants.map((participant) => {
            const isJustVoted = votedId === participant.id;
            return (
              <div
                key={participant.id}
                className={`group relative bg-neutral-900/50 border border-neutral-800 hover:border-rose-500/50 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-rose-500/10 ${
                  isJustVoted ? 'scale-95 border-rose-500' : 'scale-100'
                }`}
              >
                {/* Image Container */}
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-800">
                  <img
                    src={participant.imageUrl}
                    alt={participant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-80" />
                  
                  {/* Badge Role */}
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
                    <p className="text-sm text-neutral-400 mt-1 font-mono">
                      {participant.votes.toLocaleString()} votos acumulados
                    </p>
                  </div>

                  <button
                    onClick={() => handleVote(participant.id)}
                    disabled={isButtonDisabled}
                    className={`mt-6 w-full py-3 px-4 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 shadow-md ${
                      !isButtonDisabled
                        ? 'bg-rose-600 hover:bg-rose-500 active:scale-95 text-white shadow-rose-600/20'
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    {votesLeft === 0
                      ? 'Sin Votos'
                      : cooldownTime > 0
                      ? `Espera ${cooldownTime}s...`
                      : 'Votar Ahora'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}