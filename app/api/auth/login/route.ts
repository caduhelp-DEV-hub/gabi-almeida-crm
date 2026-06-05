import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../../../../lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-change-me';
const COOKIE_NAME = 'crm_session';
const TOKEN_EXPIRY = '7d'; // 7 dias

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuário e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    // Buscar usuário pelo username
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuário ou senha inválidos.' },
        { status: 401 }
      );
    }

    // Verificar se o usuário está ativo
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Conta desativada. Contate o administrador.' },
        { status: 403 }
      );
    }

    // Comparar senha com hash
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Usuário ou senha inválidos.' },
        { status: 401 }
      );
    }

    // Gerar JWT
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    // Dados do usuário (sem senha)
    const { password_hash, ...safeUser } = user;

    const response = NextResponse.json({ user: safeUser }, { status: 200 });

    // Definir cookie httpOnly
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias em segundos
    });

    return response;
  } catch (err: any) {
    console.error('[Auth Login] Error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
