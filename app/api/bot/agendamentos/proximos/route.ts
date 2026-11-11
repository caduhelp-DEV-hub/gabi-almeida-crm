import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { isBotApiKeyValid } from '../../../../../lib/botAuth';
import { mapAgendamentoToFrontend } from '../../../../../lib/mappers';
import { hojeSaoPauloISO, jaPassou } from '../../../../../lib/horarioAtendimento';

function dddESufixo(raw: string): { ddd: string; sufixo: string } {
  const digits = raw.replace(/\D/g, '');
  const norm = digits.startsWith('55') && (digits.length === 12 || digits.length === 13)
    ? digits
    : (digits.length === 10 || digits.length === 11 ? `55${digits}` : digits);
  const sufixo = norm.slice(-8);
  const ddd = norm.startsWith('55') && (norm.length === 12 || norm.length === 13) ? norm.slice(2, 4) : '';
  return { ddd, sufixo };
}

async function resolverClienteIdsPorTelefone(telefone: string): Promise<string[]> {
  const { sufixo, ddd } = dddESufixo(telefone);
  if (sufixo.length < 8) return [];
  const { data } = await supabaseAdmin.from('clientes').select('id, telefone').not('telefone', 'is', null);
  const lista = data || [];
  if (ddd) {
    const porDdd = lista.filter((c: any) => {
      if (!c.telefone) return false;
      const cand = dddESufixo(String(c.telefone));
      return cand.sufixo === sufixo && cand.ddd === ddd;
    });
    if (porDdd.length > 0) return porDdd.map((c: any) => String(c.id));
  }
  return lista.filter((c: any) => c.telefone && String(c.telefone).replace(/\D/g, '').slice(-8) === sufixo).map((c: any) => String(c.id));
}

/**
 * GET /api/bot/agendamentos/proximos?clienteId=...&telefone=...
 *
 * Agendamentos futuros de um cliente (hoje em diante e ainda não passados/finalizados),
 * usados nos fluxos de reagendar/cancelar/consultar/confirmar pelo WhatsApp.
 */
export async function GET(request: NextRequest) {
  if (!isBotApiKeyValid(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get('clienteId');
  const telefone = searchParams.get('telefone');
  if (!clienteId && !telefone) {
    return NextResponse.json({ error: 'parametro "clienteId" ou "telefone" e obrigatorio' }, { status: 400 });
  }

  try {
    let clienteIds: string[] = clienteId ? [clienteId] : [];
    if (clienteIds.length === 0 && telefone) {
      clienteIds = await resolverClienteIdsPorTelefone(telefone);
    }
    if (clienteIds.length === 0) {
      return NextResponse.json({ agendamentos: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('agendamentos')
      .select('*, clientes(id, nome, avatar)')
      .in('cliente_id', clienteIds)
      .gte('data', hojeSaoPauloISO())
      .neq('status', 'Finalizado')
      .order('data', { ascending: true })
      .order('hora', { ascending: true });
    if (error) throw new Error(error.message);

    const futuros = (data || [])
      .map(mapAgendamentoToFrontend)
      .filter((a: { data: string; hora: string }) => !jaPassou(a.data, a.hora));

    return NextResponse.json({ agendamentos: futuros });
  } catch (err: any) {
    console.error('[api/bot/agendamentos/proximos]', err);
    return NextResponse.json({ error: 'Erro ao consultar agendamentos.' }, { status: 500 });
  }
}
