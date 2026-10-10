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
