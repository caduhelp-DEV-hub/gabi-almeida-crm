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
 * POST /api/bot/webhook
 * Webhook legado compatível com a estrutura canônica (`whatsapp_contacts`,
 * `whatsapp_conversations`, `whatsapp_messages`).
 */
export async function POST(request: NextRequest) {
  if (!isBotApiKeyValid(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { numero, nome, sentByBot, content } = body;

    if (!numero || !content) {
      return NextResponse.json({ error: 'numero e content sao obrigatorios' }, { status: 400 });
    }

    const telefone = normalizarTelefone(String(numero));

    let { data: contato } = await supabaseAdmin
      .from('whatsapp_contacts')
      .select('id')
      .eq('telefone', telefone)
      .maybeSingle();

    if (!contato) {
      const { data: criado, error: contatoErr } = await supabaseAdmin
        .from('whatsapp_contacts')
        .insert({
          telefone,
          whatsapp_jid: `${telefone}@s.whatsapp.net`,
          nome: nome || null,
        })
        .select('id')
        .single();
      if (contatoErr || !criado) throw new Error(contatoErr?.message || 'Falha ao criar contato');
      contato = criado;
    }

    let { data: conversa } = await supabaseAdmin
      .from('whatsapp_conversations')
      .select('id')
      .eq('contact_id', contato.id)
      .neq('status', 'CLOSED')
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conversa) {
      const { data: criada, error: convErr } = await supabaseAdmin
        .from('whatsapp_conversations')
        .insert({ contact_id: contato.id, status: 'OPEN', mode: 'BOT' })
        .select('id')
        .single();
      if (convErr || !criada) throw new Error(convErr?.message || 'Falha ao criar conversa');
      conversa = criada;
    }

    const nowIso = new Date().toISOString();
    const { error: msgErr } = await supabaseAdmin
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversa.id,
        direction: sentByBot ? 'OUTBOUND' : 'INBOUND',
        message_type: 'TEXT',
        content: String(content),
        remetente: sentByBot ? 'bot' : 'cliente',
      });
    if (msgErr) throw new Error(msgErr.message);

    await supabaseAdmin
      .from('whatsapp_conversations')
      .update({ last_message_at: nowIso })
      .eq('id', conversa.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[api/bot/webhook]', err);
    return NextResponse.json({ error: 'Erro ao salvar mensagem.' }, { status: 500 });
  }
}
