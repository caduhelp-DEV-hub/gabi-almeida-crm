import { supabaseAdmin } from './supabase';

/** `horario_atendimento` de Configuracoes > WhatsApp (null se nao cadastrado). Erro de leitura propaga: as rotas respondem 500 em vez de assumir um horario. */
export async function carregarHorarioAtendimento(): Promise<unknown> {
  const { data, error } = await supabaseAdmin
    .from('whatsapp_bot_settings')
    .select('valor')
    .eq('chave', 'horario_atendimento')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.valor ?? null;
}
