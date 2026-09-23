import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(request: Request) {
  try {
    const { userId, candidateId } = await request.json();

    if (!userId || !candidateId) {
      return NextResponse.json(
        { error: 'userId y candidateId son requeridos.' },
        { status: 400 }
      );
    }

    const cooldownKey = `cooldown:${userId}`;
    const votesLeftKey = `user:${userId}:votes_left`;
    const candidateVotesKey = `candidate:${candidateId}:votes`;

    // 1. Validar Cooldown (60 segundos)
    const hasCooldown = await redis.get(cooldownKey);
    if (hasCooldown) {
      const ttl = await redis.ttl(cooldownKey);
      return NextResponse.json(
        { error: `Debes esperar ${ttl} segundos antes de volver a votar.` },
        { status: 429 }
      );
    }

    // 2. Validar o Inicializar saldo de votos diarios (ej. 10 votos)
    let votesLeft = await redis.get(votesLeftKey);
    
    if (votesLeft === null) {
      // Primera vez en el día: se asignan 10 votos con un TTL de 24 horas (86400s)
      await redis.set(votesLeftKey, '10', 'EX', 86400);
      votesLeft = '10';
    }

    const remainingVotes = parseInt(votesLeft, 10);
    if (remainingVotes <= 0) {
      return NextResponse.json(
        { error: 'Has agotado tus votos diarios.' },
        { status: 400 }
      );
    }

    // 3. Descontar 1 voto al usuario y activar el Cooldown por 60s
    const newVotesLeft = await redis.decr(votesLeftKey);
    await redis.set(cooldownKey, 'active', 'EX', 10);

    // 4. Incrementar contador global en tiempo real para el candidato
    const totalCandidateVotes = await redis.incrby(candidateVotesKey, 1);

    // TODO: En el siguiente paso enviaremos este evento a AWS SQS para la persistencia masiva

    return NextResponse.json({
      success: true,
      message: '¡Voto registrado exitosamente!',
      votesLeft: newVotesLeft,
      candidateTotalVotes: totalCandidateVotes,
    });
  } catch (error) {
    console.error('Error procesando el voto en Redis:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}