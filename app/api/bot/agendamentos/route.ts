import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { isBotApiKeyValid } from '../../../../lib/botAuth';
import { getServiceDuration, findBlockingBlock, hasAppointmentConflict } from '../../../../lib/availability';
import { mapAgendamentoToFrontend, mapAgendamentoToBackend, mapBloqueioToFrontend, mapServicoToFrontend } from '../../../../lib/mappers';
import { cabeNoExpediente } from '../../../../lib/horarioAtendimento';
import { carregarHorarioAtendimento } from '../../../../lib/botHorario';

interface CriarAgendamentoBody {
  clienteId?: string;
  clienteNome: string;
  clienteAvatar?: string;
  procedimento: string;
  profissional: string;
  categoria?: 'Estética' | 'Consulta';
  data: string;
  hora: string;
  valor?: number;
}

/**
 * POST /api/bot/agendamentos
 *
 * Cria um agendamento vindo do WhatsApp. Roda a MESMA checagem de
 * bloqueio/conflito que handleAddNewAgendamento usa na tela (via
 * lib/availability.ts) -- nunca cria em cima de um horario ja ocupado ou
 * bloqueado, mesmo que o bot tenha oferecido o horario ha alguns segundos
 * (checagem dupla: na hora de oferecer e na hora de gravar).
 */
export async function POST(request: NextRequest) {
  if (!isBotApiKeyValid(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: CriarAgendamentoBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido.' }, { status: 400 });
  }

  const { clienteId, clienteNome, clienteAvatar, procedimento, profissional, categoria, data, hora, valor } = body;
  if (!clienteNome || !procedimento || !profissional || !data || !hora) {
    return NextResponse.json({ error: 'clienteNome, procedimento, profissional, data e hora sao obrigatorios' }, { status: 400 });
  }

  try {
    const [{ data: servs, error: servsErr }, { data: appts, error: apptsErr }, { data: blks, error: blksErr }, horarioAtendimento] = await Promise.all([
      supabaseAdmin.from('servicos').select('*'),
      supabaseAdmin.from('agendamentos').select('*').eq('data', data),
      supabaseAdmin.from('bloqueios_agenda').select('*').eq('data', data),
      carregarHorarioAtendimento(),
    ]);
    if (servsErr || apptsErr || blksErr) throw new Error((servsErr || apptsErr || blksErr)?.message);

    const services = (servs || []).map(mapServicoToFrontend);
    const appointments = (appts || []).map(mapAgendamentoToFrontend);
    const blocks = (blks || []).map(mapBloqueioToFrontend);
    const durationMin = getServiceDuration(services, procedimento);

    // Trava: nunca grava fora do horario de atendimento, mesmo que o bot tenha oferecido o horario.
    if (!cabeNoExpediente(horarioAtendimento, data, hora, durationMin)) {
      return NextResponse.json({ error: 'fora_do_expediente', motivo: 'Esse horário está fora do horário de atendimento.' }, { status: 409 });
    }

    const bloqueio = findBlockingBlock(blocks, data, hora.slice(0, 5), durationMin, profissional);
    if (bloqueio) {
      return NextResponse.json({ error: 'horario_bloqueado', motivo: bloqueio.descricao }, { status: 409 });
    }
    if (hasAppointmentConflict(appointments, data, hora.slice(0, 5), durationMin, profissional, services)) {
      return NextResponse.json({ error: 'horario_ocupado', motivo: 'Esse horário acabou de ser reservado.' }, { status: 409 });
    }

    const payload = mapAgendamentoToBackend({
      clienteId,
      clienteNome,
      clienteAvatar,
      procedimento,
      status: 'Confirmado',
      profissional,
      categoria: categoria || 'Estética',
      data,
      hora,
      valor,
      origem: 'WHATSAPP_BOT',
    });

    const { data: criado, error } = await supabaseAdmin
      .from('agendamentos')
      .insert([payload])
      .select('*, clientes(id, nome, avatar)')
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ agendamento: mapAgendamentoToFrontend(criado) }, { status: 201 });
  } catch (err: any) {
    console.error('[api/bot/agendamentos POST]', err);
    return NextResponse.json({ error: 'Erro ao criar agendamento.' }, { status: 500 });
  }
}
