import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { isBotApiKeyValid } from '../../../../lib/botAuth';
import { getServiceDuration, getAvailableSlots } from '../../../../lib/availability';
import { mapAgendamentoToFrontend, mapBloqueioToFrontend, mapServicoToFrontend } from '../../../../lib/mappers';

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
    const [{ data: servs }, { data: appts }, { data: blks }, { data: settings }] = await Promise.all([
      supabaseAdmin.from('servicos').select('*'),
      supabaseAdmin.from('agendamentos').select('*').eq('data', data),
      supabaseAdmin.from('bloqueios_agenda').select('*').eq('data', data),
      supabaseAdmin.from('whatsapp_bot_settings').select('*').limit(1)
    ]);

    const services = (servs || []).map(mapServicoToFrontend);
    const appointments = (appts || []).map(mapAgendamentoToFrontend);
    const blocks = (blks || []).map(mapBloqueioToFrontend);
    const durationMin = getServiceDuration(services, procedimento);
    
    // Configurações de Horário de Atendimento
    const daysMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const dateObj = new Date(data + 'T12:00:00Z');
    const diaSemana = daysMap[dateObj.getUTCDay()] as any;
    
    let startMins = 8 * 60;
    let endMins = 19 * 60;
    
    if (settings && settings.length > 0) {
      const mapSettings = Object.fromEntries(settings.map(r => [r.chave, r.valor]));
      const horario = mapSettings['horario_atendimento'];
      if (horario && horario[diaSemana]) {
        if (!horario[diaSemana].ativo) {
          // Dia não há atendimento, sem horários
          return NextResponse.json({ slots: [], durationMin });
        }
        const [aH, aM] = horario[diaSemana].abre.split(':').map(Number);
        const [fH, fM] = horario[diaSemana].fecha.split(':').map(Number);
        startMins = aH * 60 + aM;
        endMins = fH * 60 + fM;
      }
    }
    
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
