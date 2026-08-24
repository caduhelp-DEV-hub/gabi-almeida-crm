import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Regressao: a lista de buckets permitidos na API tinha dessincronizado da
 * realidade do projeto. 'signatures' (usado pelas 3 fichas de anamnese para
 * assinatura digital) nao estava na lista, entao todo upload de assinatura
 * falhava silenciosamente e a assinatura caia no fallback de base64 gravado
 * direto no banco, em vez de virar uma URL enxuta.
 * 'documents' e 'financeiro' estavam liberados mas nem existem como bucket
 * no projeto. 'patient-photos' foi criado depois, para as fotos de sessao
 * do modulo de Planos de Tratamento (ver migration das sessoes).
 */

const mockRequireUser = vi.fn();
vi.mock('../lib/auth', () => ({
  requireUser: (...args: unknown[]) => mockRequireUser(...args),
}));

const mockUpload = vi.fn().mockResolvedValue('https://exemplo.com/arquivo.png');
vi.mock('../lib/storage', () => ({
  uploadBase64ToStorage: (...args: unknown[]) => mockUpload(...args),
}));

const USUARIO = { id: 'u1', name: 'Fulano', username: 'fulano', role: 'staff' };
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function requisicao(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/storage/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockRequireUser.mockReset().mockResolvedValue(USUARIO);
  mockUpload.mockClear();
});

describe('POST /api/storage/upload — lista de buckets', () => {
  it.each(['avatars', 'signatures', 'patient-photos'])('aceita o bucket real "%s"', async (bucket) => {
    const { POST } = await import('../app/api/storage/upload/route');
    const res = await POST(requisicao({ bucket, path: 'x.png', base64: PIXEL, contentType: 'image/png' }));
    expect(res.status).toBe(201);
  });

  it.each(['documents', 'financeiro', 'qualquer-coisa'])(
    'recusa bucket que nao existe no projeto: "%s"',
    async (bucket) => {
      const { POST } = await import('../app/api/storage/upload/route');
      const res = await POST(requisicao({ bucket, path: 'x.png', base64: PIXEL, contentType: 'image/png' }));
      expect(res.status).toBe(400);
      expect(mockUpload).not.toHaveBeenCalled();
    }
  );
});
