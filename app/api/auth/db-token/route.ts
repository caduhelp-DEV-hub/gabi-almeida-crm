import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from '../../../../lib/auth';
import { signSupabaseToken, isSupabaseTokenConfigured, DB_TOKEN_TTL_SECONDS } from '../../../../lib/supabaseToken';

export const dynamic = 'force-dynamic';

/**
 * Entrega ao navegador o token de acesso ao banco, valido apenas para quem
 * tem uma sessao ativa. Chamado pelo cliente Supabase sempre que o token
 * atual esta perto de expirar.
 */
export async function GET(request: NextRequest) {
  // Enquanto o segredo nao estiver configurado, devolvemos null e o frontend
  // segue usando a chave publica. Assim o app nao quebra na transicao.
  if (!isSupabaseTokenConfigured()) {
    return NextResponse.json({ token: null }, { status: 200 });
  }

  const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
  if (!sessionToken) {
    return NextResponse.json({ token: null }, { status: 200 });
  }

  const session = verifySessionToken(sessionToken);
  if (!session) {
    return NextResponse.json({ token: null }, { status: 200 });
  }

  try {
    const token = signSupabaseToken(session.userId, session.role);
    return NextResponse.json(
      { token, expiresIn: DB_TOKEN_TTL_SECONDS },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('[Auth DB Token] Erro ao assinar token:', err);
    return NextResponse.json({ token: null }, { status: 200 });
  }
}
