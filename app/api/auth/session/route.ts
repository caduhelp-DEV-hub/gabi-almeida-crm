import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-change-me';
const COOKIE_NAME = 'crm_session';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Verificar e decodificar JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      // Token expirado ou inválido
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    // Buscar dados atualizados do usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    // Retornar dados sem password_hash
    const { password_hash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser }, { status: 200 });
  } catch (err: any) {
    console.error('[Auth Session] Error:', err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

// Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
