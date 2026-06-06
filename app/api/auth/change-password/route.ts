import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../../lib/supabase';
import { requireUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Senha atual e nova senha são obrigatórias.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A nova senha deve ter ao menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const { data: userRecord, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', user.id)
      .single();

    if (fetchError || !userRecord) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    const passwordValid = await bcrypt.compare(currentPassword, userRecord.password_hash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Senha atual incorreta.' },
        { status: 401 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Auth ChangePassword] Update error:', updateError);
      return NextResponse.json(
        { error: `Erro ao atualizar senha: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[Auth ChangePassword] Error:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
