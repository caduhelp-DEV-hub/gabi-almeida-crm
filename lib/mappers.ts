import type { AppUser, Cliente, Agendamento, InventoryItem, Servico, Cobranca, PlanoTratamento, PlanoTratamentoItem, PlanoTratamentoSessao } from './types';
import { dataLocalISO } from './utils';

/**
 * Colunas de `users` que o frontend pode ler.
 * Nunca use select('*') nessa tabela: ela contem `password_hash`.
 * Mantenha em sincronia com mapUserToFrontend abaixo.
 */
export const USER_PUBLIC_COLUMNS =
  'id, name, username, role, status, specialty, phone, avatar, commission_rate, permissions, created_at';

/**
 * Colunas leves de `clientes`, para a listagem.
 *
 * Fora daqui ficam de proposito: foto_antes, foto_depois, fotos_evolucao,
 * documents e financials. Essas cinco guardam imagens/arquivos em base64 e
 * respondiam por ~99% do trafego: carregar a lista completa baixava 2,4 MB em
 * 3,6s, sendo 2,2 MB so de imagem que a tela de lista nem mostra.
 * Elas sao buscadas sob demanda com CLIENTE_DETALHE_COLUMNS.
 */
export const CLIENTE_LIST_COLUMNS =
  'id, nome, avatar, foto_detalhes, ultima_visita, tier, since, total_gasto, qtde_procedimentos, ' +
  'data_ultima_foto, status, alergias, medicacoes, procedimentos_anteriores, notas_evolucao, ' +
  'historico, telefone, cpf, created_at, pronome';

/** Campos pesados de um cliente, carregados so quando o prontuario e aberto. */
export const CLIENTE_DETALHE_COLUMNS =
  'id, foto_antes, foto_depois, fotos_evolucao, documents, financials';

export const mapUserToFrontend = (u: any): AppUser => ({
  id: u.id,
  name: u.name,
  username: u.username,
  role: u.role,
  status: u.status,
  specialty: u.specialty,
  phone: u.phone,
  avatar: u.avatar,
  commissionRate: u.commission_rate,
  permissions: u.permissions
});

export const mapUserToBackend = (u: Partial<AppUser>): Record<string, unknown> => {
  const res: Record<string, unknown> = {};
  if (u.id !== undefined) res.id = u.id;
  if (u.name !== undefined) res.name = u.name;
  if (u.username !== undefined) res.username = u.username;
  if (u.role !== undefined) res.role = u.role;
  if (u.status !== undefined) res.status = u.status;
  if (u.specialty !== undefined) res.specialty = u.specialty;
  if (u.phone !== undefined) res.phone = u.phone;
  if (u.avatar !== undefined) res.avatar = u.avatar;
  if (u.commissionRate !== undefined) res.commission_rate = u.commissionRate;
  if (u.permissions !== undefined) res.permissions = u.permissions;
  return res;
};

export const mapClienteToFrontend = (c: any): Cliente => ({
  id: c.id,
  nome: c.nome || c.name,
  avatar: c.avatar,
  fotoDetalhes: c.foto_detalhes,
  ultimaVisita: c.ultima_visita,
  tier: c.tier,
  since: c.since,
  totalGasto: Number(c.total_gasto || 0),
  qtdeProcedimentos: Number(c.qtde_procedimentos || 0),
  dataUltimaFoto: c.data_ultima_foto,
  status: c.status,
  alergias: c.alergias,
  medicacoes: c.medicacoes,
  procedimentosAnteriores: c.procedimentos_anteriores,
  notasEvolucao: c.notas_evolucao,
  fotoAntes: c.foto_antes,
  fotoDepois: c.foto_depois,
  fotosEvolucao: c.fotos_evolucao || [],
  historico: c.historico || [],
  telefone: c.telefone,
  cpf: c.cpf,
  pronome: c.pronome
});

export const mapClienteToBackend = (c: Partial<Cliente>): Record<string, unknown> => {
  const res: Record<string, unknown> = {};
  if (c.id !== undefined) res.id = c.id;
  if (c.nome !== undefined) res.nome = c.nome;
  if (c.avatar !== undefined) res.avatar = c.avatar;
  if (c.fotoDetalhes !== undefined) res.foto_detalhes = c.fotoDetalhes;
  if (c.ultimaVisita !== undefined) res.ultima_visita = c.ultimaVisita;
  if (c.tier !== undefined) res.tier = c.tier;
  if (c.since !== undefined) res.since = c.since;
  if (c.totalGasto !== undefined) res.total_gasto = c.totalGasto;
  if (c.qtdeProcedimentos !== undefined) res.qtde_procedimentos = c.qtdeProcedimentos;
  if (c.dataUltimaFoto !== undefined) res.data_ultima_foto = c.dataUltimaFoto;
  if (c.status !== undefined) res.status = c.status;
  if (c.alergias !== undefined) res.alergias = c.alergias;
  if (c.medicacoes !== undefined) res.medicacoes = c.medicacoes;
  if (c.procedimentosAnteriores !== undefined) res.procedimentos_anteriores = c.procedimentosAnteriores;
  if (c.notasEvolucao !== undefined) res.notas_evolucao = c.notasEvolucao;
  if (c.fotoAntes !== undefined) res.foto_antes = c.fotoAntes;
  if (c.fotoDepois !== undefined) res.foto_depois = c.fotoDepois;
  if (c.fotosEvolucao !== undefined) res.fotos_evolucao = c.fotosEvolucao;
  if (c.historico !== undefined) res.historico = c.historico;
  if (c.telefone !== undefined) res.telefone = c.telefone;
  if (c.cpf !== undefined) res.cpf = c.cpf;
  if (c.pronome !== undefined) res.pronome = c.pronome;
  return res;
};

export const mapAgendamentoToFrontend = (a: any): Agendamento => ({
  id: a.id,
  clienteId: a.cliente_id,
  hora: a.hora,
  clienteNome: a.clientes?.nome || a.cliente_nome,
  clienteAvatar: a.clientes?.avatar || a.cliente_avatar,
  procedimento: a.procedimento,
  status: a.status,
  profissional: a.profissional,
  categoria: a.categoria,
  notas: a.notas,
  data: a.data || dataLocalISO(),
  valor: a.valor !== undefined && a.valor !== null ? Number(a.valor) : undefined
});

export const mapAgendamentoToBackend = (a: Partial<Agendamento>): Record<string, unknown> => {
  const res: Record<string, unknown> = {};
  if (a.id !== undefined) res.id = a.id;
  if (a.clienteId !== undefined) res.cliente_id = a.clienteId;
  if (a.hora !== undefined) res.hora = a.hora;
  if (a.clienteNome !== undefined) res.cliente_nome = a.clienteNome;
  if (a.clienteAvatar !== undefined) res.cliente_avatar = a.clienteAvatar;
  if (a.procedimento !== undefined) res.procedimento = a.procedimento;
  if (a.status !== undefined) res.status = a.status;
  if (a.profissional !== undefined) res.profissional = a.profissional;
  if (a.categoria !== undefined) res.categoria = a.categoria;
  if (a.notas !== undefined) res.notas = a.notas;
  if (a.data !== undefined) res.data = a.data;
  if (a.valor !== undefined) res.valor = a.valor;
  return res;
};

export const mapInventoryToFrontend = (i: any): InventoryItem => ({
  id: i.id,
  name: i.name,
  quantity: Number(i.quantity || 0),
  minQuantity: Number(i.min_quantity || 0),
  unit: i.unit,
  type: i.tipo_produto,
  salePrice: i.preco_venda ? Number(i.preco_venda) : undefined,
  costPrice: i.preco_custo ? Number(i.preco_custo) : undefined
});

export const mapInventoryToBackend = (i: Partial<InventoryItem>): Record<string, unknown> => {
  const res: Record<string, unknown> = {};
  if (i.id !== undefined) res.id = i.id;
  if (i.name !== undefined) res.name = i.name;
  if (i.quantity !== undefined) res.quantity = i.quantity;
  if (i.minQuantity !== undefined) res.min_quantity = i.minQuantity;
  if (i.unit !== undefined) res.unit = i.unit;
  if (i.type !== undefined) res.tipo_produto = i.type;
  if (i.salePrice !== undefined) res.preco_venda = i.salePrice;
  if (i.costPrice !== undefined) res.preco_custo = i.costPrice;
  return res;
};

export const mapCobrancaToFrontend = (c: any): Cobranca => ({
  id: c.id,
  data: c.data,
  descricao: c.descricao,
  categoria: c.categoria,
  status: c.status,
  valor: Number(c.valor || 0)
});

export const mapCobrancaToBackend = (c: Partial<Cobranca>): Record<string, unknown> => {
  const res: Record<string, unknown> = {};
  if (c.id !== undefined) res.id = c.id;
  if (c.data !== undefined) res.data = c.data;
  if (c.descricao !== undefined) res.descricao = c.descricao;
  if (c.categoria !== undefined) res.categoria = c.categoria;
  if (c.status !== undefined) res.status = c.status;
  if (c.valor !== undefined) res.valor = c.valor;
  return res;
};

export const mapServicoToFrontend = (s: any): Servico => ({
  id: s.id,
  nome: s.nome,
  preco: Number(s.preco || 0),
  duracao: s.duracao,
  categoria: s.categoria
});

export const mapServicoToBackend = (s: Partial<Servico>): Record<string, unknown> => {
  const res: Record<string, unknown> = {};
  if (s.id !== undefined) res.id = s.id;
  if (s.nome !== undefined) res.nome = s.nome;
  if (s.preco !== undefined) res.preco = s.preco;
  if (s.duracao !== undefined) res.duracao = s.duracao;
  if (s.categoria !== undefined) res.categoria = s.categoria;
  return res;
};

export const mapPlanoTratamentoToFrontend = (p: any): PlanoTratamento => ({
  id: p.id,
  clienteId: p.cliente_id,
  clienteNome: p.clientes?.nome,
  titulo: p.titulo,
  status: p.status,
  valorTotal: Number(p.valor_total || 0),
  descontoTotal: Number(p.desconto_total || 0),
  validadeOrcamento: p.validade_orcamento,
  observacoes: p.observacoes,
  aprovadoEm: p.aprovado_em,
  iniciadoEm: p.iniciado_em,
  concluidoEm: p.concluido_em,
  canceladoEm: p.cancelado_em,
  criadoEm: p.criado_em,
  itens: (p.planos_tratamento_itens || []).map(mapPlanoTratamentoItemToFrontend)
});

export const mapPlanoTratamentoToBackend = (p: Partial<PlanoTratamento>): Record<string, unknown> => {
  const res: Record<string, unknown> = {};
  if (p.id !== undefined) res.id = p.id;
  if (p.clienteId !== undefined) res.cliente_id = p.clienteId;
  if (p.titulo !== undefined) res.titulo = p.titulo;
  if (p.status !== undefined) res.status = p.status;
  if (p.valorTotal !== undefined) res.valor_total = p.valorTotal;
  if (p.descontoTotal !== undefined) res.desconto_total = p.descontoTotal;
  // Coluna date no banco: string vazia (input de data deixado em branco) e
  // invalida para o Postgres ("invalid input syntax for type date"). NULL
  // representa corretamente "sem validade definida".
  if (p.validadeOrcamento !== undefined) res.validade_orcamento = p.validadeOrcamento || null;
  if (p.observacoes !== undefined) res.observacoes = p.observacoes;
  if (p.aprovadoEm !== undefined) res.aprovado_em = p.aprovadoEm;
  if (p.iniciadoEm !== undefined) res.iniciado_em = p.iniciadoEm;
  if (p.concluidoEm !== undefined) res.concluido_em = p.concluidoEm;
  if (p.canceladoEm !== undefined) res.cancelado_em = p.canceladoEm;
  return res;
};

export const mapPlanoTratamentoItemToFrontend = (i: any): PlanoTratamentoItem => ({
  id: i.id,
  planoId: i.plano_id,
  servicoId: i.servico_id,
  servicoNome: i.servico_nome,
  precoUnitario: Number(i.preco_unitario || 0),
  quantidade: Number(i.quantidade || 0),
  desconto: Number(i.desconto || 0),
  subtotal: Number(i.subtotal || 0),
  status: i.status,
  ordem: Number(i.ordem || 0),
  concluidoEm: i.concluido_em
});

export const mapPlanoTratamentoItemToBackend = (i: Partial<PlanoTratamentoItem>): Record<string, unknown> => {
  const res: Record<string, unknown> = {};
  if (i.id !== undefined) res.id = i.id;
  if (i.planoId !== undefined) res.plano_id = i.planoId;
  if (i.servicoId !== undefined) res.servico_id = i.servicoId;
  if (i.servicoNome !== undefined) res.servico_nome = i.servicoNome;
  if (i.precoUnitario !== undefined) res.preco_unitario = i.precoUnitario;
  if (i.quantidade !== undefined) res.quantidade = i.quantidade;
  if (i.desconto !== undefined) res.desconto = i.desconto;
  if (i.subtotal !== undefined) res.subtotal = i.subtotal;
  if (i.status !== undefined) res.status = i.status;
  if (i.ordem !== undefined) res.ordem = i.ordem;
  if (i.concluidoEm !== undefined) res.concluido_em = i.concluidoEm;
  return res;
};

export const mapPlanoTratamentoSessaoToFrontend = (s: any): PlanoTratamentoSessao => ({
  id: s.id,
  itemId: s.item_id,
  planoId: s.plano_id,
  clienteId: s.cliente_id,
  numeroSessao: Number(s.numero_sessao || 0),
  dataSessao: s.data_sessao,
  descricao: s.descricao,
  fotos: s.fotos || [],
  realizadoPor: s.realizado_por,
  criadoEm: s.criado_em
});

export const mapPlanoTratamentoSessaoToBackend = (s: Partial<PlanoTratamentoSessao>): Record<string, unknown> => {
  const res: Record<string, unknown> = {};
  if (s.id !== undefined) res.id = s.id;
  if (s.itemId !== undefined) res.item_id = s.itemId;
  if (s.planoId !== undefined) res.plano_id = s.planoId;
  if (s.clienteId !== undefined) res.cliente_id = s.clienteId;
  if (s.numeroSessao !== undefined) res.numero_sessao = s.numeroSessao;
  if (s.dataSessao !== undefined) res.data_sessao = s.dataSessao;
  if (s.descricao !== undefined) res.descricao = s.descricao;
  if (s.fotos !== undefined) res.fotos = s.fotos;
  if (s.realizadoPor !== undefined) res.realizado_por = s.realizadoPor;
  return res;
};

export const getAppointmentColorClass = (status: string, notas: string = ''): string => {
  if (notas.includes('[CONFLITO]')) {
    return 'bg-red-600 border-red-800 text-white-pure animate-pulse shadow-md';
  }
  switch (status) {
    case 'Finalizado':
      return 'bg-emerald-50/90 border-emerald-500 text-emerald-800 hover:bg-emerald-100/90';
    case 'Em Atendimento':
      return 'bg-cyan-50/90 border-cyan-500 text-cyan-800 hover:bg-cyan-100/90';
    case 'Confirmado':
      return 'bg-amber-50/90 border-amber-500 text-amber-800 hover:bg-amber-100/90';
    case 'Pendente':
    default:
      return 'bg-slate-50/90 border-slate-400 text-slate-700 hover:bg-slate-100/90';
  }
};
