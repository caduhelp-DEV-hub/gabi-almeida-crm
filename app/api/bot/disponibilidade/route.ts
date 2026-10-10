import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { isBotApiKeyValid } from '../../../../lib/botAuth';
import { getServiceDuration, getAvailableSlots } from '../../../../lib/availability';
import { mapAgendamentoToFrontend, mapBloqueioToFrontend, mapServicoToFrontend } from '../../../../lib/mappers';
import { janelaDoDia } from '../../../../lib/horarioAtendimento';
import { carregarHorarioAtendimento } from '../../../../lib/botHorario';

/**
 * GET /api/bot/disponibilidade?data=YYYY-MM-DD&profissional=Nome&procedimento=Nome
 *
 * Unica fonte de disponibilidade: usa exatamente a mesma funcao que a grade
 * da Agenda usa (lib/availability.ts), nunca uma segunda implementacao da
 * regra de conflito/bloqueio.
 */
export async function GET(request: NextRequest) {
  if (!isBotApiKeyValid(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const data = searchParams.get('data');
  const profissional = searchParams.get('profissional');
  const procedimento = searchParams.get('procedimento') || '';

  if (!data || !profissional) {
    return NextResponse.json({ error: 'parametros "data" e "profissional" sao obrigatorios' }, { status: 400 });
  }

  try {
    const [{ data: servs }, { data: appts }, { data: blks }, horarioAtendimento] = await Promise.all([
      supabaseAdmin.from('servicos').select('*'),
      supabaseAdmin.from('agendamentos').select('*').eq('data', data),
      supabaseAdmin.from('bloqueios_agenda').select('*').eq('data', data),
      carregarHorarioAtendimento()
    ]);

    const services = (servs || []).map(mapServicoToFrontend);
    const appointments = (appts || []).map(mapAgendamentoToFrontend);
    const blocks = (blks || []).map(mapBloqueioToFrontend);
    const durationMin = getServiceDuration(services, procedimento);

    // Horario de atendimento (Configuracoes > WhatsApp): dia fechado ou sem configuracao = sem horarios.
    const janela = janelaDoDia(horarioAtendimento, data);
    if (!janela) {
      return NextResponse.json({ slots: [], durationMin });
    }
    let startMins = janela.inicioMin;
    let endMins = janela.fimMin;

    // Filtro por Período (manhã/tarde)
    const periodo = searchParams.get('periodo');
    if (periodo === 'manha') {
      endMins = Math.min(endMins, 12 * 60); // até 12:00
    } else if (periodo === 'tarde') {
      startMins = Math.max(startMins, 12 * 60); // a partir das 12:00
    }

    const slots = getAvailableSlots({ 
      date: data, 
      profissional, 
      durationMin, 
      appointments, 
      blocks, 
      services,
      startMinutesFromMidnight: startMins,
      endMinutesFromMidnight: endMins
    });

    return NextResponse.json({ slots, durationMin });
  } catch (err: any) {
    console.error('[api/bot/disponibilidade]', err);
    return NextResponse.json({ error: 'Erro ao consultar disponibilidade.' }, { status: 500 });
  }
}
