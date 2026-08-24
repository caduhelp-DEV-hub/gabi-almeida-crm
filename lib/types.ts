export interface TimelineItem {
  id: string;
  title: string;
  date: string;
  description: string;
  category: string;
  status: string;
}

export interface EvolutionPhoto {
  id: string;
  url: string;
  /** Data no formato DD/MM/AAAA. Editavel pelo prontuario. */
  date: string;
  type: 'Antes' | 'Depois' | 'Evolução';
  /** Observacao clinica opcional sobre a foto. */
  observacao?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  avatar: string;
  fotoDetalhes: string;
  ultimaVisita: string;
  tier: string;
  since: string;
  totalGasto: number;
  qtdeProcedimentos: number;
  dataUltimaFoto: string;
  status: string;
  ltv?: string;
  birthdate?: string;
  alergias: string;
  medicacoes: string;
  procedimentosAnteriores: string;
  notasEvolucao: string;
  fotoAntes: string;
  fotoDepois: string;
  fotosEvolucao: EvolutionPhoto[];
  historico: TimelineItem[];
  telefone?: string;
  cpf?: string;
  pronome?: string;
}

export type AgendamentoStatus = 'Confirmado' | 'Em Atendimento' | 'Finalizado' | 'Pendente';
export type AgendamentoCategoria = 'Estética' | 'Consulta';

export interface Agendamento {
  id: string;
  clienteId?: string;
  hora: string;
  clienteNome: string;
  clienteAvatar?: string;
  procedimento: string;
  status: AgendamentoStatus;
  profissional: string;
  categoria: AgendamentoCategoria;
  notas?: string;
  data: string;
  valor?: number;
}

export interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracao: string;
  categoria: string;
}

export interface Cobranca {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  status: string;
  valor: number;
}

export interface Despesa {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  status: string;
  valor: number;
}

export interface MsgPreDefinida {
  id: string;
  titulo: string;
  conteudo: string;
  gatilho: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  type?: string;
  salePrice?: number;
  costPrice?: number;
}

export type UserRole = 'admin' | 'staff' | 'prestador';
export type UserStatus = 'active' | 'inactive';

export interface UserPermissions {
  accessSystem: boolean;
  accessAgenda: boolean;
  accessFinanceiro: boolean;
  canSchedule: boolean;
  editPatients: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  specialty?: string;
  phone?: string;
  avatar?: string;
  commissionRate?: number;
  permissions?: UserPermissions;
  createdAt?: string;
}

export interface CommissionLeader {
  name: string;
  avatar: string;
  revenue: number;
  commission: number;
}

export type StatusPlanoTratamento =
  | 'Rascunho'
  | 'Aguardando aprovacao'
  | 'Aprovado'
  | 'Em tratamento'
  | 'Concluido'
  | 'Cancelado';

export type StatusItemPlanoTratamento =
  | 'Pendente'
  | 'Agendado'
  | 'Em andamento'
  | 'Concluido'
  | 'Cancelado';

export interface PlanoTratamentoItem {
  id: string;
  planoId: string;
  servicoId?: string;
  servicoNome: string;
  precoUnitario: number;
  quantidade: number;
  desconto: number;
  subtotal: number;
  status: StatusItemPlanoTratamento;
  ordem: number;
  concluidoEm?: string;
}

export interface PlanoTratamento {
  id: string;
  clienteId: string;
  clienteNome?: string;
  titulo?: string;
  status: StatusPlanoTratamento;
  valorTotal: number;
  descontoTotal: number;
  validadeOrcamento?: string;
  observacoes?: string;
  aprovadoEm?: string;
  iniciadoEm?: string;
  concluidoEm?: string;
  canceladoEm?: string;
  criadoEm?: string;
  itens: PlanoTratamentoItem[];
}

// Abas navegaveis do sistema (usado pela Sidebar e pelo estado da page)
export type SystemTab =
  | 'dashboard'
  | 'agenda'
  | 'clientes'
  | 'financeiro'
  | 'usuarios'
  | 'cadastro-cliente'
  | 'servicos'
  | 'planos-tratamento'
  | 'estoque'
  | 'venda-skincare'
  | 'comandas'
  | 'mensagens-pre'
  | 'despesas'
  | 'funcionarios'
  | 'relatorios-performance'
  | 'relatorios-financeiro'
  | 'relatorios-melhores-clientes'
  | 'configuracoes'
  | 'dados-empresa'
  | 'sobre';

