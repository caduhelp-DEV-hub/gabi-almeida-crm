import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { isBotApiKeyValid } from '../../../../lib/botAuth';

/**
 * POST /api/bot/webhook
 * Webhook para receber as mensagens do Evolution API / Typebot / n8n
 * Corpo esperado:
 * {
 *   "numero": "5511999999999",
 *   "nome": "João",
 *   "sentByBot": true/false, // se a mensagem foi enviada pelo bot ou recebida do cliente
 *   "content": "Olá, quero agendar"
 * }
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

    // 1. Criar ou atualizar a conversa (whatsapp_chats)
    await supabaseAdmin
      .from('whatsapp_chats')
      .upsert({
        numero,
        nome: nome || 'Desconhecido',
        updated_at: new Date().toISOString()
      }, { onConflict: 'numero' });

    // 2. Inserir a mensagem (whatsapp_messages)
    await supabaseAdmin
      .from('whatsapp_messages')
      .insert({
        numero,
        sent_by_bot: !!sentByBot,
        content
      });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[api/bot/webhook]', err);
    return NextResponse.json({ error: 'Erro ao salvar mensagem.' }, { status: 500 });
  }
}
