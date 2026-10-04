import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { isBotApiKeyValid } from '../../../../../lib/botAuth';
import { mapAgendamentoToFrontend } from '../../../../../lib/mappers';
import { dataLocalISO } from '../../../../../lib/utils';

/**
 * GET /api/bot/agendamentos/proximos?clienteId=...
 *
 * Agendamentos futuros de um cliente (hoje em diante), usados nos fluxos de
 * reagendar/cancelar/consultar pelo WhatsApp.
 */
export async function GET(request: NextRequest) {
  if (!isBotApiKeyValid(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get('clienteId');
  if (!clienteId) {
    return NextResponse.json({ error: 'parametro "clienteId" e obrigatorio' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('agendamentos')
      .select('*, clientes(id, nome, avatar)')
      .eq('cliente_id', clienteId)
      .gte('data', dataLocalISO())
      .order('data', { ascending: true })
      .order('hora', { ascending: true });
    if (error) throw new Error(error.message);

    return NextResponse.json({ agendamentos: (data || []).map(mapAgendamentoToFrontend) });
  } catch (err: any) {
    console.error('[api/bot/agendamentos/proximos]', err);
    return NextResponse.json({ error: 'Erro ao consultar agendamentos.' }, { status: 500 });
  }
}
