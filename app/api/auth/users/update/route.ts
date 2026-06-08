import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { requireUser } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';

const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id, name, username, role, status, phone, specialty, commissionRate, permissions, password, avatar } = await request.json();

    if (auth.role !== 'admin' && auth.id !== id) {
      return NextResponse.json(
        { error: 'Acesso negado. Você só pode atualizar o seu próprio perfil.' },
        { status: 403 }
      );
    }

    if (!id || !name || !username || !role) {
      return NextResponse.json(
        { error: 'ID, Nome, login e perfil são obrigatórios.' },
        { status: 400 }
      );
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', id)
      .limit(1)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este login (username) já está em uso por outro usuário.' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      name,
      username,
      role,
      status,
      phone,
      specialty: specialty || null,
      commission_rate: commissionRate || 0,
      permissions: permissions || {}
    };

    if (avatar && avatar.trim() !== '') {
      updateData.avatar = avatar;
    }

    if (password && password.trim() !== '') {
      updateData.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Auth Update] DB Update Error:', error);
      return NextResponse.json(
        { error: `Erro ao salvar no banco: ${error.message}` },
        { status: 500 }
      );
    }

    const { password_hash, ...safeUser } = data;
    return NextResponse.json({ user: safeUser }, { status: 200 });
  } catch (err) {
    console.error('[Auth Update] Error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
