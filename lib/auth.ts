import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './supabase';

export const COOKIE_NAME = 'crm_session';
const TOKEN_EXPIRY = '7d';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não definido nas variáveis de ambiente.');
  }
  return secret;
}

export function signSessionToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRY });
}

export function verifySessionToken(token: string): { userId: string; username: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string; username: string; role: string };
    return decoded;
  } catch {
    return null;
  }
}

export async function getSessionUser(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const decoded = verifySessionToken(token);
  if (!decoded) return null;

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, name, username, role, status, specialty, phone, avatar, commission_rate, permissions, created_at')
    .eq('id', decoded.userId)
    .single();

  if (error || !user) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    status: user.status,
    specialty: user.specialty,
    phone: user.phone,
    avatar: user.avatar,
    commissionRate: user.commission_rate,
    permissions: user.permissions,
    createdAt: user.created_at
  };
}

export async function requireUser(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  return user;
}

export async function requireAdmin(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
  }
  return user;
}
