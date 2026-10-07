import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { isBotApiKeyValid } from '../../../../lib/botAuth';

/**
 * GET /api/bot/status?numero=5511999999999
 * Retorna se o bot deve ou não responder para este número.
 * Implementa a regra de reativação automática em X horas.
 */
export async function GET(request: NextRequest) {
  if (!isBotApiKeyValid(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const numero = searchParams.get('numero');

  if (!numero) {
    return NextResponse.json({ error: 'parametro "numero" obrigatorio' }, { status: 400 });
  }

  try {
    // 1. Buscar a conversa
    const { data: chat } = await supabaseAdmin
      .from('whatsapp_chats')
      .select('*')
      .eq('numero', numero)
      .single();

    if (!chat) {
      // Conversa não existe, bot ativo por padrão
      return NextResponse.json({ active: true });
    }

    if (!chat.bot_disabled) {
      return NextResponse.json({ active: true });
    }

    // Bot está desabilitado, verificar se já passou o tempo de reativação automática
    // 2. Buscar configurações do whatsapp para pegar o tempoAtivacaoAutomaticaHoras
    const { data: settings } = await supabaseAdmin
      .from('whatsapp_bot_settings')
      .select('*')
      .limit(1);
    
    let tempoHoras = 24; // fallback padrão
    if (settings && settings.length > 0) {
      const mapSettings = Object.fromEntries(settings.map(r => [r.chave, r.valor]));
      if (mapSettings['tempo_ativacao_automatica_horas']) {
        tempoHoras = Number(mapSettings['tempo_ativacao_automatica_horas']);
      }
    }

    // 3. Verificar tempo
    if (chat.disabled_at) {
      const disabledAt = new Date(chat.disabled_at);
      const now = new Date();
      const diffHours = (now.getTime() - disabledAt.getTime()) / (1000 * 60 * 60);

      if (diffHours >= tempoHoras) {
        // Já passou o tempo, reativar o bot automaticamente
        await supabaseAdmin
          .from('whatsapp_chats')
          .update({ bot_disabled: false, disabled_at: null })
          .eq('numero', numero);
        
        return NextResponse.json({ active: true, reactivated: true });
      }
    }

    // Bot continua desativado
    return NextResponse.json({ active: false });

  } catch (err: any) {
    console.error('[api/bot/status]', err);
    return NextResponse.json({ error: 'Erro ao checar status.' }, { status: 500 });
  }
}
