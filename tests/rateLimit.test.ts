import { describe, it, expect, vi, afterEach } from 'vitest';
import { checkLimit, registerFailure, clearFailures, getClientIp } from '../lib/rateLimit';

const WINDOW = 15 * 60 * 1000;

afterEach(() => {
  vi.useRealTimers();
});

describe('checkLimit / registerFailure', () => {
  it('libera enquanto estiver abaixo do limite', () => {
    const key = 'teste:abaixo-do-limite';
    registerFailure(key, WINDOW);
    registerFailure(key, WINDOW);

    expect(checkLimit(key, 5).limited).toBe(false);
  });

  it('bloqueia ao atingir o limite de falhas', () => {
    const key = 'teste:atinge-limite';
    for (let i = 0; i < 5; i++) registerFailure(key, WINDOW);

    const status = checkLimit(key, 5);
    expect(status.limited).toBe(true);
    expect(status.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('nao bloqueia uma chave diferente', () => {
    const key = 'teste:chave-isolada';
    for (let i = 0; i < 10; i++) registerFailure(key, WINDOW);

    expect(checkLimit('teste:outra-chave', 5).limited).toBe(false);
  });

  it('libera novamente depois que a janela expira', () => {
    vi.useFakeTimers();
    const key = 'teste:janela-expira';
    for (let i = 0; i < 5; i++) registerFailure(key, WINDOW);
    expect(checkLimit(key, 5).limited).toBe(true);

    vi.advanceTimersByTime(WINDOW + 1000);
    expect(checkLimit(key, 5).limited).toBe(false);
  });
});

describe('clearFailures', () => {
  it('zera o contador apos login bem-sucedido', () => {
    const key = 'teste:limpa-contador';
    for (let i = 0; i < 5; i++) registerFailure(key, WINDOW);
    expect(checkLimit(key, 5).limited).toBe(true);

    clearFailures(key);
    expect(checkLimit(key, 5).limited).toBe(false);
  });
});

describe('getClientIp', () => {
  it('usa o primeiro endereco de x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' });
    expect(getClientIp(headers)).toBe('203.0.113.5');
  });

  it('cai para x-real-ip quando nao ha x-forwarded-for', () => {
    const headers = new Headers({ 'x-real-ip': '198.51.100.7' });
    expect(getClientIp(headers)).toBe('198.51.100.7');
  });

  it('devolve "desconhecido" quando nao ha cabecalho de IP', () => {
    expect(getClientIp(new Headers())).toBe('desconhecido');
  });
});
