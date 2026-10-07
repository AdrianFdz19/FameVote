import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/vote/route';
import { redis } from '@/lib/redis';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// 1. Mocks de dependencias externas
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({
  redis: {
    set: vi.fn(),
    ttl: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    pipeline: vi.fn(),
  },
}));

// 2. Mockear 'jose' para evitar problemas de compatibilidad con WebCrypto / Uint8Array en Vitest
vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}));

describe('POST /api/vote - FamVote Real API Route Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Debe retornar 401 si no hay cookie auth_token', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const request = new Request('http://localhost:3000/api/vote', {
      method: 'POST',
      body: JSON.stringify({ candidateId: 'candidate-1' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('No autorizado');
  });

  it('Debe retornar 400 si falta candidateId en el body', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'fake-jwt-token' }),
    } as any);

    // Simulamos que jwtVerify autentica con éxito al usuario
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: { userId: 'user-123' },
      protectedHeader: { alg: 'HS256' },
    } as any);

    const request = new Request('http://localhost:3000/api/vote', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('candidateId es requerido');
  });

  it('Debe retornar 429 si el cooldown está activo (Bloqueo de Race Condition)', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'fake-jwt-token' }),
    } as any);

    vi.mocked(jwtVerify).mockResolvedValue({
      payload: { userId: 'user-123' },
      protectedHeader: { alg: 'HS256' },
    } as any);

    // Redis SET 'NX' retorna null si el lock ya existe
    vi.mocked(redis.set).mockResolvedValue(null as any);
    vi.mocked(redis.ttl).mockResolvedValue(7);

    const request = new Request('http://localhost:3000/api/vote', {
      method: 'POST',
      body: JSON.stringify({ candidateId: 'candidate-1' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('Debes esperar 7 segundos');
    expect(redis.set).toHaveBeenCalledWith('cooldown:user-123', 'active', 'EX', 10, 'NX');
  });

  it('Debe registrar el voto exitosamente (200) y ejecutar el pipeline', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'fake-jwt-token' }),
    } as any);

    vi.mocked(jwtVerify).mockResolvedValue({
      payload: { userId: 'user-123' },
      protectedHeader: { alg: 'HS256' },
    } as any);

    vi.mocked(redis.set)
      .mockResolvedValueOnce('OK' as any)
      .mockResolvedValueOnce('OK' as any);

    vi.mocked(redis.get).mockResolvedValue('10');

    const mockPipeline = {
      decr: vi.fn(),
      incrby: vi.fn(),
      exec: vi.fn().mockResolvedValue([
        [null, 9],
        [null, 42],
      ]),
    };
    vi.mocked(redis.pipeline).mockReturnValue(mockPipeline as any);

    const request = new Request('http://localhost:3000/api/vote', {
      method: 'POST',
      body: JSON.stringify({ candidateId: 'candidate-1' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.votesLeft).toBe(9);
    expect(data.candidateTotalVotes).toBe(42);

    expect(mockPipeline.decr).toHaveBeenCalledWith('user:user-123:votes_left');
    expect(mockPipeline.incrby).toHaveBeenCalledWith('candidate:candidate-1:votes', 1);
  });
});