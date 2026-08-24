import { describe, it, expect } from 'vitest';
import {
  mapUserToFrontend,
  mapUserToBackend,
  mapClienteToFrontend,
  mapClienteToBackend,
  mapAgendamentoToFrontend,
  mapAgendamentoToBackend,
  mapInventoryToFrontend,
  mapInventoryToBackend,
  mapPlanoTratamentoSessaoToFrontend,
  mapPlanoTratamentoSessaoToBackend,
  getAppointmentColorClass
} from '../lib/mappers';

describe('mapUserToFrontend', () => {
  it('converts snake_case fields to camelCase', () => {
    const result = mapUserToFrontend({
      id: '1',
      name: 'Gabi',
      username: 'admin',
      role: 'admin',
      status: 'active',
      specialty: 'Esteta',
      phone: '1199999',
      avatar: 'url',
      commission_rate: 10,
      permissions: { accessSystem: true }
    });
    expect(result).toEqual({
      id: '1',
      name: 'Gabi',
      username: 'admin',
      role: 'admin',
      status: 'active',
      specialty: 'Esteta',
      phone: '1199999',
      avatar: 'url',
      commissionRate: 10,
      permissions: { accessSystem: true }
    });
  });
});

describe('mapUserToBackend', () => {
  it('converts camelCase fields to snake_case', () => {
    const result = mapUserToBackend({
      id: '1',
      commissionRate: 20
    });
    expect(result).toEqual({ id: '1', commission_rate: 20 });
  });
});

describe('mapClienteToFrontend', () => {
  it('parses numeric fields and maps relations', () => {
    const result = mapClienteToFrontend({
      id: 'p1',
      name: 'Maria',
      foto_detalhes: 'avatar',
      ultima_visita: '2024-01-01',
      total_gasto: '1500.5',
      qtde_procedimentos: '3',
      fotos_evolucao: [{ id: 'ph1' }],
      historico: []
    });
    expect(result.totalGasto).toBe(1500.5);
    expect(result.qtdeProcedimentos).toBe(3);
    expect(result.fotosEvolucao).toEqual([{ id: 'ph1' }]);
  });
});

describe('mapAgendamentoToFrontend', () => {
  it('uses nested patient data when available', () => {
    const result = mapAgendamentoToFrontend({
      id: 'a1',
      cliente_id: 'p1',
      clientes: { nome: 'Maria', avatar: 'avatar.png' },
      hora: '10:00',
      procedimento: 'Botox',
      status: 'Confirmado',
      profissional: 'Dra. Gabi',
      categoria: 'Estética',
      data: '2024-01-01'
    });
    expect(result.clienteNome).toBe('Maria');
    expect(result.clienteAvatar).toBe('avatar.png');
  });
});

describe('mapInventoryToFrontend', () => {
  it('coerces quantity numbers', () => {
    const result = mapInventoryToFrontend({ id: 'i1', name: 'Toxina', quantity: '5', min_quantity: '2', unit: 'fr' });
    expect(result.quantity).toBe(5);
    expect(result.minQuantity).toBe(2);
  });
});

describe('getAppointmentColorClass', () => {
  it('returns correct class for each status', () => {
    expect(getAppointmentColorClass('Finalizado')).toContain('emerald');
    expect(getAppointmentColorClass('Em Atendimento')).toContain('cyan');
    expect(getAppointmentColorClass('Confirmado')).toContain('amber');
    expect(getAppointmentColorClass('Pendente')).toContain('slate');
    expect(getAppointmentColorClass('Outro')).toContain('slate');
  });
});

describe('mapClienteToBackend', () => {
  it('converte camelCase para snake_case', () => {
    const res = mapClienteToBackend({ nome: 'Ana', totalGasto: 250.5, fotoAntes: 'a.png' });
    expect(res).toEqual({ nome: 'Ana', total_gasto: 250.5, foto_antes: 'a.png' });
  });

  it('omite campos nao informados, para nao sobrescrever com undefined', () => {
    const res = mapClienteToBackend({ nome: 'Ana' });
    expect(Object.keys(res)).toEqual(['nome']);
  });

  it('preserva valor zero (nao pode ser tratado como ausente)', () => {
    const res = mapClienteToBackend({ totalGasto: 0, qtdeProcedimentos: 0 });
    expect(res).toEqual({ total_gasto: 0, qtde_procedimentos: 0 });
  });
});

describe('mapAgendamentoToBackend', () => {
  it('converte os campos do agendamento', () => {
    const res = mapAgendamentoToBackend({ clienteId: 'c1', hora: '09:00', data: '2026-08-23', valor: 180 });
    expect(res).toEqual({ cliente_id: 'c1', hora: '09:00', data: '2026-08-23', valor: 180 });
  });

  it('preserva valor zero', () => {
    expect(mapAgendamentoToBackend({ valor: 0 })).toEqual({ valor: 0 });
  });

  it('nao inventa campos quando recebe objeto vazio', () => {
    expect(mapAgendamentoToBackend({})).toEqual({});
  });
});

describe('mapInventoryToBackend', () => {
  it('converte nomes de coluna do estoque', () => {
    const res = mapInventoryToBackend({ name: 'Sérum', quantity: 5, minQuantity: 2, salePrice: 120, costPrice: 60, type: 'skincare' });
    expect(res).toEqual({ name: 'Sérum', quantity: 5, min_quantity: 2, preco_venda: 120, preco_custo: 60, tipo_produto: 'skincare' });
  });

  it('preserva quantidade zero (produto esgotado)', () => {
    expect(mapInventoryToBackend({ quantity: 0 })).toEqual({ quantity: 0 });
  });
});

describe('mapAgendamentoToFrontend', () => {
  it('usa a data local de hoje quando o registro nao tem data', () => {
    const hoje = new Date();
    const esperado = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    expect(mapAgendamentoToFrontend({ id: 'a1' }).data).toBe(esperado);
  });

  it('prefere o nome vindo do join de clientes', () => {
    const r = mapAgendamentoToFrontend({ id: 'a1', cliente_nome: 'Antigo', clientes: { nome: 'Novo', avatar: 'x' } });
    expect(r.clienteNome).toBe('Novo');
    expect(r.clienteAvatar).toBe('x');
  });
});

describe('mapPlanoTratamentoSessaoToFrontend', () => {
  it('converte snake_case para camelCase', () => {
    const r = mapPlanoTratamentoSessaoToFrontend({
      id: 's1',
      item_id: 'i1',
      plano_id: 'p1',
      cliente_id: 'c1',
      numero_sessao: 3,
      data_sessao: '2026-08-24',
      descricao: 'Aplicação de botox',
      fotos: [{ id: 'f1', url: 'x.jpg', date: '24/08/2026', type: 'Evolução' }],
      realizado_por: 'Dra. Gabi',
      criado_em: '2026-08-24T10:00:00Z'
    });
    expect(r).toEqual({
      id: 's1',
      itemId: 'i1',
      planoId: 'p1',
      clienteId: 'c1',
      numeroSessao: 3,
      dataSessao: '2026-08-24',
      descricao: 'Aplicação de botox',
      fotos: [{ id: 'f1', url: 'x.jpg', date: '24/08/2026', type: 'Evolução' }],
      realizadoPor: 'Dra. Gabi',
      criadoEm: '2026-08-24T10:00:00Z'
    });
  });

  it('usa array vazio quando fotos vem nulo', () => {
    expect(mapPlanoTratamentoSessaoToFrontend({ id: 's1', numero_sessao: 1 }).fotos).toEqual([]);
  });

  it('converte os campos de assinatura', () => {
    const r = mapPlanoTratamentoSessaoToFrontend({
      id: 's1',
      numero_sessao: 1,
      assinatura_url: 'https://exemplo.com/assinatura.png',
      assinatura_aceite_em: '2026-08-24T10:00:00Z',
      assinatura_termo: 'Declaro estar ciente...',
      assinatura_dispensada_motivo: null
    });
    expect(r.assinaturaUrl).toBe('https://exemplo.com/assinatura.png');
    expect(r.assinaturaAceiteEm).toBe('2026-08-24T10:00:00Z');
    expect(r.assinaturaTermo).toBe('Declaro estar ciente...');
    expect(r.assinaturaDispensadaMotivo).toBeNull();
  });
});

describe('mapPlanoTratamentoSessaoToBackend', () => {
  it('converte camelCase para snake_case', () => {
    const res = mapPlanoTratamentoSessaoToBackend({
      itemId: 'i1',
      planoId: 'p1',
      clienteId: 'c1',
      numeroSessao: 2,
      dataSessao: '2026-08-24',
      realizadoPor: 'Dra. Gabi'
    });
    expect(res).toEqual({
      item_id: 'i1',
      plano_id: 'p1',
      cliente_id: 'c1',
      numero_sessao: 2,
      data_sessao: '2026-08-24',
      realizado_por: 'Dra. Gabi'
    });
  });

  it('omite campos nao informados', () => {
    expect(mapPlanoTratamentoSessaoToBackend({ numeroSessao: 1 })).toEqual({ numero_sessao: 1 });
  });

  it('preserva numeroSessao igual a zero', () => {
    // numeroSessao nunca deveria ser 0 na pratica (CHECK > 0 no banco), mas o
    // mapper nao deve descartar valores falsy por engano.
    expect(mapPlanoTratamentoSessaoToBackend({ numeroSessao: 0 })).toEqual({ numero_sessao: 0 });
  });

  it('converte os campos de assinatura', () => {
    const res = mapPlanoTratamentoSessaoToBackend({
      assinaturaUrl: 'https://exemplo.com/assinatura.png',
      assinaturaAceiteEm: '2026-08-24T10:00:00Z',
      assinaturaTermo: 'Declaro estar ciente e de acordo...',
      assinaturaDispensadaMotivo: 'Cliente já foi embora'
    });
    expect(res).toEqual({
      assinatura_url: 'https://exemplo.com/assinatura.png',
      assinatura_aceite_em: '2026-08-24T10:00:00Z',
      assinatura_termo: 'Declaro estar ciente e de acordo...',
      assinatura_dispensada_motivo: 'Cliente já foi embora'
    });
  });
});
