import type { AnamneseTemplateId } from './anamneseTemplates';

export interface TimelineItem {
  id: string;
  title: string;
  date: string;
  description: string;
  category: string;
  status: string;
  /** URL da assinatura do cliente que fechou este atendimento (bucket 'signatures'). */
  assinaturaUrl?: string;
  /** Quando o aceite foi dado -- validacao eletronica real do consentimento. */
  assinaturaAceiteEm?: string;
  /** Preenchido so quando a assinatura foi conscientemente dispensada. */
  assinaturaDispensadaMotivo?: string;
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

export interface AnamneseRespostaItem {
  valor: boolean | null;
  observacao?: string;
}

/** Conteudo de um PatientDocument do tipo 'Anamnese' gerado pelo motor generico (AnamneseForm). */
export interface AnamneseDocumentoConteudo {
  /** Presenca deste campo distingue do formato antigo (fichas retiradas). */
  templateId: AnamneseTemplateId;
  respostas: Record<string, AnamneseRespostaItem>;
  diagnosticoFisico?: Record<string, string>;
  lesoesPele?: string[];
  autorizaFotos: boolean;
  observacoesGerais?: string;
}

export interface PatientDocument {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  signed: boolean;
  signatureBase64?: string;
  /** Formato novo (AnamneseDocumentoConteudo) ou formato antigo de documentos ja salvos. */
  content?: AnamneseDocumentoConteudo | Record<string, unknown>;
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

/** Uma sessao de fato executada de um item do plano (ex: a 3a de 5 sessoes de Botox). */
export interface PlanoTratamentoSessao {
  id: string;
  itemId: string;
  planoId: string;
  clienteId: string;
  numeroSessao: number;
  dataSessao: string;
  descricao?: string;
  fotos: EvolutionPhoto[];
  realizadoPor?: string;
  criadoEm?: string;
  /** URL no bucket 'signatures' (ou base64 inline, se o upload falhar). */
  assinaturaUrl?: string;
  /** Quando o aceite foi dado -- validacao eletronica real do consentimento. */
  assinaturaAceiteEm?: string;
  /** Texto exato do termo apresentado no momento do aceite. */
  assinaturaTermo?: string;
  /** Preenchido so quando a assinatura foi conscientemente dispensada. */
  assinaturaDispensadaMotivo?: string;
}

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
  /** So vem preenchido no detalhe do plano; a listagem nao busca sessoes. */
  sessoes?: PlanoTratamentoSessao[];
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

