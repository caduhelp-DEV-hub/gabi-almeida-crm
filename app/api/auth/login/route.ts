import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../../lib/supabase';
import { signSessionToken, COOKIE_NAME } from '../../../../lib/auth';
import { checkLimit, registerFailure, clearFailures, getClientIp } from '../../../../lib/rateLimit';

const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 7;

// Trava contra tentativa de adivinhar senha. Conta apenas tentativas que falharam.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_ACCOUNT = 5;   // mesmo IP tentando o mesmo usuario
const MAX_FAILURES_PER_IP = 20;       // mesmo IP tentando varios usuarios

function tooManyAttempts(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: 'Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuário e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const ip = getClientIp(request.headers);
    const ipKey = `login:ip:${ip}`;
    const accountKey = `login:acct:${ip}:${String(username).toLowerCase()}`;

    const ipStatus = checkLimit(ipKey, MAX_FAILURES_PER_IP);
    if (ipStatus.limited) return tooManyAttempts(ipStatus.retryAfterSeconds);

    const accountStatus = checkLimit(accountKey, MAX_FAILURES_PER_ACCOUNT);
    if (accountStatus.limited) return tooManyAttempts(accountStatus.retryAfterSeconds);

    const registerFailedAttempt = () => {
      registerFailure(ipKey, WINDOW_MS);
      registerFailure(accountKey, WINDOW_MS);
    };

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      registerFailedAttempt();
      return NextResponse.json(
        { error: 'Usuário ou senha inválidos.' },
        { status: 401 }
      );
    }

    if (user.status !== 'active') {
      registerFailedAttempt();
      return NextResponse.json(
        { error: 'Conta desativada. Contate o administrador.' },
        { status: 403 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      registerFailedAttempt();
      return NextResponse.json(
        { error: 'Usuário ou senha inválidos.' },
        { status: 401 }
      );
    }

    clearFailures(ipKey);
    clearFailures(accountKey);

    const token = signSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    const { password_hash, ...safeUser } = user;
    const response = NextResponse.json({ user: safeUser }, { status: 200 });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_EXPIRY_SECONDS
    });

    return response;
  } catch (err) {
    console.error('[Auth Login] Error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
