import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '../../../../lib/supabase';

const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    const { name, username, role, specialty, phone, commissionRate, permissions } = await request.json();

    if (!name || !username || !role) {
      return NextResponse.json(
        { error: 'Nome, login e perfil são obrigatórios.' },
        { status: 400 }
      );
    }

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .limit(1)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este login (username) já está em uso.' },
        { status: 400 }
      );
    }

    // Senha padrão inicial é '123'
    const passwordHash = await bcrypt.hash('123', SALT_ROUNDS);

    const newUser = {
      name,
      username,
      password_hash: passwordHash,
      role,
      status: 'active',
      specialty: role === 'prestador' ? specialty : undefined,
      phone,
      avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(username)}`,
      commission_rate: role === 'prestador' ? commissionRate : undefined,
      permissions: permissions || {}
    };

    const { data, error } = await supabase
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

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (err: any) {
    console.error('[Auth Register] Error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
