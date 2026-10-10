import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { isBotApiKeyValid } from '../../../../../lib/botAuth';
import { getServiceDuration, findBlockingBlock, hasAppointmentConflict } from '../../../../../lib/availability';
import { mapAgendamentoToFrontend, mapBloqueioToFrontend, mapServicoToFrontend } from '../../../../../lib/mappers';
import { cabeNoExpediente } from '../../../../../lib/horarioAtendimento';
import { carregarHorarioAtendimento } from '../../../../../lib/botHorario';

interface ReagendarBody {
  data: string;
  hora: string;
}

/**
 * PATCH /api/bot/agendamentos/:id  { data, hora }
 *
 * Reagenda, com a mesma checagem dupla de bloqueio/conflito usada na
 * criacao (lib/availability.ts), excluindo o proprio agendamento da
 * checagem de conflito.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isBotApiKeyValid(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  let body: ReagendarBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido.' }, { status: 400 });
  }
  if (!body.data || !body.hora) {
    return NextResponse.json({ error: 'data e hora sao obrigatorios' }, { status: 400 });
  }

  try {
    const { data: atual, error: atualErr } = await supabaseAdmin.from('agendamentos').select('*').eq('id', id).single();
    if (atualErr || !atual) {
      return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 });
    }

    const [{ data: servs, error: servsErr }, { data: appts, error: apptsErr }, { data: blks, error: blksErr }, horarioAtendimento] = await Promise.all([
      supabaseAdmin.from('servicos').select('*'),
      supabaseAdmin.from('agendamentos').select('*').eq('data', body.data),
      supabaseAdmin.from('bloqueios_agenda').select('*').eq('data', body.data),
      carregarHorarioAtendimento(),
    ]);
    if (servsErr || apptsErr || blksErr) throw new Error((servsErr || apptsErr || blksErr)?.message);

    const services = (servs || []).map(mapServicoToFrontend);
    const appointments = (appts || []).map(mapAgendamentoToFrontend);
    const blocks = (blks || []).map(mapBloqueioToFrontend);
    const durationMin = getServiceDuration(services, atual.procedimento);

    // Trava: nunca remarca para fora do horario de atendimento.
    if (!cabeNoExpediente(horarioAtendimento, body.data, body.hora, durationMin)) {
      return NextResponse.json({ error: 'fora_do_expediente', motivo: 'Esse horário está fora do horário de atendimento.' }, { status: 409 });
    }

    const bloqueio = findBlockingBlock(blocks, body.data, body.hora.slice(0, 5), durationMin, atual.profissional);
    if (bloqueio) {
      return NextResponse.json({ error: 'horario_bloqueado', motivo: bloqueio.descricao }, { status: 409 });
    }
    if (hasAppointmentConflict(appointments, body.data, body.hora.slice(0, 5), durationMin, atual.profissional, services, id)) {
      return NextResponse.json({ error: 'horario_ocupado', motivo: 'Esse horário acabou de ser reservado.' }, { status: 409 });
    }

    const { data: atualizado, error } = await supabaseAdmin
      .from('agendamentos')
      .update({ data: body.data, hora: body.hora })
      .eq('id', id)
      .select('*, clientes(id, nome, avatar)')
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ agendamento: mapAgendamentoToFrontend(atualizado) });
  } catch (err: any) {
    console.error('[api/bot/agendamentos PATCH]', err);
    return NextResponse.json({ error: 'Erro ao reagendar.' }, { status: 500 });
  }
}

/**
 * DELETE /api/bot/agendamentos/:id
 *
 * Cancela. Nao existe status "Cancelado" no sistema hoje (AgendamentoStatus
 * so tem Confirmado/Em Atendimento/Finalizado/Pendente) -- cancelar e
 * excluir o registro, igual ao botao de lixeira que a tela ja usa.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isBotApiKeyValid(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  try {
    const { data: existente } = await supabaseAdmin.from('agendamentos').select('id').eq('id', id).single();
    if (!existente) {
      return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 });
    }
    const { error } = await supabaseAdmin.from('agendamentos').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[api/bot/agendamentos DELETE]', err);
    return NextResponse.json({ error: 'Erro ao cancelar.' }, { status: 500 });
  }
}
