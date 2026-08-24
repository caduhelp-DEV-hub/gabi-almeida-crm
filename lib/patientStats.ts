import type { Cliente, StatusPlanoTratamento } from './types';

/** Versao leve de um plano de tratamento, so com o que a barra de estatisticas precisa. */
export interface PlanoResumo {
  id: string;
  status: StatusPlanoTratamento;
  valorTotal: number;
  criadoEm?: string;
}

export interface EstatisticasProntuario {
  totalInvestido: number;
  procedimentos: number;
  ultimaFoto: string;
  status: string;
}

/** Status de plano que representam compromisso financeiro assumido pelo cliente. */
const STATUS_INVESTIDO: StatusPlanoTratamento[] = ['Aprovado', 'Em tratamento', 'Concluido'];

/** "DD/MM/AAAA" -> timestamp, para comparar datas guardadas como texto. */
function paraTimestamp(dataBr: string): number {
  const m = dataBr?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return 0;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
}

/**
 * Calcula os 4 valores da barra de estatisticas do prontuario ao vivo, sem
 * depender de nenhum contador salvo em `clientes` (esses ja quebraram 3 vezes
 * por ficarem desincronizados dos lugares que deveriam atualiza-los).
 */
export function calcularEstatisticasProntuario(
  cliente: Pick<Cliente, 'totalGasto' | 'fotosEvolucao'>,
  planos: PlanoResumo[],
  totalSessoes: number
): EstatisticasProntuario {
  const valorPlanos = planos
    .filter(p => STATUS_INVESTIDO.includes(p.status))
    .reduce((acc, p) => acc + p.valorTotal, 0);

  const totalInvestido = (cliente.totalGasto || 0) + valorPlanos;

  const ultimaFoto = (cliente.fotosEvolucao || []).reduce(
    (maisRecente, foto) => (paraTimestamp(foto.date) > paraTimestamp(maisRecente) ? foto.date : maisRecente),
    ''
  ) || '--';

  const status = derivarStatus(planos);

  return { totalInvestido, procedimentos: totalSessoes, ultimaFoto, status };
}

function maisRecente(planos: PlanoResumo[]): PlanoResumo | undefined {
  return [...planos].sort((a, b) => paraTimestampIso(b.criadoEm) - paraTimestampIso(a.criadoEm))[0];
}

function paraTimestampIso(iso?: string): number {
  return iso ? new Date(iso).getTime() : 0;
}

function derivarStatus(planos: PlanoResumo[]): string {
  const emTratamento = planos.filter(p => p.status === 'Em tratamento');
  if (emTratamento.length > 0) return 'Em tratamento';

  const aprovado = maisRecente(planos.filter(p => p.status === 'Aprovado'));
  if (aprovado) return 'Aprovado';

  const concluido = maisRecente(planos.filter(p => p.status === 'Concluido'));
  if (concluido) return 'Concluido';

  return 'Sem plano ativo';
}
