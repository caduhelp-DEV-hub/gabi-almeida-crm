import { describe, it, expect } from 'vitest';
import { janelaDoDia, cabeNoExpediente, jaPassou } from '../lib/horarioAtendimento';

describe('jaPassou', () => {
  // 10/10/2026 15:30 em Sao Paulo (UTC-3) = 18:30 UTC.
  const agora = new Date('2026-10-10T18:30:00Z');

  it('dias anteriores ja passaram, dias futuros nao', () => {
    expect(jaPassou('2026-10-09', '17:00', agora)).toBe(true);
    expect(jaPassou('2026-10-11', '08:00', agora)).toBe(false);
  });

  it('hoje: horario anterior ou igual a agora passou, posterior nao', () => {
    expect(jaPassou('2026-10-10', '09:30', agora)).toBe(true);
    expect(jaPassou('2026-10-10', '15:30', agora)).toBe(true);
    expect(jaPassou('2026-10-10', '16:00', agora)).toBe(false);
    expect(jaPassou('2026-10-10', '16:00:00', agora)).toBe(false);
  });

  it('usa o fuso de Sao Paulo: 02:00 UTC de 11/10 ainda e 23:00 de 10/10', () => {
    const tarde = new Date('2026-10-11T02:00:00Z');
    expect(jaPassou('2026-10-10', '22:00', tarde)).toBe(true);
    expect(jaPassou('2026-10-10', '23:30', tarde)).toBe(false);
    expect(jaPassou('2026-10-11', '00:30', tarde)).toBe(false);
  });
});

// Configuracao real de producao em 10/10/2026: seg/dom fechados, ter-sex 09:30-17:00, sab 09:30-15:00.
const horario = {
  dom: { abre: '09:00', fecha: '18:00', ativo: false },
  seg: { abre: '09:00', fecha: '19:00', ativo: false },
  ter: { abre: '09:30', fecha: '17:00', ativo: true },
  qua: { abre: '09:30', fecha: '17:00', ativo: true },
  qui: { abre: '09:30', fecha: '17:00', ativo: true },
  sex: { abre: '09:30', fecha: '17:00', ativo: true },
  sab: { abre: '09:30', fecha: '15:00', ativo: true },
};

describe('janelaDoDia', () => {
  it('devolve a janela do dia ativo em minutos', () => {
    expect(janelaDoDia(horario, '2026-10-13')).toEqual({ inicioMin: 9 * 60 + 30, fimMin: 17 * 60 }); // terca
    expect(janelaDoDia(horario, '2026-10-17')).toEqual({ inicioMin: 9 * 60 + 30, fimMin: 15 * 60 }); // sabado
  });

  it('dias desativados ficam fechados (domingo e segunda)', () => {
    expect(janelaDoDia(horario, '2026-10-11')).toBeNull();
    expect(janelaDoDia(horario, '2026-10-12')).toBeNull();
  });

  it('falha fechado: sem configuracao, dia ausente ou valores invalidos = fechado', () => {
    expect(janelaDoDia(null, '2026-10-13')).toBeNull();
    expect(janelaDoDia(undefined, '2026-10-13')).toBeNull();
    expect(janelaDoDia('texto', '2026-10-13')).toBeNull();
    expect(janelaDoDia({}, '2026-10-13')).toBeNull();
    expect(janelaDoDia({ ter: { abre: 'x', fecha: '17:00', ativo: true } }, '2026-10-13')).toBeNull();
    expect(janelaDoDia({ ter: { abre: '17:00', fecha: '09:00', ativo: true } }, '2026-10-13')).toBeNull();
  });
});

describe('cabeNoExpediente', () => {
  it('rejeita 08:00 quando a clinica abre as 09:30 (o horario que o bot chegou a oferecer)', () => {
    expect(cabeNoExpediente(horario, '2026-10-13', '08:00', 30)).toBe(false);
    expect(cabeNoExpediente(horario, '2026-10-13', '09:00', 30)).toBe(false);
  });

  it('aceita do horario de abertura ate o ultimo que termina antes de fechar', () => {
    expect(cabeNoExpediente(horario, '2026-10-13', '09:30', 30)).toBe(true);
    expect(cabeNoExpediente(horario, '2026-10-13', '16:30', 30)).toBe(true);
    expect(cabeNoExpediente(horario, '2026-10-13', '16:30:00', 30)).toBe(true);
  });

  it('rejeita o que termina depois de fechar', () => {
    expect(cabeNoExpediente(horario, '2026-10-13', '16:30', 60)).toBe(false);
    expect(cabeNoExpediente(horario, '2026-10-17', '14:30', 60)).toBe(false);
  });

  it('rejeita dia fechado e configuracao ausente', () => {
    expect(cabeNoExpediente(horario, '2026-10-11', '10:00', 30)).toBe(false);
    expect(cabeNoExpediente(null, '2026-10-13', '10:00', 30)).toBe(false);
  });

  it('rejeita hora mal formada', () => {
    expect(cabeNoExpediente(horario, '2026-10-13', 'abc', 30)).toBe(false);
  });
});
