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
  date: string;
  type: 'Antes' | 'Depois' | 'Evolução';
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

