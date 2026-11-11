import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { isBotApiKeyValid } from '../../../../lib/botAuth';

function normalizarTelefone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

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
    const telNorm = normalizarTelefone(numero);
    const { data: contato } = await supabaseAdmin
      .from('whatsapp_contacts')
      .select('id')
      .eq('telefone', telNorm)
      .maybeSingle();

    if (!contato) {
      return NextResponse.json({ active: true });
    }

    const { data: conversa } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('id, mode, last_message_at')
      .eq('contact_id', contato.id)
      .neq('status', 'CLOSED')
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conversa || conversa.mode !== 'HUMAN') {
      return NextResponse.json({ active: true });
    }

    const { data: settingRow } = await supabaseAdmin
      .from('whatsapp_bot_settings')
      .select('valor')
      .eq('chave', 'tempo_ativacao_automatica_horas')
      .maybeSingle();

    const tempoHoras = Number(settingRow?.valor ?? 24) || 24;

    const { data: ultimoHumano } = await supabaseAdmin
      .from('whatsapp_conversation_events')
      .select('criado_em')
      .eq('conversation_id', conversa.id)
      .in('tipo', ['humano_assumiu', 'humano_respondeu'])
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle();

    const ref = ultimoHumano?.criado_em || conversa.last_message_at;
    if (ref) {
      const diffHours = (Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60);
      if (diffHours >= tempoHoras) {
        await supabaseAdmin
          .from('whatsapp_conversations')
          .update({ mode: 'BOT', bot_state: 'IDLE', contexto: null })
          .eq('id', conversa.id);
        await supabaseAdmin
          .from('whatsapp_conversation_events')
          .insert({ conversation_id: conversa.id, tipo: 'bot_retomado', detalhes: { motivo: 'auto_reativacao' } });
        return NextResponse.json({ active: true, reactivated: true });
      }
    }

    return NextResponse.json({ active: false });

  } catch (err: any) {
    console.error('[api/bot/status]', err);
    return NextResponse.json({ error: 'Erro ao checar status.' }, { status: 500 });
  }
}
