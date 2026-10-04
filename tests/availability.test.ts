import { describe, it, expect } from 'vitest';
import { checkTimeOverlap, getServiceDuration, findBlockingBlock, getAvailableSlots } from '../lib/availability';
import type { Agendamento, BloqueioAgenda, Servico } from '../lib/types';

const servico = (nome: string, duracao: string): Servico => ({ id: nome, nome, preco: 100, duracao, categoria: 'Estética' });

describe('checkTimeOverlap', () => {
  it('detecta sobreposicao parcial', () => {
    expect(checkTimeOverlap('09:00', 30, '09:15', 30)).toBe(true);
  });
  it('nao detecta sobreposicao quando um termina exatamente onde o outro comeca', () => {
    expect(checkTimeOverlap('09:00', 30, '09:30', 30)).toBe(false);
  });
});

describe('getServiceDuration', () => {
  const services = [servico('Manicure', '30'), servico('Depilação', '1h30')];

  it('resolve duracao em minutos simples', () => {
    expect(getServiceDuration(services, 'Manicure')).toBe(30);
  });
  it('resolve duracao no formato "1h30"', () => {
    expect(getServiceDuration(services, 'Depilação')).toBe(90);
  });
  it('soma duracao de procedimentos compostos', () => {
    expect(getServiceDuration(services, 'Manicure + Depilação')).toBe(120);
  });
  it('cai no padrao de 30min para procedimento desconhecido', () => {
    expect(getServiceDuration(services, 'Procedimento Inexistente')).toBe(30);
  });
});

describe('findBlockingBlock', () => {
  const blocks: BloqueioAgenda[] = [
    { id: '1', profissional: 'Gabriela Almeida', data: '2026-11-03', horaInicio: '08:00', horaFim: '12:00', diaInteiro: false, descricao: 'Workshop' },
  ];

  it('encontra bloqueio que cobre o horario', () => {
    expect(findBlockingBlock(blocks, '2026-11-03', '09:00', 30, 'Gabriela Almeida')?.descricao).toBe('Workshop');
  });
  it('nao bloqueia outra profissional', () => {
    expect(findBlockingBlock(blocks, '2026-11-03', '09:00', 30, 'Administrador')).toBeUndefined();
  });
  it('nao bloqueia fora do horario do bloqueio', () => {
    expect(findBlockingBlock(blocks, '2026-11-03', '14:00', 30, 'Gabriela Almeida')).toBeUndefined();
  });
});

describe('getAvailableSlots', () => {
  const services = [servico('Manicure', '30')];
  const baseParams = {
    date: '2026-11-03',
    profissional: 'Gabriela Almeida',
    durationMin: 30,
    services,
  };

  it('retorna todos os slots do expediente quando nao ha nada marcado', () => {
    const slots = getAvailableSlots({ ...baseParams, appointments: [], blocks: [], startHour: 8, endHour: 9 });
    expect(slots).toEqual(['08:00', '08:30']);
  });

  it('exclui slot ocupado por agendamento existente da mesma profissional', () => {
    const appointments: Agendamento[] = [
      { id: 'a1', hora: '08:00', clienteNome: 'Cliente Teste', procedimento: 'Manicure', status: 'Confirmado', profissional: 'Gabriela Almeida', categoria: 'Estética', data: '2026-11-03' },
    ];
    const slots = getAvailableSlots({ ...baseParams, appointments, blocks: [], startHour: 8, endHour: 9 });
    expect(slots).toEqual(['08:30']);
  });

  it('nao exclui slot ocupado por agendamento de outra profissional', () => {
    const appointments: Agendamento[] = [
      { id: 'a1', hora: '08:00', clienteNome: 'Cliente Teste', procedimento: 'Manicure', status: 'Confirmado', profissional: 'Administrador', categoria: 'Estética', data: '2026-11-03' },
    ];
    const slots = getAvailableSlots({ ...baseParams, appointments, blocks: [], startHour: 8, endHour: 9 });
    expect(slots).toEqual(['08:00', '08:30']);
  });

  it('exclui slot coberto por bloqueio', () => {
    const blocks: BloqueioAgenda[] = [
      { id: 'b1', profissional: 'Gabriela Almeida', data: '2026-11-03', horaInicio: '08:00', horaFim: '08:30', diaInteiro: false, descricao: 'Folga' },
    ];
    const slots = getAvailableSlots({ ...baseParams, appointments: [], blocks, startHour: 8, endHour: 9 });
    expect(slots).toEqual(['08:30']);
  });

  it('nao oferece slot cujo procedimento nao caberia antes do fechamento', () => {
    const slots = getAvailableSlots({ ...baseParams, durationMin: 60, appointments: [], blocks: [], startHour: 8, endHour: 9 });
    expect(slots).toEqual(['08:00']);
  });
});
