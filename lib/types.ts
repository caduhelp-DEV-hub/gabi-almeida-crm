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

export interface Patient {
  id: string;
  name: string;
  avatar: string;
  detailsAvatar: string;
  lastVisit: string;
  tier: string;
  since: string;
  totalSpent: number;
  proceduresCount: number;
  lastPhotoDate: string;
  status: string;
  ltv?: string;
  birthdate?: string;
  allergies: string;
  medications: string;
  previousProcedures: string;
  evolutionNotes: string;
  beforePhoto: string;
  afterPhoto: string;
  evolutionPhotos: EvolutionPhoto[];
  timeline: TimelineItem[];
  phone?: string;
  cpf?: string;
  pronoun?: string;
}

export type AppointmentStatus = 'Confirmado' | 'Em Atendimento' | 'Finalizado' | 'Pendente';
export type AppointmentCategory = 'Estética' | 'Consulta';

export interface Appointment {
  id: string;
  patientId?: string;
  time: string;
  patientName: string;
  patientAvatar?: string;
  procedure: string;
  status: AppointmentStatus;
  professional: string;
  category: AppointmentCategory;
  notes?: string;
  date: string;
}

export interface ServiceObj {
  id: string;
  name: string;
  price: number;
  duration: string;
  category: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
}

export type TransactionStatus = 'Confirmado' | 'Pago' | 'Pendente';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  status: TransactionStatus;
  value: number;
}

export interface CommissionLeader {
  name: string;
  avatar: string;
  revenue: number;
  commission: number;
}

export type UserRole = 'admin' | 'staff' | 'prestador';
export type UserStatus = 'active' | 'inactive';

export interface UserPermissions {
  accessCRM: boolean;
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
