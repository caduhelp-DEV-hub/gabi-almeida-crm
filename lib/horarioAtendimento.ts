import type { DiaSemana } from './types';

/**
 * Regra unica de "a clinica atende nesse dia/horario?" para as rotas do bot
 * (/api/bot/*). Le o `horario_atendimento` cadastrado em Configuracoes >
 * WhatsApp e FALHA FECHADO: configuracao ausente, dia desativado ou valor
 * invalido significam "fechado" -- nunca um horario padrao inventado.
 */
const DIAS: DiaSemana[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

export interface JanelaAtendimento {
  inicioMin: number;
  fimMin: number;
}

function hhmmParaMinutos(valor: unknown): number | null {
  if (typeof valor !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(valor);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

/** Data (YYYY-MM-DD) e hora (HH:MM) de agora no fuso de Sao Paulo, independente do fuso do servidor. */
function agoraEmSaoPaulo(agora: Date): { data: string; hhmm: string } {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(agora);
  const get = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return { data: `${get('year')}-${get('month')}-${get('day')}`, hhmm: `${get('hour')}:${get('minute')}` };
}

/** O horario `data` + `hora` ja passou (ou e agora)? Usado pra nunca oferecer nem gravar horario no passado. */
export function jaPassou(dataISO: string, hora: string, agora: Date = new Date()): boolean {
  const atual = agoraEmSaoPaulo(agora);
  if (dataISO !== atual.data) return dataISO < atual.data;
  return hora.slice(0, 5) <= atual.hhmm;
}

/** Janela de atendimento do dia (minutos desde 00:00), ou null se estiver fechado. */
export function janelaDoDia(horarioAtendimento: unknown, dataISO: string): JanelaAtendimento | null {
  if (!horarioAtendimento || typeof horarioAtendimento !== 'object') return null;
  const dia = DIAS[new Date(`${dataISO}T12:00:00Z`).getUTCDay()];
  const config = (horarioAtendimento as Record<string, { abre?: unknown; fecha?: unknown; ativo?: unknown } | undefined>)[dia as string];
  if (!config || config.ativo !== true) return null;
  const inicioMin = hhmmParaMinutos(config.abre);
  const fimMin = hhmmParaMinutos(config.fecha);
  if (inicioMin === null || fimMin === null || fimMin <= inicioMin) return null;
  return { inicioMin, fimMin };
}

/** O atendimento de `durationMin` minutos comecando em `hora` cabe inteiro no expediente do dia? */
export function cabeNoExpediente(horarioAtendimento: unknown, dataISO: string, hora: string, durationMin: number): boolean {
  const janela = janelaDoDia(horarioAtendimento, dataISO);
  const inicio = hhmmParaMinutos(hora.slice(0, 5));
  if (!janela || inicio === null) return false;
  return inicio >= janela.inicioMin && inicio + durationMin <= janela.fimMin;
}
