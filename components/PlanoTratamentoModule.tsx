'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabase';
import {
  Cliente,
  Servico,
  PlanoTratamento,
  PlanoTratamentoItem,
  PlanoTratamentoSessao,
  StatusPlanoTratamento,
  StatusItemPlanoTratamento,
  EvolutionPhoto,
  TimelineItem
} from '../lib/types';
import {
  mapPlanoTratamentoToFrontend,
  mapPlanoTratamentoToBackend,
  mapPlanoTratamentoItemToBackend,
  mapPlanoTratamentoSessaoToFrontend,
  mapPlanoTratamentoSessaoToBackend
} from '../lib/mappers';
import { gerarPdfPlano } from '../lib/pdf/planoTratamentoPdf';
import RegistrarSessaoModal, { type DadosNovaSessao } from './modals/RegistrarSessaoModal';

interface CompanyData {
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
}

interface PlanoTratamentoModuleProps {
  patients: Cliente[];
  services: Servico[];
  showAlert: (msg: string) => void;
  companyData: CompanyData;
  filterClienteId?: string;
  initialPatientId?: string | null;
  onPlanoCriado?: (clienteId: string) => void;
  /** Nome pre-preenchido em "Realizado por" ao registrar uma sessao. */
  nomeProfissionalPadrao?: string;
  /** Sincroniza historico/fotos_evolucao do cliente com a tela de prontuario aberta. */
  onClienteAtualizado?: (clienteId: string, patch: Partial<Cliente>) => void;
}

type ViewMode = 'lista' | 'novo' | 'editar' | 'detalhe';

const STATUS_PLANO_OPTIONS: StatusPlanoTratamento[] = ['Rascunho', 'Aguardando aprovacao', 'Aprovado', 'Em tratamento', 'Concluido', 'Cancelado'];

const STATUS_PLANO_COLOR: Record<StatusPlanoTratamento, string> = {
  'Rascunho': 'bg-slate-100 text-slate-700',
  'Aguardando aprovacao': 'bg-amber-100 text-amber-800',
  'Aprovado': 'bg-cyan-100 text-cyan-800',
  'Em tratamento': 'bg-blue-100 text-blue-800',
  'Concluido': 'bg-emerald-100 text-emerald-800',
  'Cancelado': 'bg-red-100 text-red-700'
};

const STATUS_ITEM_OPTIONS: StatusItemPlanoTratamento[] = ['Pendente', 'Agendado', 'Em andamento', 'Concluido', 'Cancelado'];

function novoItemVazio(servico: Servico): PlanoTratamentoItem {
  return {
    id: 'temp_' + crypto.randomUUID(),
    planoId: '',
    servicoId: servico.id,
    servicoNome: servico.nome,
    precoUnitario: servico.preco,
    quantidade: 1,
    desconto: 0,
    subtotal: servico.preco,
    status: 'Pendente',
    ordem: 0
  };
}

function calcularSubtotal(item: Pick<PlanoTratamentoItem, 'precoUnitario' | 'quantidade' | 'desconto'>): number {
  const bruto = item.precoUnitario * item.quantidade;
  return Math.max(0, bruto - item.desconto);
}

export default function PlanoTratamentoModule({
  patients,
  services,
  showAlert,
  companyData,
  filterClienteId,
  initialPatientId,
  onPlanoCriado,
  nomeProfissionalPadrao,
  onClienteAtualizado
}: PlanoTratamentoModuleProps) {
  const [planos, setPlanos] = useState<PlanoTratamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('lista');
  const [planoAtivo, setPlanoAtivo] = useState<PlanoTratamento | null>(null);
  const [itemParaRegistrarSessao, setItemParaRegistrarSessao] = useState<PlanoTratamentoItem | null>(null);

  const [buscaCliente, setBuscaCliente] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusPlanoTratamento | ''>('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const fetchPlanos = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('planos_tratamento')
        .select('*, clientes(nome), planos_tratamento_itens(*)')
        .order('criado_em', { ascending: false });

      if (filterClienteId) {
        query = query.eq('cliente_id', filterClienteId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPlanos((data || []).map(mapPlanoTratamentoToFrontend));
    } catch (error: any) {
      console.error('Erro ao buscar planos de tratamento:', error);
      showAlert(`Erro ao carregar planos de tratamento: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterClienteId]);

  const planosFiltrados = useMemo(() => {
    return planos.filter(p => {
      if (buscaCliente && !(p.clienteNome || '').toLowerCase().includes(buscaCliente.toLowerCase())) return false;
      if (filtroStatus && p.status !== filtroStatus) return false;
      if (filtroDataInicio && p.criadoEm && p.criadoEm.slice(0, 10) < filtroDataInicio) return false;
      if (filtroDataFim && p.criadoEm && p.criadoEm.slice(0, 10) > filtroDataFim) return false;
      return true;
    });
  }, [planos, buscaCliente, filtroStatus, filtroDataInicio, filtroDataFim]);

  const planosAtivos = useMemo(() => planos.filter(p => ['Aguardando aprovacao', 'Aprovado', 'Em tratamento'].includes(p.status)), [planos]);
  const planosConcluidos = useMemo(() => planos.filter(p => p.status === 'Concluido'), [planos]);

  const abrirNovoPlano = () => {
    setPlanoAtivo({
      id: '',
      clienteId: filterClienteId || initialPatientId || '',
      status: 'Rascunho',
      valorTotal: 0,
      descontoTotal: 0,
      itens: []
    });
    setViewMode('novo');
  };

  const abrirDetalhe = async (plano: PlanoTratamento) => {
    // A listagem nao busca sessoes (pesaria a query de todos os planos), entao
    // carrega aqui, so quando o detalhe de um plano especifico e aberto.
    setPlanoAtivo(plano);
    setViewMode('detalhe');

    if (plano.itens.length === 0) return;
    try {
      const { data, error } = await supabase
        .from('planos_tratamento_sessoes')
        .select('*')
        .in('item_id', plano.itens.map(i => i.id))
        .order('numero_sessao', { ascending: true });
      if (error) throw error;

      const sessoesPorItem = new Map<string, PlanoTratamentoSessao[]>();
      (data || []).forEach((registro: any) => {
        const s = mapPlanoTratamentoSessaoToFrontend(registro);
        const lista = sessoesPorItem.get(s.itemId) || [];
        lista.push(s);
        sessoesPorItem.set(s.itemId, lista);
      });

      const planoComSessoes: PlanoTratamento = {
        ...plano,
        itens: plano.itens.map(i => ({ ...i, sessoes: sessoesPorItem.get(i.id) || [] }))
      };
      setPlanoAtivo(planoComSessoes);
      setPlanos(prev => prev.map(p => p.id === plano.id ? planoComSessoes : p));
    } catch (error: any) {
      console.error('Erro ao carregar sessões do plano:', error);
      // Nao bloqueia a visualizacao do plano por causa disso -- so fica sem o
      // historico de sessoes carregado.
    }
  };

  const abrirEdicao = (plano: PlanoTratamento) => {
    setPlanoAtivo(plano);
    setViewMode('editar');
  };

  const handleSalvarPlano = async (plano: PlanoTratamento) => {
    if (!plano.clienteId) {
      showAlert('Selecione um cliente para o plano de tratamento.');
      return;
    }
    if (plano.itens.length === 0) {
      showAlert('Adicione ao menos um serviço ao plano.');
      return;
    }
    if (plano.itens.some(i => i.precoUnitario < 0 || i.quantidade <= 0 || i.desconto < 0)) {
      showAlert('Há valores inválidos nos itens do plano (preço, quantidade ou desconto negativos).');
      return;
    }
    if (plano.itens.some(i => i.desconto > i.precoUnitario * i.quantidade)) {
      showAlert('Há um desconto maior que o valor do próprio item. Ajuste antes de salvar.');
      return;
    }

    const valorTotal = plano.itens.reduce((acc, i) => acc + i.subtotal, 0);
    const descontoTotal = plano.itens.reduce((acc, i) => acc + i.desconto, 0);

    // Ids locais (novo plano '', itens 'temp_...') nao sao uuids validos -- nunca devem ir para o insert.
    const montarItensPayload = (planoId: string) => plano.itens.map((item, idx) => {
      const payload = mapPlanoTratamentoItemToBackend({ ...item, ordem: idx });
      delete payload.id;
      return { ...payload, plano_id: planoId };
    });

    try {
      if (plano.id) {
        const itensExistentes = plano.itens.filter(i => !i.id.startsWith('temp_'));

        // Nao deixa reduzir a quantidade de um item abaixo do numero de sessoes
        // ja registradas nele (sessao registrada vira historico/foto no
        // prontuario do cliente, nao pode virar orfa de uma hora pra outra).
        if (itensExistentes.length > 0) {
          const { data: sessoesDosItens, error: sessoesError } = await supabase
            .from('planos_tratamento_sessoes')
            .select('item_id')
            .in('item_id', itensExistentes.map(i => i.id));
          if (sessoesError) throw sessoesError;

          const contagemPorItem = new Map<string, number>();
          (sessoesDosItens || []).forEach((s: any) => {
            contagemPorItem.set(s.item_id, (contagemPorItem.get(s.item_id) || 0) + 1);
          });

          const itemAbaixoDoRegistrado = itensExistentes.find(
            i => i.quantidade < (contagemPorItem.get(i.id) || 0)
          );
          if (itemAbaixoDoRegistrado) {
            const jaFeitas = contagemPorItem.get(itemAbaixoDoRegistrado.id) || 0;
            showAlert(
              `"${itemAbaixoDoRegistrado.servicoNome}" já tem ${jaFeitas} sessão(ões) registrada(s). ` +
              `A quantidade não pode ficar menor que isso.`
            );
            return;
          }
        }

        const planoPayload = mapPlanoTratamentoToBackend({ ...plano, valorTotal, descontoTotal });
        delete planoPayload.id;
        const { error: updError } = await supabase
          .from('planos_tratamento')
          .update(planoPayload)
          .eq('id', plano.id);
        if (updError) throw updError;

        // Diff em vez de apagar tudo e recriar: itens ja existentes preservam o
        // id (e, com ele, as sessoes ja registradas ligadas via FK). So os
        // itens removidos pelo usuario nesta edicao sao de fato deletados.
        const { data: idsAtuaisNoBanco, error: idsError } = await supabase
          .from('planos_tratamento_itens')
          .select('id')
          .eq('plano_id', plano.id);
        if (idsError) throw idsError;

        const idsMantidos = new Set(itensExistentes.map(i => i.id));
        const idsParaRemover = (idsAtuaisNoBanco || [])
          .map((i: any) => i.id)
          .filter((id: string) => !idsMantidos.has(id));

        if (idsParaRemover.length > 0) {
          const { error: delError } = await supabase.from('planos_tratamento_itens').delete().in('id', idsParaRemover);
          if (delError) throw delError;
        }

        for (const [idx, item] of plano.itens.entries()) {
          const payload = mapPlanoTratamentoItemToBackend({ ...item, ordem: idx });
          delete payload.id;

          if (item.id.startsWith('temp_')) {
            const { error } = await supabase.from('planos_tratamento_itens').insert({ ...payload, plano_id: plano.id });
            if (error) throw error;
          } else {
            const { error } = await supabase.from('planos_tratamento_itens').update(payload).eq('id', item.id);
            if (error) throw error;
          }
        }

        showAlert('Plano de tratamento atualizado com sucesso!');
      } else {
        const planoPayload = mapPlanoTratamentoToBackend({ ...plano, valorTotal, descontoTotal, status: 'Rascunho' });
        delete planoPayload.id;
        const { data: planoResult, error: insError } = await supabase
          .from('planos_tratamento')
          .insert([planoPayload])
          .select();
        if (insError) throw insError;

        const novoPlanoId = planoResult?.[0]?.id;
        const { error: itensError } = await supabase.from('planos_tratamento_itens').insert(montarItensPayload(novoPlanoId));
        if (itensError) throw itensError;

        showAlert('Plano de tratamento criado com sucesso!');
        if (!filterClienteId) onPlanoCriado?.(plano.clienteId);
      }

      await fetchPlanos();
      setViewMode('lista');
      setPlanoAtivo(null);
    } catch (error: any) {
      console.error('Erro ao salvar plano de tratamento:', error);
      showAlert(`Erro ao salvar plano de tratamento: ${error.message}`);
    }
  };

  const handleMudarStatusPlano = async (plano: PlanoTratamento, novoStatus: StatusPlanoTratamento) => {
    if (novoStatus === 'Em tratamento' && plano.status !== 'Aprovado') {
      showAlert('Só é possível iniciar o tratamento de um plano Aprovado.');
      return;
    }
    if (novoStatus === 'Aprovado' && !['Rascunho', 'Aguardando aprovacao'].includes(plano.status)) {
      showAlert('Só é possível aprovar um plano em Rascunho ou Aguardando aprovação.');
      return;
    }

    const updates: Partial<PlanoTratamento> = { status: novoStatus };
    const agora = new Date().toISOString();
    if (novoStatus === 'Aprovado') updates.aprovadoEm = agora;
    if (novoStatus === 'Em tratamento') updates.iniciadoEm = agora;
    if (novoStatus === 'Concluido') updates.concluidoEm = agora;
    if (novoStatus === 'Cancelado') updates.canceladoEm = agora;

    try {
      const { error } = await supabase.from('planos_tratamento').update(mapPlanoTratamentoToBackend(updates)).eq('id', plano.id);
      if (error) throw error;

      // Concluir/cancelar o plano manualmente resolve tambem os itens que
      // ainda estavam em aberto -- sem isso o plano ficava com o badge
      // "Concluido" e a barra de progresso mostrando itens pendentes na
      // mesma tela.
      let itensAtualizados = plano.itens;
      if (novoStatus === 'Concluido' || novoStatus === 'Cancelado') {
        const idsEmAberto = plano.itens
          .filter(i => i.status === 'Pendente' || i.status === 'Agendado' || i.status === 'Em andamento')
          .map(i => i.id);

        if (idsEmAberto.length > 0) {
          const itemConcluidoEm = novoStatus === 'Concluido' ? agora : undefined;
          const { error: itensError } = await supabase
            .from('planos_tratamento_itens')
            .update(mapPlanoTratamentoItemToBackend({ status: novoStatus, concluidoEm: itemConcluidoEm }))
            .in('id', idsEmAberto);
          if (itensError) throw itensError;

          itensAtualizados = plano.itens.map(i =>
            idsEmAberto.includes(i.id) ? { ...i, status: novoStatus, concluidoEm: itemConcluidoEm } : i
          );
        }
      }

      const planoAtualizado = { ...plano, ...updates, itens: itensAtualizados };
      setPlanoAtivo(planoAtualizado);
      setPlanos(prev => prev.map(p => p.id === plano.id ? planoAtualizado : p));
      showAlert(`Plano marcado como "${novoStatus}".`);
    } catch (error: any) {
      console.error('Erro ao mudar status do plano:', error);
      showAlert(`Erro ao mudar status do plano: ${error.message}`);
    }
  };

  const handleMudarStatusItem = async (plano: PlanoTratamento, item: PlanoTratamentoItem, novoStatus: StatusItemPlanoTratamento) => {
    const concluidoEm = novoStatus === 'Concluido' ? new Date().toISOString() : undefined;
    try {
      const { error } = await supabase
        .from('planos_tratamento_itens')
        .update(mapPlanoTratamentoItemToBackend({ status: novoStatus, concluidoEm }))
        .eq('id', item.id);
      if (error) throw error;

      const itensAtualizados = plano.itens.map(i => i.id === item.id ? { ...i, status: novoStatus, concluidoEm } : i);
      const planoAtualizado = { ...plano, itens: itensAtualizados };
      setPlanoAtivo(planoAtualizado);
      setPlanos(prev => prev.map(p => p.id === plano.id ? planoAtualizado : p));

      // Um plano so completa sozinho quando todo item chegou a um estado
      // final (Concluido OU Cancelado) e pelo menos um foi de fato concluido
      // -- um plano 100% cancelado nao deveria virar "Concluido".
      const todosResolvidos = itensAtualizados.every(i => i.status === 'Concluido' || i.status === 'Cancelado');
      const algumConcluido = itensAtualizados.some(i => i.status === 'Concluido');
      if (todosResolvidos && algumConcluido && plano.status !== 'Concluido') {
        await handleMudarStatusPlano(planoAtualizado, 'Concluido');
      }
    } catch (error: any) {
      console.error('Erro ao mudar status do item:', error);
      showAlert(`Erro ao mudar status do item: ${error.message}`);
    }
  };

  /** Sobe uma foto redimensionada para o Storage; se falhar, mantem o base64 inline. */
  const uploadFotoSessao = async (clienteId: string, itemId: string, base64: string): Promise<string> => {
    try {
      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: 'patient-photos',
          path: `planos/${clienteId}/${itemId}/${crypto.randomUUID()}.jpg`,
          base64,
          contentType: 'image/jpeg'
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch (err) {
      console.warn('Falha no upload da foto da sessão, mantendo inline:', err);
    }
    return base64;
  };

  const handleRegistrarSessao = async (plano: PlanoTratamento, item: PlanoTratamentoItem, dados: DadosNovaSessao) => {
    const numeroSessao = (item.sessoes?.length || 0) + 1;
    const dataSessaoBr = dados.dataSessao
      ? (() => { const [y, m, d] = dados.dataSessao.split('-'); return `${d}/${m}/${y}`; })()
      : new Date().toLocaleDateString('pt-BR');

    try {
      // Busca o cliente fresco: patients pode ter so as colunas leves da
      // listagem (sem fotos_evolucao) quando este modulo roda fora do
      // prontuario (aba global "Planos de Tratamento").
      const { data: clienteAtual, error: clienteError } = await supabase
        .from('clientes')
        .select('id, historico, fotos_evolucao')
        .eq('id', plano.clienteId)
        .single();
      if (clienteError) throw clienteError;

      const urlsFotos = await Promise.all(
        dados.fotos.map(base64 => uploadFotoSessao(plano.clienteId, item.id, base64))
      );

      const fotosEvolucao: EvolutionPhoto[] = urlsFotos.map(url => ({
        id: 'foto_sessao_' + crypto.randomUUID(),
        url,
        date: dataSessaoBr,
        type: 'Evolução',
        observacao: dados.descricao || undefined
      }));

      const clienteUpdate: Record<string, unknown> = {};

      if (dados.descricao) {
        const novoProtocolo: TimelineItem = {
          id: 'tl_sessao_' + crypto.randomUUID(),
          title: `${item.servicoNome} — Sessão ${numeroSessao}/${item.quantidade}`,
          date: dataSessaoBr,
          description: dados.descricao,
          category: 'Procedimento',
          status: 'Concluído'
        };
        clienteUpdate.historico = [novoProtocolo, ...(clienteAtual.historico || [])];
      }

      if (fotosEvolucao.length > 0) {
        clienteUpdate.fotos_evolucao = [...(clienteAtual.fotos_evolucao || []), ...fotosEvolucao];
      }

      if (Object.keys(clienteUpdate).length > 0) {
        const { error: updateError } = await supabase.from('clientes').update(clienteUpdate).eq('id', plano.clienteId);
        if (updateError) throw updateError;
        onClienteAtualizado?.(plano.clienteId, {
          ...(clienteUpdate.historico ? { historico: clienteUpdate.historico as TimelineItem[] } : {}),
          ...(clienteUpdate.fotos_evolucao ? { fotosEvolucao: clienteUpdate.fotos_evolucao as EvolutionPhoto[] } : {})
        });
      }

      const sessaoPayload = mapPlanoTratamentoSessaoToBackend({
        itemId: item.id,
        planoId: plano.id,
        clienteId: plano.clienteId,
        numeroSessao,
        dataSessao: dados.dataSessao || undefined,
        descricao: dados.descricao || undefined,
        fotos: fotosEvolucao,
        realizadoPor: dados.realizadoPor || undefined
      });
      const { data: sessaoInserida, error: sessaoError } = await supabase
        .from('planos_tratamento_sessoes')
        .insert([sessaoPayload])
        .select()
        .single();
      if (sessaoError) throw sessaoError;

      const novaSessao = mapPlanoTratamentoSessaoToFrontend(sessaoInserida);
      const itensComSessao = plano.itens.map(i =>
        i.id === item.id ? { ...i, sessoes: [...(i.sessoes || []), novaSessao] } : i
      );
      const planoComSessao = { ...plano, itens: itensComSessao };
      setPlanoAtivo(planoComSessao);
      setPlanos(prev => prev.map(p => p.id === plano.id ? planoComSessao : p));
      setItemParaRegistrarSessao(null);
      showAlert('Sessão registrada com sucesso!');

      // A ultima sessao contratada completa o item automaticamente.
      if (numeroSessao >= item.quantidade && item.status !== 'Concluido') {
        await handleMudarStatusItem(planoComSessao, { ...item, sessoes: itensComSessao.find(i => i.id === item.id)?.sessoes }, 'Concluido');
      }
    } catch (error: any) {
      console.error('Erro ao registrar sessão:', error);
      showAlert(`Erro ao registrar sessão: ${error.message}`);
    }
  };

  const handleExportarPdf = (plano: PlanoTratamento) => {
    const cliente = patients.find(p => p.id === plano.clienteId);
    gerarPdfPlano(plano, cliente, companyData);
  };

  const handleExcluirPlano = async (plano: PlanoTratamento) => {
    if (!window.confirm(`Excluir o plano de tratamento de ${plano.clienteNome || 'cliente'}? Essa ação não pode ser desfeita.`)) return;
    try {
      const { error } = await supabase.from('planos_tratamento').delete().eq('id', plano.id);
      if (error) throw error;

      setPlanos(prev => prev.filter(p => p.id !== plano.id));
      if (planoAtivo?.id === plano.id) {
        setViewMode('lista');
        setPlanoAtivo(null);
      }
      showAlert('Plano de tratamento excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir plano de tratamento:', error);
      showAlert(`Erro ao excluir plano de tratamento: ${error.message}`);
    }
  };

  return (
    <section className="flex-1 overflow-y-auto custom-scrollbar bg-[#f7f3f0] p-6 md:p-8 relative animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        {viewMode === 'lista' && (
          <ListaPlanos
            planos={planosFiltrados}
            planosAtivos={planosAtivos}
            planosConcluidos={planosConcluidos}
            isLoading={isLoading}
            filterClienteId={filterClienteId}
            buscaCliente={buscaCliente}
            setBuscaCliente={setBuscaCliente}
            filtroStatus={filtroStatus}
            setFiltroStatus={setFiltroStatus}
            filtroDataInicio={filtroDataInicio}
            setFiltroDataInicio={setFiltroDataInicio}
            filtroDataFim={filtroDataFim}
            setFiltroDataFim={setFiltroDataFim}
            onNovoPlano={abrirNovoPlano}
            onVerPlano={abrirDetalhe}
            onEditarPlano={abrirEdicao}
            onExportarPdf={handleExportarPdf}
            onIniciarTratamento={(p) => handleMudarStatusPlano(p, 'Em tratamento')}
            onExcluirPlano={handleExcluirPlano}
          />
        )}

        {(viewMode === 'novo' || viewMode === 'editar') && planoAtivo && (
          <FormularioPlano
            plano={planoAtivo}
            patients={patients}
            services={services}
            clienteFixo={!!filterClienteId}
            onCancelar={() => { setViewMode('lista'); setPlanoAtivo(null); }}
            onSalvar={handleSalvarPlano}
          />
        )}

        {viewMode === 'detalhe' && planoAtivo && (
          <DetalhePlano
            plano={planoAtivo}
            cliente={patients.find(p => p.id === planoAtivo.clienteId)}
            onVoltar={() => { setViewMode('lista'); setPlanoAtivo(null); }}
            onEditar={() => setViewMode('editar')}
            onMudarStatusPlano={(status) => handleMudarStatusPlano(planoAtivo, status)}
            onMudarStatusItem={(item, status) => handleMudarStatusItem(planoAtivo, item, status)}
            onExportarPdf={() => handleExportarPdf(planoAtivo)}
            onExcluir={() => handleExcluirPlano(planoAtivo)}
            onRegistrarSessao={(item) => setItemParaRegistrarSessao(item)}
          />
        )}
      </div>

      <RegistrarSessaoModal
        item={itemParaRegistrarSessao}
        numeroSessao={(itemParaRegistrarSessao?.sessoes?.length || 0) + 1}
        nomeProfissionalPadrao={nomeProfissionalPadrao || ''}
        onClose={() => setItemParaRegistrarSessao(null)}
        onSalvar={(dados) => {
          if (!planoAtivo || !itemParaRegistrarSessao) return;
          return handleRegistrarSessao(planoAtivo, itemParaRegistrarSessao, dados);
        }}
      />
    </section>
  );
}

// ---------- Sub-tela: Listagem ----------

interface ListaPlanosProps {
  planos: PlanoTratamento[];
  planosAtivos: PlanoTratamento[];
  planosConcluidos: PlanoTratamento[];
  isLoading: boolean;
  filterClienteId?: string;
  buscaCliente: string;
  setBuscaCliente: (v: string) => void;
  filtroStatus: StatusPlanoTratamento | '';
  setFiltroStatus: (v: StatusPlanoTratamento | '') => void;
  filtroDataInicio: string;
  setFiltroDataInicio: (v: string) => void;
  filtroDataFim: string;
  setFiltroDataFim: (v: string) => void;
  onNovoPlano: () => void;
  onVerPlano: (p: PlanoTratamento) => void;
  onEditarPlano: (p: PlanoTratamento) => void;
  onExportarPdf: (p: PlanoTratamento) => void;
  onIniciarTratamento: (p: PlanoTratamento) => void;
  onExcluirPlano: (p: PlanoTratamento) => void;
}

function ListaPlanos({
  planos, planosAtivos, planosConcluidos, isLoading, filterClienteId,
  buscaCliente, setBuscaCliente, filtroStatus, setFiltroStatus,
  filtroDataInicio, setFiltroDataInicio, filtroDataFim, setFiltroDataFim,
  onNovoPlano, onVerPlano, onEditarPlano, onExportarPdf, onIniciarTratamento, onExcluirPlano
}: ListaPlanosProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-manrope text-headline-lg text-primary font-bold text-[32px] md:text-[40px] leading-tight">Planos de Tratamento</h2>
          <p className="font-sans text-[14px] text-on-surface-variant max-w-2xl mt-2">
            Monte orçamentos com os serviços do cliente, acompanhe aprovação e execução de cada item.
          </p>
        </div>
        <button
          onClick={onNovoPlano}
          className="bg-primary text-white-pure px-5 py-3 rounded-xl font-bold text-[14px] flex items-center gap-2 hover:opacity-95 transition-all shadow-md whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Novo Plano
        </button>
      </div>

      {!filterClienteId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white-pure rounded-2xl p-5 border border-outline-variant shadow-sm">
            <p className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Planos Ativos</p>
            <p className="text-[28px] font-black text-primary mt-1">{planosAtivos.length}</p>
          </div>
          <div className="bg-white-pure rounded-2xl p-5 border border-outline-variant shadow-sm">
            <p className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Planos Concluídos</p>
            <p className="text-[28px] font-black text-emerald-600 mt-1">{planosConcluidos.length}</p>
          </div>
        </div>
      )}

      {!filterClienteId && (
        <div className="bg-white-pure rounded-2xl p-5 border border-outline-variant shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={buscaCliente}
            onChange={(e) => setBuscaCliente(e.target.value)}
            className="p-3 bg-surface rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 text-[13px] sm:col-span-2"
          />
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as StatusPlanoTratamento | '')}
            className="p-3 bg-surface rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 text-[13px]"
          >
            <option value="">Todos os status</option>
            {STATUS_PLANO_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex gap-2">
            <input type="date" value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} className="p-3 bg-surface rounded-xl border border-outline-variant/60 text-[13px] flex-1" />
            <input type="date" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} className="p-3 bg-surface rounded-xl border border-outline-variant/60 text-[13px] flex-1" />
          </div>
        </div>
      )}

      <div className="bg-white-pure rounded-3xl border border-outline-variant shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-on-surface-variant text-[13px]">Carregando planos de tratamento...</div>
        ) : planos.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant/70">
            <span className="material-symbols-outlined text-[40px] opacity-30 mb-2">checklist</span>
            <p className="text-[13px]">Nenhum plano de tratamento encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-outline-variant/60 text-left text-on-surface-variant uppercase text-[11px] tracking-wider">
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Criado em</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Total</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {planos.map(plano => (
                  <tr key={plano.id} className="border-b border-outline-variant/30 last:border-0 hover:bg-surface-container/40">
                    <td className="p-4 font-bold text-on-surface">{plano.clienteNome || '—'}</td>
                    <td className="p-4 text-on-surface-variant">{plano.criadoEm ? new Date(plano.criadoEm).toLocaleDateString('pt-BR') : '—'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_PLANO_COLOR[plano.status]}`}>{plano.status}</span>
                    </td>
                    <td className="p-4 font-bold text-primary">R$ {plano.valorTotal.toFixed(2)}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onVerPlano(plano)} title="Visualizar" className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary text-on-surface-variant">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button onClick={() => onEditarPlano(plano)} title="Editar" className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary text-on-surface-variant">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => onExportarPdf(plano)} title="Exportar PDF" className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary text-on-surface-variant">
                          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                        </button>
                        {plano.status === 'Aprovado' && (
                          <button onClick={() => onIniciarTratamento(plano)} title="Iniciar Tratamento" className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary text-on-surface-variant">
                            <span className="material-symbols-outlined text-[18px]">play_circle</span>
                          </button>
                        )}
                        <button onClick={() => onExcluirPlano(plano)} title="Excluir" className="p-2 rounded-lg hover:bg-error/10 hover:text-error text-on-surface-variant">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ---------- Sub-tela: Formulário (criar/editar) ----------

interface FormularioPlanoProps {
  plano: PlanoTratamento;
  patients: Cliente[];
  services: Servico[];
  clienteFixo?: boolean;
  onCancelar: () => void;
  onSalvar: (plano: PlanoTratamento) => void;
}

function FormularioPlano({ plano, patients, services, clienteFixo, onCancelar, onSalvar }: FormularioPlanoProps) {
  const [clienteId, setClienteId] = useState(plano.clienteId);
  const [titulo, setTitulo] = useState(plano.titulo || '');
  const [observacoes, setObservacoes] = useState(plano.observacoes || '');
  const [validadeOrcamento, setValidadeOrcamento] = useState(plano.validadeOrcamento || '');
  const [itens, setItens] = useState<PlanoTratamentoItem[]>(plano.itens);
  const [servicoSelecionado, setServicoSelecionado] = useState('');

  const total = useMemo(() => itens.reduce((acc, i) => acc + i.subtotal, 0), [itens]);
  const descontoTotal = useMemo(() => itens.reduce((acc, i) => acc + i.desconto, 0), [itens]);

  const handleAdicionarServico = () => {
    const servico = services.find(s => s.id === servicoSelecionado);
    if (!servico) return;
    setItens(prev => [...prev, novoItemVazio(servico)]);
    setServicoSelecionado('');
  };

  const handleRemoverItem = (id: string) => {
    setItens(prev => prev.filter(i => i.id !== id));
  };

  const handleAtualizarItem = (id: string, campo: 'quantidade' | 'desconto', valor: number) => {
    setItens(prev => prev.map(i => {
      if (i.id !== id) return i;
      const atualizado = { ...i, [campo]: valor };
      atualizado.subtotal = calcularSubtotal(atualizado);
      return atualizado;
    }));
  };

  const handleSubmit = () => {
    onSalvar({ ...plano, clienteId, titulo, observacoes, validadeOrcamento, itens });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onCancelar} className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="font-manrope text-[24px] font-bold text-primary">{plano.id ? 'Editar Plano de Tratamento' : 'Novo Plano de Tratamento'}</h2>
      </div>

      <div className="bg-white-pure rounded-3xl p-6 border border-outline-variant shadow-sm space-y-4">
        <label className="block text-[13px] font-bold text-on-surface-variant uppercase tracking-wider">1. Cliente</label>
        {clienteFixo ? (
          <div className="w-full p-4 bg-surface rounded-xl border border-outline-variant/60 text-[14px] font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">person</span>
            {patients.find(p => p.id === clienteId)?.nome || 'Cliente do prontuário'}
          </div>
        ) : (
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full p-4 bg-surface rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 text-[14px] font-medium"
          >
            <option value="">-- Selecione um cliente --</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Título do plano</label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Protocolo de rejuvenescimento facial" className="w-full p-3 bg-surface rounded-xl border border-outline-variant/60 text-[13px]" />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Validade do orçamento</label>
            <input type="date" value={validadeOrcamento} onChange={(e) => setValidadeOrcamento(e.target.value)} className="w-full p-3 bg-surface rounded-xl border border-outline-variant/60 text-[13px]" />
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Observações profissionais</label>
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} className="w-full p-3 bg-surface rounded-xl border border-outline-variant/60 text-[13px]" />
        </div>
      </div>

      <div className="bg-white-pure rounded-3xl p-6 border border-outline-variant shadow-sm space-y-4">
        <label className="block text-[13px] font-bold text-on-surface-variant uppercase tracking-wider">2. Serviços do plano</label>

        <div className="flex gap-2">
          <select value={servicoSelecionado} onChange={(e) => setServicoSelecionado(e.target.value)} className="flex-1 p-3 bg-surface rounded-xl border border-outline-variant/60 text-[13px]">
            <option value="">-- Selecione um serviço --</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.nome} — R$ {s.preco.toFixed(2)}</option>)}
          </select>
          <button onClick={handleAdicionarServico} disabled={!servicoSelecionado} className="bg-primary/10 text-primary px-4 rounded-xl hover:bg-primary hover:text-white-pure transition-colors disabled:opacity-40">
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>

        {itens.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant/60 text-[12px]">Nenhum serviço adicionado ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-on-surface-variant uppercase text-[11px] tracking-wider border-b border-outline-variant/60">
                  <th className="p-2">Serviço</th>
                  <th className="p-2">Preço Unit.</th>
                  <th className="p-2">Qtde</th>
                  <th className="p-2">Desconto</th>
                  <th className="p-2">Subtotal</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {itens.map(item => (
                  <tr key={item.id} className="border-b border-outline-variant/30 last:border-0">
                    <td className="p-2 font-bold">{item.servicoNome}</td>
                    <td className="p-2">R$ {item.precoUnitario.toFixed(2)}</td>
                    <td className="p-2">
                      <input type="number" min={1} value={item.quantidade} onChange={(e) => handleAtualizarItem(item.id, 'quantidade', Math.max(1, Number(e.target.value)))} className="w-16 p-1.5 bg-surface rounded-lg border border-outline-variant/60 text-center" />
                    </td>
                    <td className="p-2">
                      <input type="number" min={0} value={item.desconto} onChange={(e) => handleAtualizarItem(item.id, 'desconto', Math.max(0, Number(e.target.value)))} className="w-20 p-1.5 bg-surface rounded-lg border border-outline-variant/60 text-center" />
                    </td>
                    <td className="p-2 font-bold text-primary">R$ {item.subtotal.toFixed(2)}</td>
                    <td className="p-2">
                      <button onClick={() => handleRemoverItem(item.id)} className="p-1.5 rounded-lg hover:bg-error/10 hover:text-error text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pt-4 border-t border-outline-variant/60 flex justify-between items-center">
          <div className="text-[13px] text-on-surface-variant">Desconto total: <span className="font-bold">R$ {descontoTotal.toFixed(2)}</span></div>
          <div className="text-[20px] font-black text-primary">Total: R$ {total.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onCancelar} className="px-5 py-3 rounded-xl font-bold text-[14px] border border-outline-variant text-on-surface-variant hover:bg-surface-container">Cancelar</button>
        <button onClick={handleSubmit} className="px-5 py-3 rounded-xl font-bold text-[14px] bg-primary text-white-pure hover:opacity-95">Salvar Plano</button>
      </div>
    </div>
  );
}

// ---------- Sub-tela: Detalhe / Acompanhamento ----------

interface DetalhePlanoProps {
  plano: PlanoTratamento;
  cliente?: Cliente;
  onVoltar: () => void;
  onEditar: () => void;
  onMudarStatusPlano: (status: StatusPlanoTratamento) => void;
  onMudarStatusItem: (item: PlanoTratamentoItem, status: StatusItemPlanoTratamento) => void;
  onExportarPdf: () => void;
  onExcluir: () => void;
  onRegistrarSessao: (item: PlanoTratamentoItem) => void;
}

/** Sessoes feitas de um item. Item legado marcado Concluido sem sessao registrada conta como feito por completo, so na exibicao. */
function sessoesFeitas(item: PlanoTratamentoItem): number {
  if (item.sessoes && item.sessoes.length > 0) return Math.min(item.sessoes.length, item.quantidade);
  return item.status === 'Concluido' ? item.quantidade : 0;
}

function DetalhePlano({ plano, cliente, onVoltar, onEditar, onMudarStatusPlano, onMudarStatusItem, onExportarPdf, onExcluir, onRegistrarSessao }: DetalhePlanoProps) {
  const quantidadeTotal = plano.itens.reduce((acc, i) => acc + i.quantidade, 0);
  const sessoesTotaisFeitas = plano.itens.reduce((acc, i) => acc + sessoesFeitas(i), 0);
  const progresso = quantidadeTotal > 0 ? Math.round((sessoesTotaisFeitas / quantidadeTotal) * 100) : 0;
  const planoExecutavel = plano.status === 'Aprovado' || plano.status === 'Em tratamento';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onVoltar} className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="font-manrope text-[24px] font-bold text-primary">{plano.titulo || 'Plano de Tratamento'}</h2>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_PLANO_COLOR[plano.status]}`}>{plano.status}</span>
      </div>

      <div className="bg-white-pure rounded-3xl p-6 border border-outline-variant shadow-sm space-y-4">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-[12px] text-on-surface-variant uppercase tracking-wider font-bold">Cliente</p>
            <p className="text-[16px] font-bold text-on-surface">{cliente?.nome || plano.clienteNome || '—'}</p>
          </div>
          <div>
            <p className="text-[12px] text-on-surface-variant uppercase tracking-wider font-bold">Valor Total</p>
            <p className="text-[16px] font-bold text-primary">R$ {plano.valorTotal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[12px] text-on-surface-variant uppercase tracking-wider font-bold">Validade do orçamento</p>
            <p className="text-[16px] font-bold text-on-surface">{plano.validadeOrcamento ? new Date(plano.validadeOrcamento).toLocaleDateString('pt-BR') : '—'}</p>
          </div>
        </div>

        {plano.observacoes && (
          <div>
            <p className="text-[12px] text-on-surface-variant uppercase tracking-wider font-bold">Observações</p>
            <p className="text-[13px] text-on-surface">{plano.observacoes}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {(plano.status === 'Rascunho' || plano.status === 'Aguardando aprovacao') && (
            <button onClick={() => onMudarStatusPlano('Aprovado')} className="px-4 py-2.5 rounded-xl font-bold text-[13px] bg-cyan-600 text-white-pure hover:opacity-90">Aprovar</button>
          )}
          {plano.status === 'Aprovado' && (
            <button onClick={() => onMudarStatusPlano('Em tratamento')} className="px-4 py-2.5 rounded-xl font-bold text-[13px] bg-blue-600 text-white-pure hover:opacity-90">Iniciar Tratamento</button>
          )}
          {plano.status !== 'Concluido' && plano.status !== 'Cancelado' && (
            <button onClick={() => onMudarStatusPlano('Concluido')} className="px-4 py-2.5 rounded-xl font-bold text-[13px] bg-emerald-600 text-white-pure hover:opacity-90">Concluir Plano</button>
          )}
          {plano.status !== 'Concluido' && plano.status !== 'Cancelado' && (
            <button onClick={() => onMudarStatusPlano('Cancelado')} className="px-4 py-2.5 rounded-xl font-bold text-[13px] border border-error text-error hover:bg-error/10">Cancelar</button>
          )}
          <button onClick={onEditar} className="px-4 py-2.5 rounded-xl font-bold text-[13px] border border-outline-variant text-on-surface-variant hover:bg-surface-container">Editar</button>
          <button onClick={onExportarPdf} className="px-4 py-2.5 rounded-xl font-bold text-[13px] border border-outline-variant text-on-surface-variant hover:bg-surface-container flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span> Exportar PDF
          </button>
          <button onClick={onExcluir} className="px-4 py-2.5 rounded-xl font-bold text-[13px] border border-error text-error hover:bg-error/10 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">delete</span> Excluir
          </button>
        </div>
      </div>

      <div className="bg-white-pure rounded-3xl p-6 border border-outline-variant shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-[13px] font-bold text-on-surface-variant uppercase tracking-wider">Progresso do Tratamento</label>
          <span className="text-[13px] font-bold text-primary">{sessoesTotaisFeitas}/{quantidadeTotal} sessões ({progresso}%)</span>
        </div>
        <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progresso}%` }} />
        </div>

        {!planoExecutavel && (
          <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            Aprove e inicie o tratamento para poder registrar sessões executadas.
          </p>
        )}

        <div className="divide-y divide-outline-variant/30">
          {plano.itens.map(item => (
            <ItemDoPlano
              key={item.id}
              item={item}
              podeRegistrarSessao={planoExecutavel && item.status !== 'Concluido' && item.status !== 'Cancelado'}
              onMudarStatus={(status) => onMudarStatusItem(item, status)}
              onRegistrarSessao={() => onRegistrarSessao(item)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Sub-tela: linha de um item do plano, com sessoes ----------

interface ItemDoPlanoProps {
  item: PlanoTratamentoItem;
  podeRegistrarSessao: boolean;
  onMudarStatus: (status: StatusItemPlanoTratamento) => void;
  onRegistrarSessao: () => void;
}

function ItemDoPlano({ item, podeRegistrarSessao, onMudarStatus, onRegistrarSessao }: ItemDoPlanoProps) {
  const [sessoesVisiveis, setSessoesVisiveis] = useState(false);
  const feitas = sessoesFeitas(item);
  const temSessoesRegistradas = (item.sessoes || []).length > 0;

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold text-[13px] text-on-surface">{item.servicoNome}</p>
          <p className="text-[12px] text-on-surface-variant">
            {feitas}/{item.quantidade} sessões · R$ {item.subtotal.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {temSessoesRegistradas && (
            <button
              type="button"
              onClick={() => setSessoesVisiveis(v => !v)}
              className="p-2 rounded-lg border border-outline-variant/60 text-on-surface-variant hover:text-primary hover:border-primary text-[12px] font-bold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">{sessoesVisiveis ? 'expand_less' : 'expand_more'}</span>
              Histórico
            </button>
          )}
          {podeRegistrarSessao && (
            <button
              type="button"
              onClick={onRegistrarSessao}
              className="px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white-pure text-[12px] font-bold flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
              Registrar Sessão
            </button>
          )}
          <select
            value={item.status}
            onChange={(e) => onMudarStatus(e.target.value as StatusItemPlanoTratamento)}
            className="p-2 bg-surface rounded-lg border border-outline-variant/60 text-[12px] font-bold"
          >
            {STATUS_ITEM_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {sessoesVisiveis && temSessoesRegistradas && (
        <div className="mt-3 ml-1 pl-4 border-l-2 border-outline-variant/40 space-y-3">
          {(item.sessoes || []).map(sessao => (
            <div key={sessao.id} className="text-[12px]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-on-surface">Sessão {sessao.numeroSessao}</span>
                <span className="text-on-surface-variant">
                  {sessao.dataSessao ? new Date(sessao.dataSessao + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                </span>
                {sessao.realizadoPor && <span className="text-on-surface-variant">· {sessao.realizadoPor}</span>}
              </div>
              {sessao.descricao && <p className="text-on-surface-variant mt-0.5">{sessao.descricao}</p>}
              {sessao.fotos.length > 0 && (
                <div className="flex gap-1.5 mt-1.5">
                  {sessao.fotos.map(foto => (
                    <Image
                      key={foto.id}
                      width={48}
                      height={48}
                      unoptimized
                      src={foto.url}
                      alt="Foto da sessão"
                      className="w-12 h-12 rounded-lg object-cover border border-outline-variant/60"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
