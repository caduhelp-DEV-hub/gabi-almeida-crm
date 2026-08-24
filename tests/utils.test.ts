import { describe, it, expect } from 'vitest';
import { dataLocalISO } from '../lib/utils';

describe('dataLocalISO', () => {
  it('formata como AAAA-MM-DD', () => {
    expect(dataLocalISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('preenche mes e dia com zero a esquerda', () => {
    expect(dataLocalISO(new Date(2026, 8, 9))).toBe('2026-09-09');
  });

  it('nao vira o dia no fim da noite (o bug do toISOString)', () => {
    // 23h50 do dia 23. Em UTC-3 o toISOString devolveria o dia 24.
    const noite = new Date(2026, 7, 23, 23, 50, 0);
    expect(dataLocalISO(noite)).toBe('2026-08-23');
  });

  it('nao vira o dia na virada da manha', () => {
    const madrugada = new Date(2026, 7, 24, 0, 10, 0);
    expect(dataLocalISO(madrugada)).toBe('2026-08-24');
  });

  it('usa a data atual quando nao recebe argumento', () => {
    const hoje = new Date();
    expect(dataLocalISO()).toBe(dataLocalISO(hoje));
  });

  it('funciona na virada do ano', () => {
    expect(dataLocalISO(new Date(2026, 11, 31, 22, 0))).toBe('2026-12-31');
  });
});
