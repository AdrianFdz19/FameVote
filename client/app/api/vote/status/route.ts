import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redis } from '@/lib/redis';

if (!process.env.JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not defined.');
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    /* console.log(token); */

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const cooldownKey = `cooldown:${userId}`;
    const votesLeftKey = `user:${userId}:votes_left`;

    // Consultamos Redis en paralelo
    const [hasCooldown, ttl] = await Promise.all([
      redis.get(cooldownKey),
      redis.ttl(cooldownKey)
    ]);

    let prevVotesLeft = await redis.get(votesLeftKey);

    if (prevVotesLeft === null) {
      // Primera vez en el día: se asignan 10 votos con un TTL de 24 horas (86400s)
      await redis.set(votesLeftKey, '10', 'EX', 86400);
      prevVotesLeft = '10';
    }

    const votesLeft = prevVotesLeft !== null ? parseInt(prevVotesLeft, 10) : 10;

    console.log(votesLeft);

    return NextResponse.json({
      userId,
      votesLeft,
      cooldownTime: hasCooldown && ttl > 0 ? ttl : 0,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }
}