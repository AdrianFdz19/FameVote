import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key-famvote-2026'
);

export async function POST(request: Request) {
  try {
    // 1. Validar Token JWT desde la Cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere inicio de sesión.' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userId = (payload.userId || payload.sub) as string;

      if (!userId) {
        return NextResponse.json(
          { error: 'Token de sesión inválido.' },
          { status: 401 }
        );
      }
    } catch (authError) {
      return NextResponse.json(
        { error: 'Sesión expirada o token inválido.' },
        { status: 401 }
      );
    }

    const { candidateId } = await request.json();
    if (!candidateId) {
      return NextResponse.json(
        { error: 'candidateId es requerido.' },
        { status: 400 }
      );
    }

    const cooldownKey = `cooldown:${userId}`;
    const votesLeftKey = `user:${userId}:votes_left`;
    const candidateVotesKey = `candidate:${candidateId}:votes`;

    // 2. APLICAR COOLDOWN ATÓMICO (Bloquea race conditions instantáneamente)
    // 'NX' = Solo crea la clave si NO existe.
    // 'EX', 10 = Expiración en 10 segundos.
    const acquiredLock = await redis.set(cooldownKey, 'active', 'EX', 10, 'NX');

    if (!acquiredLock) {
      const ttl = await redis.ttl(cooldownKey);
      return NextResponse.json(
        { error: `Debes esperar ${ttl} segundos antes de volver a votar.` },
        { status: 429 }
      );
    }

    // 3. Validar / Inicializar saldo de votos diarios
    let votesLeft = await redis.get(votesLeftKey);

    if (votesLeft === null) {
      await redis.set(votesLeftKey, '10', 'EX', 86400);
      votesLeft = '10';
    }

    const remainingVotes = parseInt(votesLeft, 10);
    if (remainingVotes <= 0) {
      // Liberamos el cooldown si la operación falló por falta de votos
      await redis.del(cooldownKey);
      return NextResponse.json(
        { error: 'Has agotado tus votos diarios.' },
        { status: 400 }
      );
    }

    // 4. PIPELINE: Restar voto al usuario e incrementar candidato en UN solo viaje de red
    const pipeline = redis.pipeline();
    pipeline.decr(votesLeftKey);
    pipeline.incrby(candidateVotesKey, 1);

    const results = await pipeline.exec();

    // TypeScript Check: Validar que results no sea null
    if (!results) {
      throw new Error('Falló la ejecución del pipeline en Redis.');
    }

    const [decrErr, decrRes] = results[0];
    const [incrErr, incrRes] = results[1];

    if (decrErr || incrErr) {
      throw new Error('Error al procesar comandos dentro del pipeline de Redis.');
    }

    const newVotesLeft = decrRes as number;
    const totalCandidateVotes = incrRes as number;

    // 5. Enviar evento a API Gateway / SQS (Asíncrono)
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_VOTE_URL;
    if (apiGatewayUrl) {
      fetch(apiGatewayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          candidateId,
          timestamp: new Date().toISOString(),
        }),
      }).catch((sqsError) => {
        console.error('Error enviando evento a API Gateway / SQS:', sqsError);
      });
    }

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