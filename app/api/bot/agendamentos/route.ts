import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { isBotApiKeyValid } from '../../../../lib/botAuth';
import { getServiceDuration, findBlockingBlock, hasAppointmentConflict } from '../../../../lib/availability';
import { mapAgendamentoToFrontend, mapAgendamentoToBackend, mapBloqueioToFrontend, mapServicoToFrontend } from '../../../../lib/mappers';
import { cabeNoExpediente, jaPassou } from '../../../../lib/horarioAtendimento';
import { carregarHorarioAtendimento } from '../../../../lib/botHorario';

interface CriarAgendamentoBody {
  clienteId?: string;
  clienteNome: string;
  telefone?: string;
  clienteAvatar?: string;
  procedimento: string;
  profissional: string;
  categoria?: 'Estética' | 'Consulta';
  data: string;
  hora: string;
  valor?: number;
}

function phoneSuffix(v: string): string {
  return v.replace(/\D/g, '').slice(-8);
}

function firstWordNorm(v: string): string {
  return (
    (v || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/\s+/)[0] || ''
  );
}

function dddESufixo(phone: string): { ddd: string; suffix: string } {
  const digits = phone.replace(/\D/g, '');
  const norm = digits.startsWith('55') && (digits.length === 12 || digits.length === 13)
    ? digits
    : (digits.length === 10 || digits.length === 11 ? `55${digits}` : digits);
  const suffix = norm.slice(-8);
  const ddd = norm.startsWith('55') && (norm.length === 12 || norm.length === 13) ? norm.slice(2, 4) : '';
  return { ddd, suffix };
}

async function resolveOrCreateClienteId(
  clienteId: string | undefined,
  clienteNome: string,
  telefone: string | undefined,
): Promise<string | undefined> {
  if (clienteId) return clienteId;
  const digits = (telefone || '').replace(/\D/g, '');
  const alvo = dddESufixo(digits);
  if (!alvo.suffix) return undefined;

  const { data: clientes } = await supabaseAdmin
    .from('clientes')
    .select('id, nome, telefone')
    .not('telefone', 'is', null);

  type ClienteRow = { id: string; nome: string | null; telefone: string | null };
  const lista = (clientes || []) as ClienteRow[];
  const comMesmoDdd = alvo.ddd
    ? lista.filter((c) => {
        if (!c.telefone) return false;
        const cand = dddESufixo(String(c.telefone));
        return cand.suffix === alvo.suffix && cand.ddd === alvo.ddd;
      })
    : [];
  const matches =
    comMesmoDdd.length > 0
      ? comMesmoDdd
      : lista.filter((c) => c.telefone && phoneSuffix(String(c.telefone)) === alvo.suffix);
  let resolvedId: string | undefined;

  if (matches.length === 1) {
    resolvedId = matches[0].id as string;
  } else if (matches.length > 1) {
    const firstNames = matches.map((m) => firstWordNorm(String(m.nome || ''))).filter(Boolean);
    if (firstNames.length === matches.length && new Set(firstNames).size === 1) {
      const sorted = [...matches].sort((a, b) => String(b.nome || '').length - String(a.nome || '').length);
      resolvedId = sorted[0].id as string;
    }
  }

  if (!resolvedId) {
    const { data: novoCliente } = await supabaseAdmin
      .from('clientes')
      .insert([{ nome: clienteNome, telefone: digits, status: 'Ativo' }])
      .select('id')
      .single();
    if (novoCliente?.id) resolvedId = novoCliente.id as string;
  }

  if (resolvedId) {
    await supabaseAdmin
      .from('whatsapp_contacts')
      .update({ cliente_id: resolvedId })
      .eq('telefone', digits)
      .is('cliente_id', null);
  }

  return resolvedId;
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

  const { clienteId, clienteNome, telefone, clienteAvatar, procedimento, profissional, categoria, data, hora, valor } = body;
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
    if (jaPassou(data, hora)) {
      return NextResponse.json({ error: 'horario_passado', motivo: 'Esse horário já passou.' }, { status: 409 });
    }

    const bloqueio = findBlockingBlock(blocks, data, hora.slice(0, 5), durationMin, profissional);
    if (bloqueio) {
      return NextResponse.json({ error: 'horario_bloqueado', motivo: bloqueio.descricao }, { status: 409 });
    }
    if (hasAppointmentConflict(appointments, data, hora.slice(0, 5), durationMin, profissional, services)) {
      return NextResponse.json({ error: 'horario_ocupado', motivo: 'Esse horário acabou de ser reservado.' }, { status: 409 });
    }

    const resolvedClienteId = await resolveOrCreateClienteId(clienteId, clienteNome, telefone);

    const payload = mapAgendamentoToBackend({
      clienteId: resolvedClienteId,
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
