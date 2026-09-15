import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../../lib/supabase';

const SALT_ROUNDS = 10;

function isSetupTokenValid(request: NextRequest): boolean {
  const expected = process.env.SETUP_TOKEN;
  if (!expected) return false;

  const provided = request.headers.get('x-setup-token') || '';
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);

  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

export async function POST(request: NextRequest) {
  try {
    if (!isSetupTokenValid(request)) {
      return NextResponse.json(
        { error: 'Não autorizado.' },
        { status: 403 }
      );
    }

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

    // Gerar senha aleatória forte (retornada uma única vez na resposta)
    const generatedPassword = crypto.randomBytes(24).toString('base64url');
    const passwordHash = await bcrypt.hash(generatedPassword, SALT_ROUNDS);

    // Criar admin padrão
    const { error } = await supabaseAdmin
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
      {
        message: 'Administrador padrão criado com sucesso! Copie a senha agora, ela não será exibida novamente.',
        seeded: true,
        username: 'admin',
        password: generatedPassword
      },
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
