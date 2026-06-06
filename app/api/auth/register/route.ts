import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../../lib/supabase';
import { requireAdmin } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { name, username, role, specialty, phone, commissionRate, permissions, password } = await request.json();

    if (!name || !username || !role) {
      return NextResponse.json(
        { error: 'Nome, login e perfil são obrigatórios.' },
        { status: 400 }
      );
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .limit(1)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este login (username) já está em uso.' },
        { status: 400 }
      );
    }

    const finalPassword = password && password.trim() !== '' ? password : '123';
    const passwordHash = await bcrypt.hash(finalPassword, SALT_ROUNDS);

    const newUser = {
      name,
      username,
      password_hash: passwordHash,
      role,
      status: 'active',
      specialty: specialty || null,
      phone,
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(username)}`,
      commission_rate: commissionRate || 0,
      permissions: permissions || {}
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (error) {
      console.error('[Auth Register] DB Insert Error:', error);
      return NextResponse.json(
        { error: `Erro ao salvar no banco: ${error.message}` },
        { status: 500 }
      );
    }

    const { password_hash, ...safeUser } = data;
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (err) {
    console.error('[Auth Register] Error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
