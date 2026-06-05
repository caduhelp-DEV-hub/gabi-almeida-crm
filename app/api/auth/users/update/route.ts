import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '../../../../../lib/supabase';

const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    const { id, name, username, role, status, phone, specialty, commissionRate, permissions, password } = await request.json();

    if (!id || !name || !username || !role) {
      return NextResponse.json(
        { error: 'ID, Nome, login e perfil são obrigatórios.' },
        { status: 400 }
      );
    }

    // Verificar se o username já está sendo usado por outro usuário
    const { data: existingUser } = await supabase
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

    const updateData: any = {
      name,
      username,
      role,
      status,
      phone,
      specialty: role === 'prestador' ? specialty : null,
      commission_rate: role === 'prestador' ? commissionRate : 0,
      permissions: permissions || {}
    };

    // Se uma nova senha foi fornecida, gerar o hash
    if (password && password.trim() !== '') {
      updateData.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const { data, error } = await supabase
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

    return NextResponse.json({ user: data }, { status: 200 });
  } catch (err: any) {
    console.error('[Auth Update] Error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
