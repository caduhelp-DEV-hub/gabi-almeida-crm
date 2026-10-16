import type { DefMensagemTela, MensagemFluxoConfig } from './types';

/** Texto que o bot vai usar hoje para a frase (o editado, ou o padrão publicado pelo bot). */
export const textoDaFrase = (def: DefMensagemTela, config?: MensagemFluxoConfig): string => config?.texto ?? def.padrao;

/** Frase ligada? (Frase essencial nunca desliga, mesmo que a configuração diga o contrário.) */
export const fraseAtiva = (def: DefMensagemTela, config?: MensagemFluxoConfig): boolean => !(def.opcional && config?.ativo === false);

/** Variáveis obrigatórias que o texto editado perdeu -- nesse caso o bot volta ao texto padrão daquela frase. */
export const variaveisFaltando = (def: DefMensagemTela, texto: string): string[] =>
  def.obrigatorias.filter((v) => !texto.includes(`[${v}]`));

/**
 * Atualiza UMA frase mantendo o JSON salvo enxuto: só guarda o que difere do
 * padrão (texto diferente, ou desligada). `texto: undefined` restaura o padrão.
 */
export const atualizarFrase = (
  mapa: Record<string, MensagemFluxoConfig>,
  chave: string,
  patch: { texto?: string | undefined; ativo?: boolean },
  padrao?: string
): Record<string, MensagemFluxoConfig> => {
  const atual: MensagemFluxoConfig = { ...(mapa[chave] ?? {}) };
  if ('texto' in patch) {
    if (patch.texto === undefined || patch.texto === padrao) delete atual.texto;
    else atual.texto = patch.texto;
  }
  if ('ativo' in patch) {
    if (patch.ativo === false) atual.ativo = false;
    else delete atual.ativo;
  }
  const proximo = { ...mapa };
  if (Object.keys(atual).length > 0) proximo[chave] = atual;
  else delete proximo[chave];
  return proximo;
};
