import { describe, it, expect } from 'vitest';
import { calcularEstatisticasProntuario, type PlanoResumo } from '../lib/patientStats';
import type { EvolutionPhoto } from '../lib/types';

function plano(over: Partial<PlanoResumo>): PlanoResumo {
  return { id: 'p1', status: 'Rascunho', valorTotal: 0, ...over };
}

function foto(date: string): EvolutionPhoto {
  return { id: 'f' + date, url: 'x.jpg', date, type: 'Evolução' };
}

describe('calcularEstatisticasProntuario', () => {
  it('cliente sem plano nenhum mostra "Sem plano ativo"', () => {
    const r = calcularEstatisticasProntuario({ totalGasto: 0, fotosEvolucao: [] }, [], 0);
    expect(r.status).toBe('Sem plano ativo');
  });

  it('plano Em tratamento tem prioridade sobre Concluido mais recente', () => {
    const planos = [
      plano({ id: 'a', status: 'Concluido', criadoEm: '2026-08-20T00:00:00Z' }),
      plano({ id: 'b', status: 'Em tratamento', criadoEm: '2026-01-01T00:00:00Z' }),
    ];
    const r = calcularEstatisticasProntuario({ totalGasto: 0, fotosEvolucao: [] }, planos, 0);
    expect(r.status).toBe('Em tratamento');
  });

  it('sem plano Em tratamento, usa o Aprovado mais recente', () => {
    const planos = [
      plano({ id: 'a', status: 'Aprovado', criadoEm: '2026-01-01T00:00:00Z' }),
      plano({ id: 'b', status: 'Aprovado', criadoEm: '2026-08-01T00:00:00Z' }),
      plano({ id: 'c', status: 'Rascunho', criadoEm: '2026-08-20T00:00:00Z' }),
    ];
    const r = calcularEstatisticasProntuario({ totalGasto: 0, fotosEvolucao: [] }, planos, 0);
    expect(r.status).toBe('Aprovado');
  });

  it('sem Em tratamento nem Aprovado, usa o Concluido mais recente', () => {
    const planos = [plano({ status: 'Concluido' }), plano({ status: 'Cancelado' })];
    const r = calcularEstatisticasProntuario({ totalGasto: 0, fotosEvolucao: [] }, planos, 0);
    expect(r.status).toBe('Concluido');
  });

  it('total investido soma skincare (totalGasto) + planos Aprovado/Em tratamento/Concluido', () => {
    const planos = [
      plano({ status: 'Aprovado', valorTotal: 500 }),
      plano({ status: 'Em tratamento', valorTotal: 300 }),
      plano({ status: 'Concluido', valorTotal: 200 }),
      plano({ status: 'Rascunho', valorTotal: 9999 }),
      plano({ status: 'Aguardando aprovacao', valorTotal: 9999 }),
      plano({ status: 'Cancelado', valorTotal: 9999 }),
    ];
    const r = calcularEstatisticasProntuario({ totalGasto: 100, fotosEvolucao: [] }, planos, 0);
    expect(r.totalInvestido).toBe(100 + 500 + 300 + 200);
  });

  it('procedimentos reflete a contagem de sessoes recebida', () => {
    const r = calcularEstatisticasProntuario({ totalGasto: 0, fotosEvolucao: [] }, [], 7);
    expect(r.procedimentos).toBe(7);
  });

  it('galeria vazia mostra "--"', () => {
    const r = calcularEstatisticasProntuario({ totalGasto: 0, fotosEvolucao: [] }, [], 0);
    expect(r.ultimaFoto).toBe('--');
  });

  it('ultima foto e a de data mais recente, nao a ultima do array', () => {
    const fotos = [foto('01/01/2026'), foto('20/08/2026'), foto('15/03/2026')];
    const r = calcularEstatisticasProntuario({ totalGasto: 0, fotosEvolucao: fotos }, [], 0);
    expect(r.ultimaFoto).toBe('20/08/2026');
  });
});
