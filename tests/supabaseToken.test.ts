import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';

const SECRET = 'segredo-de-teste-do-supabase';

async function loadModule() {
  // O modulo le process.env na chamada, entao basta reimportar.
  return await import('../lib/supabaseToken');
}

describe('supabaseToken', () => {
  const originalSecret = process.env.SUPABASE_JWT_SECRET;

  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.SUPABASE_JWT_SECRET;
    else process.env.SUPABASE_JWT_SECRET = originalSecret;
  });

  it('assina um token que o Postgres aceita como usuario autenticado', async () => {
    const { signSupabaseToken } = await loadModule();
    const token = signSupabaseToken('11111111-2222-3333-4444-555555555555', 'admin');

    const payload = jwt.verify(token, SECRET) as Record<string, unknown>;

    expect(payload.role).toBe('authenticated');
    expect(payload.aud).toBe('authenticated');
    expect(payload.sub).toBe('11111111-2222-3333-4444-555555555555');
  });

  it('guarda o papel interno do sistema em app_role', async () => {
    const { signSupabaseToken } = await loadModule();
    const payload = jwt.verify(signSupabaseToken('abc', 'prestador'), SECRET) as Record<string, unknown>;

    expect(payload.app_role).toBe('prestador');
  });

  it('gera token com validade curta', async () => {
    const { signSupabaseToken, DB_TOKEN_TTL_SECONDS, CLOCK_SKEW_TOLERANCE_SECONDS } = await loadModule();
    const payload = jwt.verify(signSupabaseToken('abc', 'staff'), SECRET) as { exp: number; iat: number };

    expect(payload.exp - payload.iat).toBe(DB_TOKEN_TTL_SECONDS + CLOCK_SKEW_TOLERANCE_SECONDS);
    expect(DB_TOKEN_TTL_SECONDS).toBeLessThanOrEqual(60 * 60);
  });

  it('emite o token no passado para tolerar relogio adiantado', async () => {
    // Sem essa folga o Postgres recusa com "JWT issued at future".
    const { signSupabaseToken, CLOCK_SKEW_TOLERANCE_SECONDS } = await loadModule();
    const agora = Math.floor(Date.now() / 1000);
    const payload = jwt.verify(signSupabaseToken('abc', 'admin'), SECRET) as { iat: number };

    expect(payload.iat).toBeLessThanOrEqual(agora - CLOCK_SKEW_TOLERANCE_SECONDS + 1);
    expect(CLOCK_SKEW_TOLERANCE_SECONDS).toBeGreaterThanOrEqual(60);
  });

  it('nao aceita token assinado com outro segredo', async () => {
    const { signSupabaseToken } = await loadModule();
    const token = signSupabaseToken('abc', 'admin');

    expect(() => jwt.verify(token, 'segredo-errado')).toThrow();
  });

  it('falha de forma clara quando o segredo nao esta configurado', async () => {
    delete process.env.SUPABASE_JWT_SECRET;
    const { signSupabaseToken, isSupabaseTokenConfigured } = await loadModule();

    expect(isSupabaseTokenConfigured()).toBe(false);
    expect(() => signSupabaseToken('abc', 'admin')).toThrow(/SUPABASE_JWT_SECRET/);
  });
});
