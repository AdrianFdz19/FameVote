import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'
import { redis } from '@/lib/redis';
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key-famvote-2026'
);

export async function POST(request: Request) {
  try {

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value; // Cambia 'auth_token' por el nombre exacto de tu cookie

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere inicio de sesión.' },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      // Extraer el userId del payload (puede estar en 'sub' o como 'userId')
      userId = (payload.userId || payload.sub) as string;

      if (!userId) {
        return NextResponse.json(
          { error: 'Token de sesión inválido.' },
          { status: 401 }
        );
      }
    } catch (authError) {
      console.error('Error verificando JWT con jose:', authError);
      return NextResponse.json(
        { error: 'Sesión expirada o token inválido.' },
        { status: 401 }
      );
    }

    // 3. Extraer únicamente candidateId del body (userId ya viene validado del servidor)
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

    // 5. Enviar evento a SQS a través de API Gateway
    const apiGatewayUrl = process.env.NEXT_PUBLIC_API_GATEWAY_VOTE_URL;

    if (apiGatewayUrl) {
      // Fire-and-forget o espera asíncrona no bloqueante
      fetch(apiGatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          candidateId,
          timestamp: new Date().toISOString(),
        }),
      }).catch((sqsError) => {
        // Log de error sin bloquear la respuesta de la UI al usuario
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