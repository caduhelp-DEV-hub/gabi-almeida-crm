import type { AppUser, Cliente, Agendamento, InventoryItem, Servico, Cobranca, Despesa } from './types';

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
  data: a.data || new Date().toISOString().split('T')[0]
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
  return res;
};

export const mapInventoryToFrontend = (i: any): InventoryItem => ({
  id: i.id,
  name: i.name,
  quantity: Number(i.quantity || 0),
  minQuantity: Number(i.min_quantity || 0),
  unit: i.unit
});

export const mapInventoryToBackend = (i: Partial<InventoryItem>): Record<string, unknown> => {
  const res: Record<string, unknown> = {};
  if (i.id !== undefined) res.id = i.id;
  if (i.name !== undefined) res.name = i.name;
  if (i.quantity !== undefined) res.quantity = i.quantity;
  if (i.minQuantity !== undefined) res.min_quantity = i.minQuantity;
  if (i.unit !== undefined) res.unit = i.unit;
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

export const getAppointmentColorClass = (status: string): string => {
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
