'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { PlanoResumo } from '../lib/patientStats';

interface ResumoPlanosCliente {
  planos: PlanoResumo[];
  totalSessoes: number;
  carregando: boolean;
}

/**
 * Busca so o necessario para a barra de estatisticas do prontuario: status e
 * valor dos planos do cliente (sem itens) + contagem de sessoes executadas.
 *
 * Deliberadamente separado do fetch completo de PlanoTratamentoModule.tsx
 * (que traz os itens, para edicao/detalhe): a barra fica visivel em toda
 * sub-aba do prontuario e precisa de dado leve sempre disponivel, enquanto o
 * fetch completo so roda quando a aba "Planos de Tratamento" e aberta.
 */
export function usePlanosResumoCliente(clienteId: string | undefined, versao = 0): ResumoPlanosCliente {
  const [planos, setPlanos] = useState<PlanoResumo[]>([]);
  const [totalSessoes, setTotalSessoes] = useState(0);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!clienteId) {
      setPlanos([]);
      setTotalSessoes(0);
      return;
    }

    let cancelado = false;
    setCarregando(true);

    Promise.all([
      supabase
        .from('planos_tratamento')
        .select('id, status, valor_total, criado_em')
        .eq('cliente_id', clienteId),
      supabase
        .from('planos_tratamento_sessoes')
        .select('id', { count: 'exact', head: true })
        .eq('cliente_id', clienteId),
    ]).then(([resPlanos, resSessoes]) => {
      if (cancelado) return;
      if (!resPlanos.error && resPlanos.data) {
        setPlanos(resPlanos.data.map((p: any) => ({
          id: p.id,
          status: p.status,
          valorTotal: Number(p.valor_total || 0),
          criadoEm: p.criado_em,
        })));
      }
      if (!resSessoes.error) {
        setTotalSessoes(resSessoes.count || 0);
      }
      setCarregando(false);
    });

    return () => { cancelado = true; };
  }, [clienteId, versao]);

  return { planos, totalSessoes, carregando };
}
