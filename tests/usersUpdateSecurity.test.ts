import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Regressao de seguranca: a rota /api/auth/users/update aceitava role,
 * status, permissions e commission_rate de qualquer usuario editando o
 * proprio perfil, sem checar se o valor mudou. Um staff/prestador podia
 * virar admin manipulando a requisicao (a UI nunca mandava isso, mas a API
 * tinha que recusar por conta propria, ja que o cliente nao e confiavel).
 */

const mockRequireUser = vi.fn();
vi.mock('../lib/auth', () => ({
  requireUser: (...args: unknown[]) => mockRequireUser(...args),
}));

const mockUpdate = vi.fn();
const mockSelectExisting = vi.fn();
vi.mock('../lib/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          neq: () => ({
            limit: () => ({
              maybeSingle: () => mockSelectExisting(),
            }),
          }),
        }),
      }),
      update: (payload: Record<string, unknown>) => {
        mockUpdate(payload);
        return {
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: 'staff-1', ...payload, password_hash: 'x' }, error: null }),
            }),
          }),
        };
      },
    }),
  },
}));

const STAFF = {
  id: 'staff-1',
  name: 'Fulano',
  username: 'fulano',
  role: 'staff' as const,
  status: 'active' as const,
  specialty: null,
  phone: '11999999999',
  avatar: '',
  commissionRate: 10,
  permissions: { accessSystem: true },
};

function requisicao(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/auth/users/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockRequireUser.mockReset();
  mockUpdate.mockReset();
  mockSelectExisting.mockReset();
  mockSelectExisting.mockResolvedValue({ data: null });
  mockRequireUser.mockResolvedValue(STAFF);
});

describe('POST /api/auth/users/update — auto-promocao', () => {
  it('recusa quando um usuario comum tenta virar admin', async () => {
    const { POST } = await import('../app/api/auth/users/update/route');
    const res = await POST(requisicao({ ...STAFF, role: 'admin' }));

    expect(res.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('recusa quando tenta ativar a propria conta desativada como se estivesse ativa', async () => {
    mockRequireUser.mockResolvedValue({ ...STAFF, status: 'inactive' });
    const { POST } = await import('../app/api/auth/users/update/route');
    const res = await POST(requisicao({ ...STAFF, status: 'active' }));

    expect(res.status).toBe(403);
  });

  it('recusa quando tenta se dar permissoes extras', async () => {
    const { POST } = await import('../app/api/auth/users/update/route');
    const res = await POST(
      requisicao({ ...STAFF, permissions: { accessSystem: true, accessFinanceiro: true } })
    );

    expect(res.status).toBe(403);
  });

  it('recusa quando tenta aumentar a propria comissao', async () => {
    const { POST } = await import('../app/api/auth/users/update/route');
    const res = await POST(requisicao({ ...STAFF, commissionRate: 99 }));

    expect(res.status).toBe(403);
  });

  it('permite editar o proprio nome e telefone sem tocar em role/permissoes', async () => {
    const { POST } = await import('../app/api/auth/users/update/route');
    const res = await POST(requisicao({ ...STAFF, name: 'Fulano da Silva', phone: '11988887777' }));

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Fulano da Silva', phone: '11988887777', role: 'staff' })
    );
  });

  it('admin continua podendo alterar role/permissoes de outro usuario', async () => {
    mockRequireUser.mockResolvedValue({ ...STAFF, id: 'admin-1', role: 'admin' });
    const { POST } = await import('../app/api/auth/users/update/route');
    const res = await POST(requisicao({ ...STAFF, id: 'staff-1', role: 'admin', permissions: { tudo: true } }));

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
  });

  it('recusa usuario comum editando OUTRA conta, mesmo sem tentar mudar role', async () => {
    const { POST } = await import('../app/api/auth/users/update/route');
    const res = await POST(requisicao({ ...STAFF, id: 'outro-usuario', name: 'Nome Trocado' }));

    expect(res.status).toBe(403);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
