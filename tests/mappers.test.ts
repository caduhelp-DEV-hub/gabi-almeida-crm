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
