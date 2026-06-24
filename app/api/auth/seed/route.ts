import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../../lib/supabase';

const SALT_ROUNDS = 10;

export async function POST() {
  try {
    // Verificar se já existe algum admin
    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { message: 'Administrador já existe.', seeded: false },
        { status: 200 }
      );
    }

    // Hash da senha padrão
    const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);

    // Criar admin padrão
    const { data: newAdmin, error } = await supabaseAdmin
      .from('users')
      .insert([{
        name: 'Dra. Gabi Almeida',
        username: 'admin',
        password_hash: passwordHash,
        role: 'admin',
        status: 'active',
        specialty: 'Fundadora & Biomédica Esteta',
        phone: '(11) 99876-5432',
        avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=GabiAlmeida',
        commission_rate: 40,
        permissions: {
          accessSystem: true,
          accessAgenda: true,
          accessFinanceiro: true,
          canSchedule: true,
          editPatients: true
        }
      }])
      .select()
      .single();

    if (error) {
      console.error('[Auth Seed] Insert error:', error);
      return NextResponse.json(
        { error: `Erro ao criar administrador: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Administrador padrão criado com sucesso!', seeded: true, username: 'admin' },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[Auth Seed] Error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
