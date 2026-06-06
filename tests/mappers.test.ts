import { describe, it, expect } from 'vitest';
import {
  mapUserToFrontend,
  mapUserToBackend,
  mapPatientToFrontend,
  mapPatientToBackend,
  mapAppointmentToFrontend,
  mapAppointmentToBackend,
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
      permissions: { accessCRM: true }
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
      permissions: { accessCRM: true }
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

describe('mapPatientToFrontend', () => {
  it('parses numeric fields and maps relations', () => {
    const result = mapPatientToFrontend({
      id: 'p1',
      name: 'Maria',
      details_avatar: 'avatar',
      last_visit: '2024-01-01',
      total_spent: '1500.5',
      procedures_count: '3',
      evolution_photos: [{ id: 'ph1' }],
      timeline: []
    });
    expect(result.totalSpent).toBe(1500.5);
    expect(result.proceduresCount).toBe(3);
    expect(result.evolutionPhotos).toEqual([{ id: 'ph1' }]);
  });
});

describe('mapAppointmentToFrontend', () => {
  it('uses nested patient data when available', () => {
    const result = mapAppointmentToFrontend({
      id: 'a1',
      patient_id: 'p1',
      patients: { name: 'Maria', avatar: 'avatar.png' },
      time: '10:00',
      procedure: 'Botox',
      status: 'Confirmado',
      professional: 'Dra. Gabi',
      category: 'Estética',
      date: '2024-01-01'
    });
    expect(result.patientName).toBe('Maria');
    expect(result.patientAvatar).toBe('avatar.png');
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
