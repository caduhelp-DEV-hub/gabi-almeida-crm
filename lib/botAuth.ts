import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Protege as rotas app/api/bot/* -- chamadas só pelo serviço
 * gabi-almeida-whatsapp-bot (processo server-side, nunca o navegador), nunca
 * pela sessão humana. Mesmo padrão de comparação em tempo constante já usado
 * em app/api/auth/seed/route.ts para o SETUP_TOKEN.
 */
export function isBotApiKeyValid(request: NextRequest): boolean {
  const expected = process.env.BOT_API_KEY;
  if (!expected) return false;

  const provided = request.headers.get('x-bot-api-key') || '';
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);

  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}
