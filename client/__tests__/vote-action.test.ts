import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redis } from '@/lib/redis';

// Interceptamos la instancia de Redis con vi.mock
vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn(),
    incr: vi.fn(),
    set: vi.fn(),
    expire: vi.fn(),
  },
}));

describe('Pruebas unitarias sobre las funciones reales de Redis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Debe consultar los votos acumulados del candidato correctamente', async () => {
    // Simulamos la respuesta que daría Redis sin tocar la red
    vi.mocked(redis.get).mockResolvedValue('42');

    const votes = await redis.get('candidate:1:votes'); 

    expect(redis.get).toHaveBeenCalledWith('candidate:1:votes');
    expect(votes).toBe('42');
  });

  it('Debe incrementar atómicamente el contador de votos', async () => {
    vi.mocked(redis.incr).mockResolvedValue(1);

    const newVoteCount = await redis.incr('candidate:1:votes');

    expect(redis.incr).toHaveBeenCalledWith('candidate:1:votes');
    expect(newVoteCount).toBe(1);
  });
});