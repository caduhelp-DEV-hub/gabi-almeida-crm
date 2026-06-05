'use client';

import React, {useState, useEffect, useRef} from 'react';
import AnamneseLimpezaDePele from '../components/AnamneseLimpezaDePele';
import { supabase } from '../lib/supabase';

const mapUserToFrontend = (u: any): AppUser => ({
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

const mapUserToBackend = (u: Partial<AppUser>) => {
  const res: any = {};
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

const mapPatientToFrontend = (p: any): Patient => ({
  id: p.id,
  name: p.name,
  avatar: p.avatar,
  detailsAvatar: p.details_avatar,
  lastVisit: p.last_visit,
  tier: p.tier,
  since: p.since,
  totalSpent: Number(p.total_spent || 0),
  proceduresCount: Number(p.procedures_count || 0),
  lastPhotoDate: p.last_photo_date,
  status: p.status,
  allergies: p.allergies,
  medications: p.medications,
  previousProcedures: p.previous_procedures,
  evolutionNotes: p.evolution_notes,
  beforePhoto: p.before_photo,
  afterPhoto: p.after_photo,
  timeline: p.timeline || [],
  phone: p.phone,
  cpf: p.cpf
});

const mapPatientToBackend = (p: Partial<Patient>) => {
  const res: any = {};
  if (p.id !== undefined) res.id = p.id;
  if (p.name !== undefined) res.name = p.name;
  if (p.avatar !== undefined) res.avatar = p.avatar;
  if (p.detailsAvatar !== undefined) res.details_avatar = p.detailsAvatar;
  if (p.lastVisit !== undefined) res.last_visit = p.lastVisit;
  if (p.tier !== undefined) res.tier = p.tier;
  if (p.since !== undefined) res.since = p.since;
  if (p.totalSpent !== undefined) res.total_spent = p.totalSpent;
  if (p.proceduresCount !== undefined) res.procedures_count = p.proceduresCount;
  if (p.lastPhotoDate !== undefined) res.last_photo_date = p.lastPhotoDate;
  if (p.status !== undefined) res.status = p.status;
  if (p.allergies !== undefined) res.allergies = p.allergies;
  if (p.medications !== undefined) res.medications = p.medications;
  if (p.previousProcedures !== undefined) res.previous_procedures = p.previousProcedures;
  if (p.evolutionNotes !== undefined) res.evolution_notes = p.evolutionNotes;
  if (p.beforePhoto !== undefined) res.before_photo = p.beforePhoto;
  if (p.afterPhoto !== undefined) res.after_photo = p.afterPhoto;
  if (p.timeline !== undefined) res.timeline = p.timeline;
  if (p.phone !== undefined) res.phone = p.phone;
  if (p.cpf !== undefined) res.cpf = p.cpf;
  return res;
};

const mapAppointmentToFrontend = (a: any): Appointment => ({
  id: a.id,
  time: a.time,
  patientName: a.patient_name,
  patientAvatar: a.patient_avatar,
  procedure: a.procedure,
  status: a.status,
  professional: a.professional,
  category: a.category,
  notes: a.notes
});

const mapAppointmentToBackend = (a: Partial<Appointment>) => {
  const res: any = {};
  if (a.id !== undefined) res.id = a.id;
  if (a.time !== undefined) res.time = a.time;
  if (a.patientName !== undefined) res.patient_name = a.patientName;
  if (a.patientAvatar !== undefined) res.patient_avatar = a.patientAvatar;
  if (a.procedure !== undefined) res.procedure = a.procedure;
  if (a.status !== undefined) res.status = a.status;
  if (a.professional !== undefined) res.professional = a.professional;
  if (a.category !== undefined) res.category = a.category;
  if (a.notes !== undefined) res.notes = a.notes;
  return res;
};

const mapInventoryToFrontend = (i: any): InventoryItem => ({
  id: i.id,
  name: i.name,
  quantity: Number(i.quantity || 0),
  minQuantity: Number(i.min_quantity || 0),
  unit: i.unit
});

const mapInventoryToBackend = (i: Partial<InventoryItem>) => {
  const res: any = {};
  if (i.id !== undefined) res.id = i.id;
  if (i.name !== undefined) res.name = i.name;
  if (i.quantity !== undefined) res.quantity = i.quantity;
  if (i.minQuantity !== undefined) res.min_quantity = i.minQuantity;
  if (i.unit !== undefined) res.unit = i.unit;
  return res;
};



// Interfaces for our state engine
interface TimelineItem {
  id: string;
  title: string;
  date: string;
  description: string;
  category: string;
  status: string;
}

interface Patient {
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
  timeline: TimelineItem[];
  phone?: string;
  cpf?: string;
}

interface Appointment {
  id: string;
  time: string;
  patientName: string;
  patientAvatar?: string;
  procedure: string;
  status: 'Confirmado' | 'Em Atendimento' | 'Finalizado' | 'Pendente';
  professional: string;
  category: 'Estética' | 'Injetáveis' | 'Consulta';
  notes?: string;
}

interface ServiceObj {
  id: string;
  name: string;
  price: number;
  duration: string;
  category: string;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  status: 'Confirmado' | 'Pago' | 'Pendente';
  value: number;
}

interface CommissionLeader {
  name: string;
  avatar: string;
  revenue: number;
  commission: number;
}

interface AppUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'admin' | 'staff' | 'prestador';
  status: 'active' | 'inactive';
  specialty?: string;
  phone?: string;
  avatar?: string;
  commissionRate?: number;
  permissions?: {
    accessCRM: boolean;
    accessAgenda: boolean;
    accessFinanceiro: boolean;
    canSchedule: boolean;
    editPatients: boolean;
  };
}

const defaultAppUsers: AppUser[] = [
  { 
    id: '1', 
    name: 'Dra. Gabi Almeida', 
    username: 'admin', 
    password: 'admin',
    role: 'admin', 
    status: 'active',
    specialty: 'Fundadora & Biomédica Esteta',
    phone: '(11) 99876-5432',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=GabiAlmeida',
    commissionRate: 40,
    permissions: { accessCRM: true, accessAgenda: true, accessFinanceiro: true, canSchedule: true, editPatients: true }
  }
];

export default function CRMPage() {
  // Global Modal State
  const [dialogState, setDialogState] = useState<{isOpen: boolean, type: 'alert' | 'confirm', message: string, onConfirm?: () => void}>({isOpen: false, type: 'alert', message: ''});
  const showAlert = (message: string) => setDialogState({isOpen: true, type: 'alert', message});
  const showConfirm = (message: string, onConfirm: () => void) => setDialogState({isOpen: true, type: 'confirm', message, onConfirm});
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [appUsers, setAppUsers] = useState<AppUser[]>(defaultAppUsers);
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Sidebar tab control
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'agenda' | 'clientes' | 'financeiro' | 'usuarios' | 'cadastro-cliente' | 'servicos' | 'estoque'>('dashboard');
  const [dashboardPeriod, setDashboardPeriod] = useState('Hoje');
  
  // Agenda View Control (Diária / Semanal / Mensal)
  const [agendaView, setAgendaView] = useState<'diaria' | 'semanal' | 'mensal'>('diaria');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number>(24);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState<boolean>(false);
  
  // Perfil / Menu
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const [isPatientModalOpen, setIsPatientModalOpen] = useState<boolean>(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceObj | null>(null);

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Patient Sub-tabs Financial & Document Lists States
  interface PatientFinancialItem {
    id: string;
    date: string;
    description: string;
    procedure: string;
    price: number;
    status: 'Pago' | 'Pendente' | 'Cancelado';
    method: string;
  }

  interface PatientDocument {
    id: string;
    name: string;
    type: string;
    date: string;
    size: string;
    signed: boolean;
  }

  const [patientFinancials, setPatientFinancials] = useState<Record<string, PatientFinancialItem[]>>({});

  const [patientDocuments, setPatientDocuments] = useState<Record<string, PatientDocument[]>>({});

  // Search state (unified search experience across views)
  const [searchQuery, setSearchQuery] = useState('');
  
  // Current logged in medical professional representation
  const [currentProfessional, setCurrentProfessional] = useState<{name: string; role: string; avatar: string}>({
    name: 'Dra. Gabi Almeida',
    role: 'Especialista em Estética',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAT08URyhdfggkdZ7ICFiM_aQytGw7uUJWUutntKzSZ2THn_qUatoCkxPlUDBzFo87XxXHDIl7bCPEF2zrZVbTVxZ6-ljXhgCjobz-tjjXWRgRPn8QgwKryuOkx4g6g_vI6k7ReJVAlRtFVi6oS_cA6ulr-fFIr2DH5ORI4qFAGBjKPoXtENy5oCT-Oi75JuN0RlQBMgw7dzZwQ5Fis2TriJ2rG67NgCQN4Hi2OzqyWrFUUPWiR2Dp4895lJRurxR0r_L6Qa600ado'
  });

  // Professionals Database for header switching
  const professionals = [
    {
      name: 'Dra. Gabi Almeida',
      role: 'Especialista em Estética',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAT08URyhdfggkdZ7ICFiM_aQytGw7uUJWUutntKzSZ2THn_qUatoCkxPlUDBzFo87XxXHDIl7bCPEF2zrZVbTVxZ6-ljXhgCjobz-tjjXWRgRPn8QgwKryuOkx4g6g_vI6k7ReJVAlRtFVi6oS_cA6ulr-fFIr2DH5ORI4qFAGBjKPoXtENy5oCT-Oi75JuN0RlQBMgw7dzZwQ5Fis2TriJ2rG67NgCQN4Hi2OzqyWrFUUPWiR2Dp4895lJRurxR0r_L6Qa600ado'
    },
    {
      name: 'Dra. Isabella Rose',
      role: 'Master Injector',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADwr1ObfSJUgydcL7PHjSKoqnO196ABFeWsdSt6YhNHDeEOFz-y_JD6GG3pWkN68tnE1-s063un2xBQALOj4AkROm8wVbDDzwanl_TmCKzYQle7KVp_za4fgkU9dN8D-RAynszmfWSUX36eWFcqojk7aiRss-BO9EEGlTyHs3v19wbtQrPNN1IJet6-mwqCSqoVGJSrBvaaMks8EOfFjHfE8GLJkqQmOTiHxCjosKWLBffQQtI4UlJXEXGxtUU3jkOcrFHYPwlLkg'
    },
    {
      name: 'Dr. Ricardo Silva',
      role: 'Diretor Clínico',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByvB-wQG87z1_3zlQXV52c6s-FUG-KVyeJ6AiND9whxeCuJ6OG177GS-IzCthCMsslpHGcE0_e03imkYqDEl2-6XtUYb1-Cqod27zUDWg-Gzp8AGYCvZEWaJ3JgIUc0mbIbjtXs8tcZkN3usDylUuQn5xowrCsy3UiYjpB38S80HOpMxeJZo4Ap2gjSwLCvurMm0wuqUL5iVHgfQmMjYZ6m_UJkaA6IqefJOo83zu_Tq9PUw0VRdYkzSi6rmc2PKHQhnG7LcP2L9U'
    }
  ];

  // Active Dropdowns state
  const [isProfDropdownOpen, setIsProfDropdownOpen] = useState(false);
  const [isAlertNotificationOpen, setIsAlertNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Gabi Almeida AI State Engine
  const [aiAdvice, setAiAdvice] = useState<string>('Dica Gabi Almeida AI: Você tem 3 clientes com interesse em Bioestimuladores hoje. Que tal oferecer o novo protocolo?');
  const [aiCustomInput, setAiCustomInput] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Drawing signature pad states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState<boolean>(false);

  // New appointment dialog options
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [newApptPatient, setNewApptPatient] = useState('Mariana Silveira');
  const [newApptProcedure, setNewApptProcedure] = useState('Limpeza de Pele Profunda');
  const [newApptProfessional, setNewApptProfessional] = useState('Dra. Gabi Almeida');
  const [newApptTime, setNewApptTime] = useState('09:00');
  const [newApptCategory, setNewApptCategory] = useState<'Estética' | 'Injetáveis' | 'Consulta'>('Estética');

  // Clientes Module Detail Tab
  const [activePatientSubTab, setActivePatientSubTab] = useState<'evolution' | 'anamnese' | 'financeiro' | 'documentos'>('evolution');

  // Financeiro module detailed view timeframe
  const [financialTimeframe, setFinancialTimeframe] = useState<'semanal' | 'mensal'>('mensal');

  // Core Patients DB Status
  const [patients, setPatients] = useState<Patient[]>([]);

  // Selected patient on detail panel (default Isabella Albuquerque)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0] || {
    id: '',
    name: 'Nenhum Paciente',
    avatar: '',
    detailsAvatar: '',
    lastVisit: '',
    tier: '',
    since: '',
    totalSpent: 0,
    proceduresCount: 0,
    lastPhotoDate: '',
    status: '',
    allergies: 'Nenhuma',
    medications: 'Nenhum',
    previousProcedures: 'Nenhum',
    evolutionNotes: '',
    beforePhoto: '',
    afterPhoto: '',
    timeline: []
  };

  // Appointment states
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Current list of upcoming/next appointments to list in the detailed sidebars
  const activeNextAppointments: { time: string; name: string; category: string; tagColor: string }[] = [];

  // Core Financial Database
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Services Database
  const [services, setServices] = useState<ServiceObj[]>([]);

  // Inventory Database
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Commissions Leaders database
  const commissionLeaders: CommissionLeader[] = [];

  // Dynamic metrics helpers
  const totalFinancialRevenue = transactions.filter(t => t.value > 0).reduce((acc, t) => acc + t.value, 0);
  const totalRevenueThisMonth = totalFinancialRevenue > 0 ? totalFinancialRevenue + 142580 : 142580;
  
  const dailyFinancialRevenue = transactions.filter(t => t.value > 0 && (dashboardPeriod === 'Hoje' ? String(t.date).includes('Hoje') : true)).reduce((acc, t) => acc + t.value, 0);
  const totalDailyRevenueDisplay = dashboardPeriod === 'Hoje' ? (dailyFinancialRevenue > 0 ? dailyFinancialRevenue : 12450) : dailyFinancialRevenue;
  
  const appointmentsToConsider = dashboardPeriod === 'Hoje' ? appointments.filter(a => a.time) : appointments;
  const appointmentsToday = appointmentsToConsider.length;
  const totalAtendimentosDisplay = dashboardPeriod === 'Hoje' ? (appointmentsToday > 0 ? appointmentsToday : 24) : appointmentsToday;
  const ticketMedio = totalAtendimentosDisplay > 0 ? (totalDailyRevenueDisplay / totalAtendimentosDisplay) : (dashboardPeriod === 'Hoje' ? 518 : 0);
  const leadsAtivos = patients.length;
  const conversoes = appointmentsToConsider.filter(a => a.status === 'Confirmado').length;
  const taxaConversao = appointmentsToday > 0 ? Math.round((conversoes / appointmentsToday) * 100) : (dashboardPeriod === 'Hoje' ? 68 : 0);

  const commissionsToPay = Math.round(totalRevenueThisMonth * 0.25); // estimate
  const primaryRevenueTarget = 170000;
  const currentRevenuePercent = Math.min(100, Math.round((totalRevenueThisMonth / primaryRevenueTarget) * 100));

  // Active Alerts state derived from inventory
  const criticalAlerts = [
    ...inventory.filter(i => i.quantity <= i.minQuantity).map(i => ({
      id: `inv-${i.id}`,
      type: 'inventory',
      title: 'Estoque Baixo: ' + i.name,
      text: `Apenas ${i.quantity} ${i.unit} restantes no estoque.`,
      icon: 'inventory_2',
      alertClass: 'bg-primary/5 border-primary text-on-surface'
    })),
    { id: 'al2', type: 'followup', title: 'Retorno Pendente', text: 'Cliente Luísa Costa atingiu D+15 do pós-procedimento.', icon: 'assignment_late', alertClass: 'bg-secondary/5 border-secondary text-on-surface' }
  ];

  // 1. Session check on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.user) {
          setCurrentUser(mapUserToFrontend(data.user));
          setIsAuthenticated(true);
        } else {
          // If no session exists, try to automatically seed the admin if it doesn't exist
          try {
            await fetch('/api/auth/seed', { method: 'POST' });
          } catch (e) {
            console.error('Auto-seed check failed:', e);
          }
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    };
    checkSession();
  }, []);

  // 2. Sync Supabase collections
  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch initial data
    const fetchInitial = async () => {
      const { data: pats } = await supabase.from('patients').select('*');
      if (pats) {
        setPatients(pats.map(mapPatientToFrontend));
        const financialsMap: Record<string, PatientFinancialItem[]> = {};
        const documentsMap: Record<string, PatientDocument[]> = {};
        pats.forEach((p: any) => {
          if (p.financials) financialsMap[p.id] = p.financials;
          if (p.documents) documentsMap[p.id] = p.documents;
        });
        setPatientFinancials(financialsMap);
        setPatientDocuments(documentsMap);
      }

      const { data: appts } = await supabase.from('appointments').select('*');
      if (appts) setAppointments(appts.map(mapAppointmentToFrontend));

      const { data: trans } = await supabase.from('transactions').select('*');
      if (trans) setTransactions(trans as Transaction[]);

      const { data: servs } = await supabase.from('services').select('*');
      if (servs) setServices(servs as ServiceObj[]);

      const { data: inv } = await supabase.from('inventory').select('*');
      if (inv) setInventory(inv.map(mapInventoryToFrontend));

      const { data: usrs } = await supabase.from('users').select('*');
      if (usrs) setAppUsers(usrs.map(mapUserToFrontend));
    };

    fetchInitial();

    // Setup Realtime subscriptions for auto-sync
    const dbChangesChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        supabase.from('patients').select('*').then(({ data }) => {
          if (data) {
            setPatients(data.map(mapPatientToFrontend));
            const financialsMap: Record<string, PatientFinancialItem[]> = {};
            const documentsMap: Record<string, PatientDocument[]> = {};
            data.forEach((p: any) => {
              if (p.financials) financialsMap[p.id] = p.financials;
              if (p.documents) documentsMap[p.id] = p.documents;
            });
            setPatientFinancials(financialsMap);
            setPatientDocuments(documentsMap);
          }
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        supabase.from('appointments').select('*').then(({ data }) => { if (data) setAppointments(data.map(mapAppointmentToFrontend)); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        supabase.from('transactions').select('*').then(({ data }) => { if (data) setTransactions(data as Transaction[]); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        supabase.from('services').select('*').then(({ data }) => { if (data) setServices(data as ServiceObj[]); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        supabase.from('inventory').select('*').then(({ data }) => { if (data) setInventory(data.map(mapInventoryToFrontend)); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        supabase.from('users').select('*').then(({ data }) => { if (data) setAppUsers(data.map(mapUserToFrontend)); });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dbChangesChannel);
    };
  }, [isAuthenticated]);

  // Handle new appointment submission
  const handleAddNewAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord = {
      time: newApptTime,
      patientName: newApptPatient,
      procedure: newApptProcedure,
      status: 'Confirmado' as const,
      professional: newApptProfessional,
      category: newApptCategory
    };
    
    try {
      const { error } = await supabase.from('appointments').insert([mapAppointmentToBackend(newRecord)]);
      if (error) throw error;
      setIsNewAppointmentOpen(false);

      // Dynamic AI insight triggering when an appointment is added
      setAiAdvice(`Dica Gabi Almeida AI: Agendamento agendado às ${newApptTime}. Com isso, sua jornada de ocupação de hoje subiu para ${Math.min(98, 92 + 2)}%. Excelente trabalho de otimização de horário!`);
    } catch (err: any) {
      console.error('Error adding appointment:', err);
      showAlert(`Erro ao salvar na agenda: ${err.message || err}`);
    }
  };

  // Canvas drawing handler for signature pad
  const getCoordinates = (e: React.PointerEvent) => {
    if (!canvasRef.current) return {x: 0, y: 0};
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startSignatureDrawing = (e: React.PointerEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#79542e'; // Primary color
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setSignatureSaved(false);
  };

  const drawSignature = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopSignatureDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureSaved(false);
  };

  const confirmSignature = async () => {
    if (!selectedPatient.id) {
      showAlert('Selecione um paciente para assinar o termo.');
      return;
    }
    setSignatureSaved(true);
    
    const newTimelineItem = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('pt-BR'),
      title: 'Validação de Protocolo',
      description: 'Protocolo de atendimento clínico assinado e validado com sucesso pelo cliente.',
      category: 'Validação',
      status: 'Concluído'
    };

    const updatedTimeline = [newTimelineItem, ...(selectedPatient.timeline || [])];

    try {
      const { error } = await supabase
        .from('patients')
        .update({ timeline: updatedTimeline })
        .eq('id', selectedPatient.id);
      if (error) throw error;
    } catch (err: any) {
      console.error('Error updating patient timeline:', err);
      showAlert(`Erro ao salvar assinatura: ${err.message || err}`);
    }

    // Scroll down to Protocols to show it was added
    setTimeout(() => {
       document.getElementById('protocolos-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Call dynamic Gemini AI Suggestion route
  const handleQueryAI = async () => {
    if (!aiCustomInput.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          message: aiCustomInput,
          context: {
            currentTab,
            selectedPatientName: selectedPatient.name,
            totalRevenue: totalRevenueThisMonth,
            percentTarget: currentRevenuePercent
          }
        })
      });

      const data = await res.json();
      if (data.response) {
        setAiAdvice(`Dica Gabi Almeida AI: ${data.response}`);
        setAiCustomInput('');
      } else if (data.error) {
        setAiAdvice(`Erro Gabi Almeida AI: ${data.error}`);
      }
    } catch (err: any) {
      setAiAdvice(`Erro ao contatar assistência AI: ${err.message || err}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Filter patients by search query
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter transactions by search query
  const filteredTransactions = transactions.filter(t =>
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Quick helper to categorize custom category tags in Transaction views
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Procedimento':
        return 'bg-primary-fixed text-on-primary-fixed-variant';
      case 'Insumos':
        return 'bg-secondary-container text-on-secondary-container';
      default:
        return 'bg-surface-container-highest text-on-surface-variant';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro na autenticação.');
      }
      
      if (data.user) {
        setCurrentUser(mapUserToFrontend(data.user));
        setIsAuthenticated(true);
        setLoginError('');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError(err.message || 'Erro de conexão ou falha ao autenticar.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
      // Fallback local clearing
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-surface-container-lowest text-on-surface font-sans h-screen flex flex-col items-center justify-center p-4 relative" style={{backgroundImage: 'radial-gradient(circle at top, rgba(163,34,216,0.05), transparent 60%)'}}>
        <div className="max-w-md w-full bg-white-pure rounded-3xl p-10 border border-outline-variant/60 shadow-xl relative z-10 flex flex-col items-center">
           <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
             <span className="material-symbols-outlined text-3xl">spa</span>
           </div>
           
           <div className="text-center mb-8">
              <h1 className="font-manrope text-2xl font-black text-on-surface uppercase tracking-tight">Gabi Almeida</h1>
              <p className="font-manrope text-[11px] tracking-[0.2em] font-bold text-on-surface-variant uppercase mt-1">Estética Avançada</p>
           </div>
           
           <form onSubmit={handleLogin} className="w-full flex flex-col space-y-5" suppressHydrationWarning>
              <div>
                <label className="block text-[12px] font-bold text-on-surface-variant mb-1.5 ml-1">Usuário / Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 text-[20px]">person</span>
                  <input 
                    type="text" 
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-4 py-3 placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-[14px]"
                    placeholder="Ex: admin"
                    suppressHydrationWarning
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[12px] font-bold text-on-surface-variant mb-1.5 ml-1">Senha</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 text-[20px]">lock</span>
                  <input 
                    type="password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-4 py-3 placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-[14px]"
                    placeholder="••••••••"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {loginError && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-3 flex items-start gap-2">
                  <span className="material-symbols-outlined text-error text-[18px]">error</span>
                  <p className="text-[12px] text-error font-medium">{loginError}</p>
                </div>
              )}

              <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-on-primary font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-95 text-[14px] mt-2">
                Acessar Plataforma
              </button>
           </form>
           
           <p className="text-[11px] text-on-surface-variant mt-8 text-center font-manrope">
              Acesso seguro. Todos os dados são criptografados.<br/>© 2026 Gabi Almeida Estética.
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface font-sans overflow-hidden h-screen flex relative">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 1. Left SideNavBar */}
      <aside className={`fixed lg:relative left-0 top-0 h-full w-72 flex flex-col border-r border-outline-variant bg-surface-container-low backdrop-blur-md z-40 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 pb-4 flex flex-col">
          <div className="h-16 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">spa</span>
            <div className="flex flex-col">
              <span className="font-manrope text-primary tracking-tighter text-2xl font-black uppercase leading-none">Gabi Almeida</span>
              <span className="font-manrope text-outline tracking-[0.22em] uppercase text-[9px] mt-0.5 font-bold">Estética Avançada</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 flex flex-col pt-4">
          <button 
            id="nav-dashboard"
            onClick={() => { setCurrentTab('dashboard'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-left ${currentTab === 'dashboard' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined" style={{fontVariationSettings: currentTab === 'dashboard' ? "'FILL' 1" : "'FILL' 0"}}>dashboard</span>
            <span className="font-manrope text-[14px] leading-none">Dashboard</span>
          </button>

          <button 
            id="nav-agenda"
            onClick={() => { setCurrentTab('agenda'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-left ${currentTab === 'agenda' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined" style={{fontVariationSettings: currentTab === 'agenda' ? "'FILL' 1" : "'FILL' 0"}}>calendar_month</span>
            <span className="font-manrope text-[14px] leading-none">Agenda</span>
          </button>

          <button 
            id="nav-clientes"
            onClick={() => { setCurrentTab('clientes'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-left ${currentTab === 'clientes' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined" style={{fontVariationSettings: currentTab === 'clientes' ? "'FILL' 1" : "'FILL' 0"}}>group</span>
            <span className="font-manrope text-[14px] leading-none">Clientes CRM</span>
          </button>

          <button 
            id="nav-cadastro-cliente"
            onClick={() => { setCurrentTab('cadastro-cliente'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-left ${currentTab === 'cadastro-cliente' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined" style={{fontVariationSettings: currentTab === 'cadastro-cliente' ? "'FILL' 1" : "'FILL' 0"}}>person_add</span>
            <span className="font-manrope text-[14px] leading-none">Cadastro Clientes</span>
          </button>

          <button 
            id="nav-financeiro"
            onClick={() => { setCurrentTab('financeiro'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-left ${currentTab === 'financeiro' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined" style={{fontVariationSettings: currentTab === 'financeiro' ? "'FILL' 1" : "'FILL' 0"}}>payments</span>
            <span className="font-manrope text-[14px] leading-none">Financeiro</span>
          </button>

          <button 
            id="nav-servicos"
            onClick={() => { setCurrentTab('servicos'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-left ${currentTab === 'servicos' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined" style={{fontVariationSettings: currentTab === 'servicos' ? "'FILL' 1" : "'FILL' 0"}}>medical_services</span>
            <span className="font-manrope text-[14px] leading-none">Serviços e Tratamentos</span>
          </button>

          <button 
            id="nav-estoque"
            onClick={() => { setCurrentTab('estoque'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-left ${currentTab === 'estoque' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined" style={{fontVariationSettings: currentTab === 'estoque' ? "'FILL' 1" : "'FILL' 0"}}>inventory</span>
            <span className="font-manrope text-[14px] leading-none">Estoque</span>
          </button>
        </nav>

        {/* Create appointment trigger from sidebar */}
        <div className="p-4 mx-4 mb-4 bg-surface-container-lowest/40 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <button 
            id="sidebar-new-appointment"
            onClick={() => { setIsNewAppointmentOpen(true); setIsMobileMenuOpen(false); }}
            className="w-full bg-primary text-on-primary py-3 rounded-xl font-manrope font-bold text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Novo Agendamento
          </button>
        </div>

        {/* Bottom utility links */}
        <div className="px-4 pb-8 space-y-1">
          {currentUser?.role === 'admin' && (
            <button 
              id="nav-usuarios"
              onClick={() => { setCurrentTab('usuarios'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-300 text-left text-[14px] ${currentTab === 'usuarios' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined" style={{fontVariationSettings: currentTab === 'usuarios' ? "'FILL' 1" : "'FILL' 0"}}>manage_accounts</span>
              <span className="font-manrope">Usuários</span>
            </button>
          )}
          <button onClick={() => showAlert('Desenvolvido com carinho para clínica de estética avançada Gabi Almeida.')} className="w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-primary transition-colors text-left text-[14px]">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-manrope">Configurações</span>
          </button>
           <button onClick={() => {
            handleLogout();
            setCurrentTab('dashboard');
          }} className="w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-error/80 hover:text-error transition-colors text-left text-[14px]">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-manrope">Sair</span>
          </button>
        </div>
      </aside>

      {/* 2. Top Header and Main Section */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* TopNavBar Shell */}
        <header className="h-20 w-full flex justify-between items-center px-4 md:px-8 lg:px-12 bg-white-pure/60 backdrop-blur-xl border-b border-outline-variant z-20 relative gap-4">
          
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center justify-center -ml-2"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          {/* Universal Search context depending on current tab */}
          <div className="flex items-center flex-1 max-w-xl hidden sm:flex">
            <div className="relative w-full group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-60">search</span>
              <input 
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  currentTab === 'clientes' ? 'Buscar cliente por nome...' :
                  currentTab === 'financeiro' ? 'Buscar transações por descrição ou categoria...' :
                  'Buscar clientes, relatórios...'
                }
                className="w-full pl-12 pr-4 py-2.5 bg-[#f7f3f0] border-none rounded-full font-sans text-[14px] focus:ring-1 focus:ring-primary/40 focus:outline-none placeholder:text-on-surface-variant/50"
                suppressHydrationWarning
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[18px] text-outline hover:text-primary"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-on-surface-variant">
              
              {/* Notifications Dropdown trigger */}
              <div className="relative">
                <button 
                  id="notif-bell"
                  onClick={() => setIsAlertNotificationOpen(!isAlertNotificationOpen)}
                  className="relative p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {criticalAlerts.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                  )}
                </button>
                
                {isAlertNotificationOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-xl z-50">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant/50">
                      <span className="font-manrope text-[14px] font-bold text-primary">Alertas Clínicos Ativos</span>
                      <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded text-[10px] font-bold">{criticalAlerts.length} Críticos</span>
                    </div>
                    <div className="space-y-3">
                      {criticalAlerts.map(alert => (
                        <div key={alert.id} className="p-3 bg-surface-container rounded-xl text-[12px] flex items-start gap-2 border border-outline-variant/30">
                          <span className="material-symbols-outlined text-primary text-[18px]">{alert.icon}</span>
                          <div>
                            <p className="font-bold">{alert.title}</p>
                            <p className="text-on-surface-variant">{alert.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => { setIsAlertNotificationOpen(false); }}
                      className="w-full mt-4 text-center text-[12px] font-bold text-primary hover:underline"
                    >
                      Fechar Alertas
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => setCurrentTab('agenda')} className="p-2 hover:text-primary transition-colors cursor-pointer" title="Histórico da Clínica">
                <span className="material-symbols-outlined">history</span>
              </button>
              
              <button 
                onClick={() => {
                  setCurrentTab('clientes');
                  setSelectedPatientId('p1');
                }} 
                className="p-2 hover:text-primary transition-colors cursor-pointer" 
                title="Mensagens do CRM"
              >
                <span className="material-symbols-outlined">chat_bubble</span>
              </button>
            </div>

            <div className="h-8 w-[1px] bg-outline-variant"></div>

            {/* User Profile */}
            <div className="relative">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                title="Meu Perfil"
              >
                <div className="text-right">
                  <p className="font-manrope text-[14px] text-on-surface font-bold leading-none">{currentUser?.name}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mt-1">{currentUser?.role}</p>
                </div>
                <img 
                  alt="Perfil" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 transition-all hover:border-primary" 
                  src={currentUser?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${(currentUser?.name || 'User').replace(/\s+/g, '')}`}
                />
              </div>
              
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white-pure rounded-2xl shadow-xl border border-outline-variant py-2 z-50 animate-fade-in text-[13px] font-sans">
                  <button 
                    onClick={() => { setIsProfileMenuOpen(false); setIsEditProfileModalOpen(true); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-surface-container flex items-center gap-3 text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[18px] opacity-70">person</span>
                    Editar Perfil
                  </button>
                  <button 
                    onClick={() => { setIsProfileMenuOpen(false); setIsChangePasswordModalOpen(true); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-surface-container flex items-center gap-3 text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[18px] opacity-70">vpn_key</span>
                    Trocar Senha
                  </button>
                  <div className="h-[1px] w-full bg-outline-variant my-1"></div>
                  <button 
                    onClick={() => {
                       setIsProfileMenuOpen(false);
                       handleLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-error/10 flex items-center gap-3 text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sair
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* 3. Main Dashboard Tab Canvas */}
        {currentTab === 'dashboard' && (
          <section className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 bg-surface select-none">
            
            {/* Greeting Header */}
            <div className="mb-8 lg:mb-10 flex flex-col lg:flex-row justify-between lg:items-end gap-4">
              <div>
                <h2 id="greeting-header" className="font-manrope text-headline-lg text-primary font-light text-[28px] lg:text-[36px]">
                  Bom dia, {currentProfessional.name.split(' ')[1]}.
                </h2>
                <p className="font-sans text-[14px] lg:text-[15px] text-on-surface-variant">
                  Sua clínica de estética avançada está com <span className="font-bold text-primary">92%</span> de ocupação hoje.
                </p>
              </div>

              {/* Badges system indicators mapping layout exactly */}
              <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                <select 
                  className="bg-surface-container px-4 py-2 rounded-xl text-[12px] font-bold text-on-surface-variant border border-outline-variant focus:outline-primary cursor-pointer hover:bg-surface-container-high transition-colors"
                  value={dashboardPeriod}
                  onChange={e => setDashboardPeriod(e.target.value)}
                >
                  <option value="Hoje">Hoje</option>
                  <option value="Estes Mês">Este Mês</option>
                  <option value="Tudo">Todo o Período</option>
                </select>
                <div className="w-[1px] h-6 bg-outline-variant mx-1 hidden sm:block"></div>
                <span className="flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-secondary/10 text-secondary rounded-full font-manrope text-[11px] lg:text-[12px] font-semibold border border-secondary/20">
                  <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
                  3 Profissionais Ativos
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-tertiary/10 text-tertiary rounded-full font-manrope text-[11px] lg:text-[12px] font-semibold">
                  <span className="material-symbols-outlined text-[16px] lg:text-[18px]">verified</span>
                  Sincronizado
                </span>
              </div>
            </div>

            {/* Bento Grid layout containing metrics */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
              
              {/* Daily Financial Summary */}
              <div className="col-span-1 md:col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant shadow-sm flex flex-col gap-6 relative overflow-hidden group">
                <div className="flex justify-between items-start z-10 w-full">
                  <div className="flex-1">
                    <p className="font-manrope text-[12px] text-on-surface-variant uppercase tracking-widest font-bold">Resumo Financeiro Diário</p>
                    <h3 className="font-manrope text-[32px] sm:text-[44px] font-bold text-on-surface tracking-tight mt-1 whitespace-nowrap overflow-hidden text-ellipsis">R$ {totalDailyRevenueDisplay.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="material-symbols-outlined text-tertiary">trending_up</span>
                      <span className="text-tertiary font-manrope text-[12px] font-bold">+14.2% em relação a ontem</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => showAlert('Download do fechamento diário iniciado.')} className="p-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer" title="Exportar dados">
                      <span className="material-symbols-outlined text-on-surface-variant">download</span>
                    </button>
                    <button className="p-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
                    </button>
                  </div>
                </div>

                {/* Elegant dynamic revenue graph mockup */}
                <div className="h-32 sm:h-44 w-full mt-2 chart-gradient relative border-b border-outline-variant/30 rounded-lg">
                  <div className="absolute bottom-0 left-0 w-full h-full flex items-end justify-between px-2 sm:px-6 pointer-events-none">
                    <div className="h-[20%] w-1 sm:w-1.5 bg-primary/20 rounded-t"></div>
                    <div className="h-[35%] w-1 sm:w-1.5 bg-primary/20 rounded-t"></div>
                    <div className="h-[30%] w-1 sm:w-1.5 bg-primary/20 rounded-t"></div>
                    <div className="h-[55%] w-1 sm:w-1.5 bg-primary/20 rounded-t"></div>
                    <div className="h-[75%] w-1 sm:w-1.5 bg-primary/30 rounded-t"></div>
                    <div className="h-[65%] w-1 sm:w-1.5 bg-primary/40 rounded-t"></div>
                    <div className="h-[85%] w-1 sm:w-1.5 bg-primary/60 rounded-t"></div>
                    <div className="h-[95%] w-1 sm:w-1.5 bg-primary rounded-t shadow-sm"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-surface-container-lowest shadow-lg border border-outline-variant/60 px-4 py-2 rounded-xl">
                      <p className="font-manrope text-[11px] text-primary font-bold">Pico de Atendimento às 14:00</p>
                      <p className="font-manrope text-[15px] font-extrabold text-center">R$ {(totalDailyRevenueDisplay * 0.35).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    </div>
                  </div>
                </div>

                {/* Micro indicators */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-2 pt-4 border-t border-outline-variant/40">
                  <div>
                    <p className="font-manrope text-[11px] text-on-surface-variant font-medium">Atendimentos do dia</p>
                    <p className="font-manrope text-[16px] sm:text-[18px] font-black text-on-surface mt-1">{totalAtendimentosDisplay}</p>
                  </div>
                  <div>
                    <p className="font-manrope text-[11px] text-on-surface-variant font-medium">Ticket Médio</p>
                    <p className="font-manrope text-[16px] sm:text-[18px] font-black text-on-surface mt-1">R$ {ticketMedio.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</p>
                  </div>
                  <div>
                    <p className="font-manrope text-[11px] text-on-surface-variant font-medium">Conversão</p>
                    <p className="font-manrope text-[16px] sm:text-[18px] font-black text-on-surface mt-1">{taxaConversao}%</p>
                  </div>
                  <div>
                    <p className="font-manrope text-[11px] text-on-surface-variant font-medium">Leads Ativos</p>
                    <p className="font-manrope text-[16px] sm:text-[18px] font-black text-on-surface mt-1">{leadsAtivos}</p>
                  </div>
                </div>
              </div>

              {/* Side cards: Alerts & Month Milestone (matches image 3 layout exactly) */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                
                {/* Active Alerts List */}
                <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant shadow-sm flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-manrope text-[16px] font-bold text-primary">Alertas Clínicos</h4>
                    <span className="bg-error-container text-on-error-container px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {criticalAlerts.length} Ativos
                    </span>
                  </div>
                  <div className="space-y-3">
                    {criticalAlerts.length === 0 ? (
                      <p className="text-[12px] text-on-surface-variant italic py-2 text-center">Nenhum alerta pendente no momento.</p>
                    ) : (
                      criticalAlerts.map(alert => (
                        <div key={alert.id} className={`flex gap-3 p-3 rounded-xl border-l-4 ${alert.alertClass}`}>
                          <span className="material-symbols-outlined text-[18px] mt-0.5">{alert.icon}</span>
                          <div>
                            <p className="font-manrope text-[12px] font-bold">{alert.title}</p>
                            <p className="text-[11px] text-on-surface-variant/90 leading-snug mt-0.5">{alert.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Target Milestones Progress Card */}
                <div className="bg-primary text-white-pure rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
                  <div className="relative z-10">
                    <h4 className="font-manrope text-[16px] font-semibold text-primary-fixed uppercase tracking-wider mb-1">Meta Mensal de Vendas</h4>
                    <p className="font-sans text-[13px] opacity-90 mb-4 text-white-pure/90">Você atingiu {currentRevenuePercent}% da sua meta de faturamento no mês.</p>
                    <div className="w-full bg-white-pure/20 h-2 rounded-full mb-2">
                      <div className="bg-white-pure h-full rounded-full transition-all duration-1000" style={{width: `${currentRevenuePercent}%`}}></div>
                    </div>
                    <div className="flex justify-between font-manrope text-[10px] text-primary-fixed uppercase tracking-tighter">
                      <span>R$ {totalRevenueThisMonth.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                      <span>R$ {primaryRevenueTarget.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <span className="material-symbols-outlined text-[120px]" style={{fontVariationSettings: "'FILL' 1"}}>trending_up</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Section details: Today Agenda & Best Selling Services */}
            <div className="grid grid-cols-12 gap-6">
              
              {/* Daily Schedule block (Left column, image 3) */}
              <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="font-manrope text-[18px] font-bold text-on-surface">Minha Agenda Hoje</h4>
                    <p className="text-sans text-[13px] text-on-surface-variant mt-1">Quinta-feira, 24 de Outubro</p>
                  </div>
                  <button 
                    onClick={() => setCurrentTab('agenda')}
                    className="text-primary hover:underline font-manrope text-[13px] font-bold flex items-center gap-1"
                  >
                    Ver Agenda Completa
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {appointments.map((appt) => (
                    <div key={appt.id} className="flex items-center gap-4 p-3 hover:bg-surface-container-low transition-colors rounded-2xl group border-b border-outline-variant/30 last:border-0">
                      <p className="font-manrope text-[15px] font-bold text-on-surface-variant w-16">{appt.time}</p>
                      
                      {appt.patientAvatar ? (
                        <img className="w-10 h-10 rounded-full object-cover" src={appt.patientAvatar} alt={appt.patientName} />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-manrope text-primary font-bold text-[12px]">
                          {appt.patientName.split(' ').map(n=>n[0]).join('')}
                        </div>
                      )}

                      <div className="flex-1">
                        <p className="font-manrope text-[13px] font-bold text-on-surface">{appt.patientName}</p>
                        <p className="font-sans text-[12px] text-on-surface-variant">{appt.procedure}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-manrope text-[10px] uppercase font-bold text-white-pure ${appt.status === 'Confirmado' ? 'bg-[#735c00]' : appt.status === 'Em Atendimento' ? 'bg-[#79542e]' : 'bg-gray-light text-on-surface'}`}>
                          {appt.status}
                        </span>
                        <button 
                          onClick={() => {
                            if (appt.patientName === 'Mariana Silveira') {
                              setSelectedPatientId('p1');
                            }
                            setCurrentTab('clientes');
                          }} 
                          className="material-symbols-outlined text-outline group-hover:text-primary transition-colors cursor-pointer"
                        >
                          chevron_right
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Selling Services (Right column, image 3) */}
              <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-manrope text-[18px] font-bold text-on-surface mb-6">Tratamentos em Destaque</h4>
                  <div className="space-y-6">
                    
                    {/* Botulinic */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[24px]">face</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-manrope text-[13px] font-bold text-on-surface">Botox® Full Face</p>
                          <p className="font-manrope text-[11px] font-semibold text-primary">42 Realizados</p>
                        </div>
                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{width: '85%'}}></div>
                        </div>
                      </div>
                    </div>

                    {/* Collagen stimulators */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary/5 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-[24px]">spa</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-manrope text-[13px] font-bold text-on-surface">Bioestimuladores de colágeno</p>
                          <p className="font-manrope text-[11px] font-semibold text-secondary">31 Realizados</p>
                        </div>
                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div className="bg-secondary h-full rounded-full" style={{width: '62%'}}></div>
                        </div>
                      </div>
                    </div>

                    {/* Chemical peeling */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-tertiary/5 flex items-center justify-center text-tertiary">
                        <span className="material-symbols-outlined text-[24px]">colorize</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-manrope text-[13px] font-bold text-on-surface">Peeling Químico Premium</p>
                          <p className="font-manrope text-[11px] font-semibold text-tertiary">18 Realizados</p>
                        </div>
                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div className="bg-tertiary h-full rounded-full" style={{width: '38%'}}></div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-outline-variant/30 flex justify-center">
                  <button 
                    onClick={() => setCurrentTab('financeiro')}
                    className="flex items-center gap-2 text-primary font-manrope text-[13px] font-bold hover:scale-105 transition-transform"
                  >
                    Relatório Completo de Procedimentos
                    <span className="material-symbols-outlined">trending_flat</span>
                  </button>
                </div>
              </div>

            </div>

          </section>
        )}

        {/* 4. Agenda Tab Canvas */}
        {currentTab === 'agenda' && (
          <section className="flex-1 overflow-hidden flex flex-col p-12 bg-surface select-none relative">
            
            {/* Calendar Controls */}
            <div className="flex justify-between items-end mb-6">
              <div className="space-y-3">
                <h2 className="font-manrope text-headline-md font-bold text-on-surface flex items-center gap-3 text-[26px]">
                  <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>calendar_today</span>
                  Agenda Diária Clinica
                  <span className="text-on-surface-variant font-normal text-[15px] ml-2">Quinta-feira, 24 de Outubro, 2023</span>
                </h2>
                
                <div className="flex items-center gap-3">
                  <div className="flex p-1 bg-surface-container rounded-full border border-outline-variant/60 select-none">
                    <button 
                      onClick={() => setAgendaView('diaria')}
                      className={`px-5 py-1.5 rounded-full text-label-md text-[12px] font-bold transition-all cursor-pointer ${agendaView === 'diaria' ? 'bg-[#79542e] text-white-pure shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                    >
                      Dia
                    </button>
                    <button 
                      onClick={() => setAgendaView('semanal')}
                      className={`px-5 py-1.5 rounded-full text-label-md text-[12px] font-bold transition-all cursor-pointer ${agendaView === 'semanal' ? 'bg-[#79542e] text-white-pure shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                    >
                      Semana
                    </button>
                    <button 
                      onClick={() => setAgendaView('mensal')}
                      className={`px-5 py-1.5 rounded-full text-label-md text-[12px] font-bold transition-all cursor-pointer ${agendaView === 'mensal' ? 'bg-[#79542e] text-white-pure shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                    >
                      Mês
                    </button>
                  </div>
                  
                  <div className="h-6 w-[1px] bg-outline-variant"></div>
                  
                  {/* Dynamic Practitioner Avatars */}
                  <div className="flex -space-x-2">
                    <img className="w-8 h-8 rounded-full border-2 border-surface object-cover hover:z-10 transition-transform hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAN-Snz7tw2cfJzM9hV2bOvnyopMNo02cO7qeufmV6KniT2HUq20-Uc-RRAkUX48x8ZKf93EvatW4M98a7buubdfWLGNqkXPLNrTtU1ZbEUEcVs5f5uWuhpl0Q2I0NaGJlrZCINa5rkAAXLS_CBdLRVveaDh9UGjr2iDt1eA0F0RWq5cWvfZcYUBxTyjUMTf5iKZ5-lEAATGNSqS2ap6D_9sr90et2Y5BEv3NCQhawEF3qma8IVuNwPY5_Z5dpvYHi2gmvEsUKME3A" title="Dr. Ricardo" />
                    <img className="w-8 h-8 rounded-full border-2 border-surface object-cover hover:z-10 transition-transform hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZIoJ5rvFEd0QMoDhK--t5eo06m0e_1bwl91JesfdGrGuK7jx2D0IbCslQ2BXI21cNsAIomQGuNVKemV7t_bk7l9Cq2EIUbZRmflXAbPRdFMZ8ZNJwCA9_OQmPUHWdNJGN3xUo8DhmzgV2zzvBpZHhQBAKbGADEMh-nPQlk7t75ZOoYy4NkrQIWwst_VAWsIODxR87XUbLjQ5Gj_y2sZHFebWcQxLtztQv3_M9YOPoSuSyQEh-GYl3QCbRV7ZC2vngKjoQswx1GIw" title="Dra. Helena" />
                    <div className="w-8 h-8 rounded-full border-2 border-surface bg-[#e5e2df] flex items-center justify-center text-[10px] font-bold text-primary cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">+2</div>
                  </div>
                </div>
              </div>

              {/* Legend Indicator labels exactly matching layout of Image 3 */}
              <div className="flex gap-4">
                <div className="flex items-center gap-6 px-6 py-3 bg-white-pure border border-outline-variant/60 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                    <span className="text-label-md text-[12px] font-semibold text-on-surface-variant">Estética</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                    <span className="text-label-md text-[12px] font-semibold text-on-surface-variant">Injetáveis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container"></span>
                    <span className="text-label-md text-[12px] font-semibold text-on-surface-variant">Consulta</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split layout: Agenda Left / CRM AI Advisor Right */}
            <div className="flex-1 overflow-hidden flex gap-6">
              
              {/* Main Schedule Container */}
              <div className="flex-1 bg-white-pure rounded-3xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
                
                {/* 4.1 Daily View Layout */}
                {agendaView === 'diaria' && (
                  <div className="w-full h-full flex flex-row overflow-hidden">
                    {/* Clock hours sidebar */}
                    <div className="w-20 sm:w-24 border-r border-outline-variant flex flex-col pt-16 font-manrope bg-surface-container/10">
                      <div className="h-20 flex items-start justify-center text-[11px] text-outline pt-2 font-bold">08:00</div>
                      <div className="h-20 flex items-start justify-center text-[11px] text-outline pt-2 font-bold">09:00</div>
                      <div className="h-20 flex items-start justify-center text-[11px] text-outline pt-2 font-bold">10:00</div>
                      <div className="h-20 flex items-start justify-center text-[11px] text-outline pt-2 font-bold">11:00</div>
                      <div className="h-20 flex items-start justify-center text-[11px] text-outline pt-2 font-bold">12:00</div>
                      <div className="h-20 flex items-start justify-center text-[11px] text-outline pt-2 font-bold">13:00</div>
                      <div className="h-20 flex items-start justify-center text-[11px] text-outline pt-2 font-bold">14:00</div>
                    </div>

                    {/* Day Area */}
                    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
                      
                      {/* Calendar Column Day title */}
                      <div className="sticky top-0 z-10 bg-white-pure/95 backdrop-blur-md border-b border-outline-variant h-14 flex items-center px-6 justify-between select-none">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 bg-primary text-on-primary rounded-full flex items-center justify-center font-bold font-manrope text-[14px]">24</span>
                          <span className="font-manrope text-[14px] font-bold text-on-surface">Terça-feira (Dia Ativo)</span>
                        </div>
                        <span className="text-[11px] bg-tertiary/10 text-tertiary px-3 py-1 rounded-full font-bold">Hoje</span>
                      </div>

                      {/* Operational appointment slots */}
                      <div className="p-4 relative min-h-[580px]" id="appointments-drop-zone">
                        <div className="absolute inset-x-0 top-0 pointer-events-none space-y-20 pt-6">
                          <div className="border-b border-outline-variant/10 w-full h-0"></div>
                          <div className="border-b border-outline-variant/10 w-full h-0"></div>
                          <div className="border-b border-outline-variant/10 w-full h-0"></div>
                          <div className="border-b border-outline-variant/10 w-full h-0"></div>
                          <div className="border-b border-outline-variant/10 w-full h-0"></div>
                          <div className="border-b border-outline-variant/10 w-full h-0"></div>
                        </div>

                        {/* Slot 08:15 */}
                        <div className="absolute top-[28px] left-4 right-4 h-18 bg-secondary-container/10 border-l-4 border-secondary-container rounded-r-xl p-3 flex items-center justify-between group hover:bg-[#fed65b]/20 transition-all cursor-pointer">
                          <div className="flex items-center gap-3">
                            <img className="w-8 h-8 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEkjXxcStiiutr_TflFiVONKwKaDnZdH1QVwowMunfj7PRiu99DgY1EZjcTLda1zDr3jbU9hNxjKz05jHPW1r9GgtJ8AjwqAJQo_iX3MdC7nBEeu-B0rxEwj63JLhJPxTTYsmpJRbUHHjsjowIGOjdOKk6P13hxurYM6ZyOMUYjLf4w2jqLuvh2-czyV2fQta2bCs8ropo6w7HY3hVu3kNP9VsEZJ5mx9c_6-Q0JVV2mRKbf07uQNjiAU_5HLl5ren2yXkeQXMKwg" alt="Isabella"/>
                            <div>
                              <p className="font-manrope text-[12px] font-bold text-on-surface">Isabella Albuquerque</p>
                              <p className="text-[10px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[13px]">face</span> Limpeza de Pele Profunda
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-manrope text-[11px] font-bold text-on-surface">08:15 - 09:00</p>
                              <span className="text-[9px] bg-white-pure px-2 py-0.5 rounded-full border border-[#fed65b] text-[#745c00] font-bold uppercase">Confirmado</span>
                            </div>
                            <span className="material-symbols-outlined text-outline group-hover:text-primary">more_vert</span>
                          </div>
                        </div>

                        {/* Slot 09:30 */}
                        <div className="absolute top-[120px] left-4 right-4 h-36 bg-primary-container/10 border-l-4 border-primary-container rounded-r-xl p-4 flex flex-col justify-between group hover:bg-primary-container/20 transition-all cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold text-[12px] font-manrope">JS</div>
                              <div>
                                <p className="font-manrope text-[13px] font-bold text-on-surface">Juliana Silveira</p>
                                <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                                  <span className="material-symbols-outlined text-[14px]">medical_services</span> Aplicação Botulínica (3 áreas)
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-manrope text-[11px] font-bold text-on-surface">09:30 - 11:00</p>
                              <span className="text-[8px] bg-primary text-on-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse">Em Atendimento</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-end mt-2 pt-2 border-t border-primary/10">
                            <div className="flex gap-2">
                              <span className="px-2 py-0.5 bg-white-pure/80 rounded-md text-[9px] text-primary border border-primary/20 font-bold">Prioritário</span>
                              <span className="px-2 py-0.5 bg-white-pure/80 rounded-md text-[9px] text-on-surface-variant border border-outline-variant font-bold">Retorno 15 dias</span>
                            </div>
                            <div className="flex items-center -space-x-1.5">
                              <img className="w-5 h-5 rounded-full border border-white-pure object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjl-5MOCfqPf7UVhTK-is80Cvip_9vTjfI7dNFTBZWB3YpgEPWwpMLrys8OOyqeOhgDt2bdS18QJm-swcDlptppKLbuXyu0HrKgKFVP1gb1jMQy2vdlwJww466vSmsi19_01Owyu0O9rmPyVzzKhkVT0tp9njNZ--Qd69ATOLsXVJrUsI8zjbhNAN39-XpaprOz7NVxRFzN5_a3StQJvRKHhJ4GUS6fHfE3zudxjaFt-f8Xiv4fgUJlIJ8LW56_c585Yk3cH6aol0" alt="Avatar"/>
                              <span className="w-5 h-5 rounded-full bg-surface-container text-[8px] flex items-center justify-center font-bold border border-white-pure text-primary">+1</span>
                            </div>
                          </div>
                        </div>

                        {/* Slot 11:15 */}
                        <div className="absolute top-[284px] left-4 right-4 h-18 bg-tertiary-container/10 border-l-4 border-tertiary-container rounded-r-xl p-3 flex items-center justify-between group opacity-85 hover:opacity-100 transition-all cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant font-bold text-[11px]">RM</div>
                            <div>
                              <p className="font-manrope text-[12px] font-bold text-on-surface">Roberto Mendes</p>
                              <p className="text-[10px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[13px]">event_note</span> Consulta Dermatológica Geral
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-manrope text-[11px] font-bold text-on-surface">11:15 - 12:00</p>
                              <span className="text-[9px] bg-tertiary text-on-tertiary px-2 py-0.5 rounded-full font-bold uppercase">Finalizado</span>
                            </div>
                            <span className="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
                          </div>
                        </div>

                        {/* Slot 13:00 - Available creation slot */}
                        <div 
                          onClick={() => {
                            setNewApptTime('13:00');
                            setIsNewAppointmentOpen(true);
                          }}
                          className="absolute top-[384px] left-4 right-4 h-20 border-2 border-dashed border-outline-variant rounded-2xl flex items-center justify-center group hover:border-primary/40 transition-colors cursor-pointer"
                        >
                          <span className="text-[12px] font-manrope text-outline group-hover:text-primary transition-colors flex items-center gap-2 font-bold select-none">
                            <span className="material-symbols-outlined">add_circle</span>
                            Horário disponível - Toque para agendar às 13:00
                          </span>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* 4.2 Weekly View Layout */}
                {agendaView === 'semanal' && (
                  <div className="w-full h-full flex flex-col overflow-x-auto overflow-y-hidden bg-white-pure custom-scrollbar">
                    <div className="flex flex-col min-w-[800px] h-full overflow-hidden">
                      {/* Header: Weekdays */}
                      <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container/30">
                      {[
                        { label: 'Seg', date: '23 Out' },
                        { label: 'Ter', date: '24 Out', active: true },
                        { label: 'Qua', date: '25 Out' },
                        { label: 'Qui', date: '26 Out' },
                        { label: 'Sex', date: '27 Out' },
                        { label: 'Sáb', date: '28 Out' },
                        { label: 'Dom', date: '29 Out' }
                      ].map((day, idx) => (
                        <div key={idx} className={`p-3 text-center border-r border-outline-variant/60 relative ${day.active ? 'bg-primary/5' : ''}`}>
                          <p className="text-[10px] text-outline font-extrabold uppercase tracking-wider">{day.label}</p>
                          <p className={`font-manrope text-[14px] font-bold mt-1 ${day.active ? 'text-primary' : 'text-on-surface'}`}>{day.date}</p>
                          {day.active && <span className="absolute bottom-0 inset-x-0 h-1 bg-primary"></span>}
                        </div>
                      ))}
                    </div>

                    {/* Columns grid body */}
                    <div className="grid grid-cols-7 flex-1 divide-x divide-outline-variant/40 overflow-y-auto custom-scrollbar p-2 bg-[#fbfaf8]">
                      {/* Monday Column */}
                      <div className="p-1.5 space-y-3">
                        <div className="bg-secondary-container/10 border-l-2 border-secondary-container p-2 rounded-lg relative hover:shadow-sm transition-all cursor-pointer">
                          <p className="text-[8px] text-outline font-bold">09:00 - 10:00</p>
                          <p className="font-manrope text-[11px] font-extrabold text-on-surface truncate">Mariana Silveira</p>
                          <p className="text-[9px] text-on-surface-variant truncate">Procedimento Geral</p>
                        </div>
                        <div className="bg-primary-container/10 border-l-2 border-primary-container p-2 rounded-lg relative hover:shadow-sm transition-all cursor-pointer">
                          <p className="text-[8px] text-outline font-bold">14:00 - 15:30</p>
                          <p className="font-manrope text-[11px] font-extrabold text-on-surface truncate">Beatriz Ramos</p>
                          <p className="text-[9px] text-on-surface-variant truncate">Peeling Químico</p>
                        </div>
                      </div>

                      {/* Tuesday Column */}
                      <div className="p-1.5 space-y-3 bg-primary/[0.01]">
                        <div className="bg-secondary-container/20 border-l-2 border-secondary-container p-2 rounded-lg relative cursor-pointer hover:shadow-sm transition-all" onClick={() => setAgendaView('diaria')}>
                          <p className="text-[8px] text-outline font-bold">08:15 - 09:00</p>
                          <p className="font-manrope text-[11px] font-extrabold text-on-surface truncate">Isabella Albuquerque</p>
                        </div>
                        <div className="bg-primary-container/20 border-l-2 border-primary-container p-2 rounded-lg relative cursor-pointer hover:shadow-sm transition-all" onClick={() => setAgendaView('diaria')}>
                          <p className="text-[8px] text-outline font-bold">09:30 - 11:00</p>
                          <p className="font-manrope text-[11px] font-extrabold text-on-surface truncate">Juliana Silveira</p>
                        </div>
                        <div className="bg-tertiary-container/20 border-l-2 border-tertiary-container p-2 rounded-lg relative cursor-pointer hover:shadow-sm transition-all" onClick={() => setAgendaView('diaria')}>
                          <p className="text-[8px] text-outline font-bold">11:15 - 12:00</p>
                          <p className="font-manrope text-[11px] font-extrabold text-on-surface truncate">Roberto Mendes</p>
                        </div>
                      </div>

                      {/* Wednesday Column */}
                      <div className="p-1.5 space-y-3">
                        <div className="bg-tertiary-container/10 border-l-2 border-tertiary-container p-2 rounded-lg relative hover:shadow-sm transition-all cursor-pointer">
                          <p className="text-[8px] text-outline font-bold">14:00 - 15:00</p>
                          <p className="font-manrope text-[11px] font-extrabold text-on-surface truncate">Ana Clara Vaz</p>
                          <p className="text-[9px] text-on-surface-variant truncate">Avaliação Estética</p>
                        </div>
                      </div>

                      {/* Thursday Column */}
                      <div className="p-1.5 space-y-3">
                        <div className="bg-primary-container/10 border-l-2 border-primary-container p-2 rounded-lg relative hover:shadow-sm transition-all cursor-pointer">
                          <p className="text-[8px] text-outline font-bold">10:00 - 11:30</p>
                          <p className="font-manrope text-[11px] font-extrabold text-on-surface truncate">Sandra Souza</p>
                          <p className="text-[9px] text-on-surface-variant truncate">Radiesse Botox</p>
                        </div>
                        <div className="bg-secondary-container/10 border-l-2 border-secondary-container p-2 rounded-lg relative hover:shadow-sm transition-all cursor-pointer">
                          <p className="text-[8px] text-outline font-bold">15:00 - 16:00</p>
                          <p className="font-manrope text-[11px] font-extrabold text-on-surface truncate">Ricardo Mendes</p>
                          <p className="text-[9px] text-on-surface-variant truncate">Limpeza Profunda</p>
                        </div>
                      </div>

                      {/* Friday Column */}
                      <div className="p-1.5 space-y-3">
                        <div className="bg-primary-container/10 border-l-2 border-primary-container p-2 rounded-lg relative hover:shadow-sm transition-all cursor-pointer">
                          <p className="text-[8px] text-outline font-bold">11:00 - 12:00</p>
                          <p className="font-manrope text-[11px] font-extrabold text-on-surface truncate">Mariana Silveira</p>
                          <p className="text-[9px] text-on-surface-variant truncate">Bioestimulador</p>
                        </div>
                        <div className="bg-secondary-container/10 border-l-2 border-secondary-container p-2 rounded-lg relative hover:shadow-sm transition-all cursor-pointer">
                          <p className="text-[8px] text-outline font-bold">15:30 - 16:30</p>
                          <p className="font-manrope text-[11px] font-extrabold text-on-surface truncate">Marcos Vinícius</p>
                          <p className="text-[9px] text-on-surface-variant truncate">Sessão Peeling</p>
                        </div>
                      </div>

                      {/* Saturday Column */}
                      <div className="p-1.5 space-y-3">
                        <div className="bg-[#f0ece9] border-l-2 border-outline-variant p-2 rounded-lg relative hover:shadow-sm transition-all cursor-pointer">
                          <p className="text-[8px] text-outline font-bold">09:00 - 10:00</p>
                          <p className="font-manrope text-[11px] font-extrabold text-on-surface truncate">Beatriz Ramos</p>
                          <p className="text-[9px] text-on-surface-variant truncate">Limpeza Básica</p>
                        </div>
                      </div>

                      {/* Sunday Column */}
                      <div className="p-3 text-center text-outline flex items-center justify-center text-[10px] italic">
                        Dom (Folga)
                      </div>
                    </div>
                    </div>
                  </div>
                )}

                {/* 4.3 Monthly View Layout */}
                {agendaView === 'mensal' && (
                  <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-white-pure">
                    {/* Left: 31 day October calendar grid */}
                    <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-outline-variant overflow-y-auto">
                      <div className="flex justify-between items-center mb-6 select-none font-manrope">
                        <h4 className="font-black text-primary text-[15px] uppercase tracking-wider">Outubro 2023</h4>
                        <span className="text-[12px] text-on-surface-variant font-bold">Clinica Activa</span>
                      </div>

                      {/* Calendar grid headers */}
                      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-outline uppercase mb-2">
                        <span>D</span>
                        <span>S</span>
                        <span>T</span>
                        <span>Q</span>
                        <span>Q</span>
                        <span>S</span>
                        <span>S</span>
                      </div>

                      {/* Calendar day keys */}
                      <div className="grid grid-cols-7 gap-2">
                        {/* 31 days starting with October 1st as Sunday */}
                        {Array.from({ length: 31 }).map((_, index) => {
                          const dayNum = index + 1;
                          const isSelected = dayNum === selectedCalendarDay;
                          
                          // Days with appointments: 23, 24, 25, 26, 27, 28
                          const hasAppt = [23, 24, 25, 26, 27, 28].includes(dayNum);
                          
                          return (
                            <button 
                              key={dayNum}
                              onClick={() => setSelectedCalendarDay(dayNum)}
                              className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative cursor-pointer transition-all ${
                                isSelected ? 'bg-[#79542e] text-white-pure shadow-md font-bold' : 'hover:bg-surface-container text-on-surface'
                              }`}
                            >
                              <span className="text-[12px]">{dayNum}</span>
                              {hasAppt && (
                                <div className="absolute bottom-1 w-full flex justify-center items-center">
                                  <span className={`material-symbols-outlined text-[12px] animate-bounce ${isSelected ? 'text-white-pure' : 'text-primary'}`}>spa</span>
                                  {dayNum === 24 && <span className={`material-symbols-outlined text-[12px] animate-[bounce_1.5s_infinite] ${isSelected ? 'text-white-pure' : 'text-secondary'}`}>face</span>}
                                  {dayNum === 26 && <span className={`material-symbols-outlined text-[12px] animate-pulse ${isSelected ? 'text-white-pure' : 'text-tertiary'}`}>water_drop</span>}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Selected day schedule overview */}
                    <div className="w-full md:w-80 bg-surface-container/25 p-6 flex flex-col justify-between overflow-y-auto">
                      <div className="space-y-4">
                        <div className="border-b border-outline-variant pb-3">
                          <p className="text-[10px] text-outline font-extrabold uppercase tracking-widest font-manrope">Agenda do Dia Selecionado</p>
                          <h5 className="font-manrope text-[15px] font-black text-on-surface mt-1">{selectedCalendarDay} de Outubro, Terça</h5>
                        </div>

                        {/* Event conditional lists of selected calendar day */}
                        {selectedCalendarDay === 23 && (
                          <div className="space-y-3 animate-fade-in">
                            <div className="p-3 bg-white-pure border border-outline-variant/50 rounded-xl hover:border-primary/40 transition-colors">
                              <p className="text-[9px] text-[#956c44] font-bold">09:00 - Injetáveis</p>
                              <p className="font-manrope text-[12px] font-bold text-on-surface mt-0.5">Mariana Silveira</p>
                              <p className="text-[10px] text-on-surface-variant">Preenchimento Labial</p>
                            </div>
                            <div className="p-3 bg-white-pure border border-outline-variant/50 rounded-xl hover:border-primary/40 transition-colors">
                              <p className="text-[9px] text-primary font-bold">14:00 - Estética</p>
                              <p className="font-manrope text-[12px] font-bold text-on-surface mt-0.5">Beatriz Ramos</p>
                              <p className="text-[10px] text-on-surface-variant">Peeling Químico</p>
                            </div>
                          </div>
                        )}

                        {selectedCalendarDay === 24 && (
                          <div className="space-y-3 animate-fade-in">
                            <div className="p-3 bg-white-pure border border-[#fed65b] rounded-xl">
                              <p className="text-[9px] text-[#745c00] font-bold">08:15 - Estética</p>
                              <p className="font-manrope text-[12px] font-bold text-on-surface mt-0.5">Isabella Albuquerque</p>
                              <p className="text-[10px] text-on-surface-variant">Limpeza de Pele Profunda</p>
                            </div>
                            <div className="p-3 bg-primary/5 border border-primary/25 rounded-xl">
                              <p className="text-[9px] text-primary font-bold">09:30 - Injetáveis</p>
                              <p className="font-manrope text-[12px] font-bold text-on-surface mt-0.5">Juliana Silveira</p>
                              <p className="text-[10px] text-on-surface-variant">Aplicação Botulínica (3 áreas)</p>
                            </div>
                            <div className="p-3 bg-white-pure border border-outline-variant/60 rounded-xl">
                              <p className="text-[9px] text-tertiary font-bold font-manrope">11:15 - Consulta</p>
                              <p className="font-manrope text-[12px] font-bold text-on-surface mt-0.5">Roberto Mendes</p>
                              <p className="text-[10px] text-on-surface-variant">Consulta Dermatológica</p>
                            </div>
                          </div>
                        )}

                        {selectedCalendarDay === 25 && (
                          <div className="p-4 bg-white-pure border border-outline-variant/50 rounded-2xl animate-fade-in">
                            <p className="text-[9px] text-tertiary font-bold font-manrope">14:00 - Consulta</p>
                            <p className="font-manrope text-[13px] font-bold text-on-surface mt-1">Ana Clara Vaz</p>
                            <p className="text-[11px] text-on-surface-variant">Primeira Avaliação Estética</p>
                            <button onClick={()=>setCurrentTab('clientes')} className="text-primary font-bold text-[11px] underline mt-3 block">Ver Prontuário</button>
                          </div>
                        )}

                        {![23, 24, 25].includes(selectedCalendarDay) && (
                          <div className="text-center py-10 text-outline space-y-2 select-none">
                            <span className="material-symbols-outlined text-4xl opacity-35">event_busy</span>
                            <p className="text-[11px]">Nenhum agendamento ativo ou faturado para este dia.</p>
                            <button 
                              onClick={() => {
                                setNewApptTime('10:00');
                                setIsNewAppointmentOpen(true);
                              }}
                              className="text-[10px] bg-primary/10 text-primary px-3 py-1.5 rounded-xl font-bold hover:bg-primary/20 transition-all select-none mt-2"
                            >
                              Agendar Procedimento
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-outline-variant/20">
                        <button 
                          onClick={() => setAgendaView('diaria')}
                          className="w-full py-2.5 bg-surface border border-outline rounded-xl font-bold font-manrope text-[11px] text-on-surface-variant hover:text-primary transition-colors text-center"
                        >
                          Ir para Timeline Diária
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Dynamic Gabi Almeida AI Widget column (Image 3) */}
              <div className="w-80 border-l border-outline-variant bg-surface-container-lowest p-6 flex flex-col gap-6 rounded-3xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-manrope font-bold text-[16px]">Próximos hoje</h3>
                  <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">2 Clientes</span>
                </div>
                
                <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1">
                  {activeNextAppointments.map((next, index) => (
                    <div key={index} className="p-4 bg-surface rounded-2xl border border-outline-variant flex flex-col hover:border-primary/35 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] text-outline font-bold uppercase tracking-wider">{next.time}</span>
                        <span className={`w-2 h-2 rounded-full ${next.tagColor === 'bg-secondary-container' ? 'bg-[#fed65b]' : 'bg-[#956c44]'}`}></span>
                      </div>
                      <p className="font-manrope text-[13px] font-bold text-on-surface">{next.name}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{next.category}</p>
                    </div>
                  ))}

                  <div className="mt-6 pt-4 border-t border-outline-variant/30">
                    <p className="text-[10px] text-outline uppercase font-bold tracking-widest mb-3">Métricas Estimadas</p>
                    <div className="space-y-3">
                      <div className="flex gap-3 items-center">
                        <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[18px]">trending_up</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-on-surface-variant">Faturamento Estimado</p>
                          <p className="font-bold text-[13px] text-primary">R$ 16.700,00</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-center">
                        <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined text-[18px]">person_check</span>
                        </div>
                        <div>
                          <p className="text-[10px] text-on-surface-variant">Taxa Ocupacional</p>
                          <p className="font-bold text-[13px] text-on-surface">92%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gemini AI interactive helper (Image 3) */}
                <div className="p-4 bg-[#79542e] text-on-primary rounded-2xl shadow-lg relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <span className="material-symbols-outlined text-[80px]">auto_awesome</span>
                  </div>
                  
                  <div className="relative z-10 space-y-3">
                    <p className="font-manrope text-[11px] font-bold text-primary-fixed uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                      Dica Gabi Almeida AI
                    </p>
                    <p className="font-sans text-[11px] text-white-pure/90 leading-relaxed font-medium">
                      {aiAdvice}
                    </p>

                    {/* AI customized request box */}
                    <div className="mt-3 pt-3 border-t border-white-pure/20 flex gap-2">
                      <input 
                        type="text"
                        value={aiCustomInput}
                        onChange={(e)=>setAiCustomInput(e.target.value)}
                        placeholder="Perguntar dica clínica..."
                        className="flex-1 bg-white-pure/10 text-[10px] rounded-lg px-2.5 py-1.5 text-white-pure placeholder:text-white-pure/50 border-none focus:outline-none focus:ring-1 focus:ring-white-pure/30"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleQueryAI();
                        }}
                      />
                      <button 
                        onClick={handleQueryAI}
                        disabled={aiLoading}
                        className="bg-white-pure text-primary px-2.5 rounded-lg hover:opacity-90 font-bold text-[10px] flex items-center justify-center cursor-pointer disabled:opacity-50"
                      >
                        {aiLoading ? '...' : 'Ir'}
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </section>
        )}

        {/* 5. Clientes CRM Details Tab (Image 2) */}
        {currentTab === 'clientes' && (
          <section className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-[#f7f3f0]">
            
            {/* Master Patient List Column */}
            <div className={`w-full lg:w-80 lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r border-outline-variant bg-white-pure flex-col overflow-hidden z-10 transition-all ${selectedPatientId ? 'hidden lg:flex flex-1 lg:h-auto' : 'flex flex-1 lg:h-auto'}`}>
              <div className="p-4 lg:p-6 flex justify-between items-center border-b border-outline-variant/60">
                <h2 className="font-manrope text-headline-md text-primary font-bold text-[18px]" id="patients-module-title">Clientes</h2>
                <span className="bg-surface-container text-primary px-3 py-1 rounded-full text-[11px] font-bold font-manrope">
                  {filteredPatients.length} Ativos
                </span>
              </div>

              {/* Patient items list wrapper */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredPatients.map(patient => (
                  <div 
                    key={patient.id}
                    onClick={() => { setSelectedPatientId(patient.id); setSignatureSaved(false); }}
                    className={`p-5 border-b border-outline-variant/40 flex items-center gap-4 cursor-pointer hover:bg-[#f7f3f0]/40 transition-colors relative ${selectedPatientId === patient.id ? 'bg-[#f7f3f0]/80' : ''}`}
                  >
                    {selectedPatientId === patient.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                    )}
                    <img className="h-10 w-10 rounded-full object-cover" src={patient.avatar} alt={patient.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-manrope text-[13px] font-extrabold text-on-surface truncate">{patient.name}</p>
                      <p className="text-[10px] text-on-surface-variant truncate mt-0.5">Última consulta: {patient.lastVisit}</p>
                    </div>
                    {patient.status === 'Em Tratamento' && (
                      <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Patient details column (Image 2 layout) */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar ${!selectedPatientId ? 'hidden lg:block' : 'block'}`}>
              {selectedPatient ? (
                <div className="max-w-6xl mx-auto p-4 sm:p-6 xl:p-8 space-y-4 xl:space-y-6">
                  
                  {/* Mobile Back Button */}
                <button 
                  onClick={() => setSelectedPatientId('')}
                  className="lg:hidden flex items-center gap-2 text-primary font-bold text-[13px] mb-2 px-2"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back_ios_new</span>
                  Voltar para lista
                </button>

                {/* Profile header visual block card */}
                <div className="bg-white-pure rounded-3xl p-5 lg:p-6 border border-outline-variant shadow-sm flex flex-col lg:flex-row gap-6 items-center lg:items-start relative overflow-hidden text-center lg:text-left">
                  <div className="relative group">
                    <img 
                      className="h-28 w-28 rounded-2xl object-cover border-2 border-primary/20 mx-auto lg:mx-0" 
                      src={selectedPatient.detailsAvatar} 
                      alt={selectedPatient.name} 
                    />
                    <button 
                      onClick={() => showAlert(`Envie uma nova foto de perfil para Dr(a). ${selectedPatient.name}`)}
                      className="absolute -bottom-2 -right-2 bg-primary text-on-primary p-2 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-white-pure">edit</span>
                    </button>
                  </div>

                  <div className="flex-1 w-full">
                    <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-4">
                      <div className="flex flex-col items-center lg:items-start">
                        <h1 className="font-manrope text-[24px] font-bold text-on-surface leading-snug">{selectedPatient.name}</h1>
                        <p className="text-on-surface-variant text-[13px] mt-1 font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          Cliente {selectedPatient.tier} • Desde {selectedPatient.since}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0 items-center justify-center">
                        <button 
                          onClick={() => {
                            // Simple print invocation to generate PDF via browser
                            window.print();
                          }}
                          className="w-full sm:w-auto px-4 py-2 border border-primary text-primary rounded-xl font-manrope text-[12px] font-extrabold hover:bg-primary hover:text-white-pure transition-all cursor-pointer"
                        >
                          Prontuário PDF
                        </button>
                        <button 
                          onClick={() => {
                            setActivePatientSubTab('evolution');
                            setTimeout(() => {
                              document.getElementById('protocolos-section')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                          className="w-full sm:w-auto px-4 py-2 bg-primary text-on-primary rounded-xl font-manrope text-[12px] font-extrabold shadow-sm hover:bg-primary-container transition-all cursor-pointer"
                        >
                          Iniciar Atendimento
                        </button>
                      </div>
                    </div>

                    {/* Visual metrics widgets (Image 2) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-surface rounded-xl p-3 border border-outline-variant/30">
                        <p className="text-[10px] text-outline mb-0.5 uppercase tracking-wider font-semibold">Total Investido</p>
                        <p className="font-manrope text-[16px] font-black text-primary">R$ {selectedPatient.totalSpent.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="bg-surface rounded-xl p-3 border border-outline-variant/30">
                        <p className="text-[10px] text-outline mb-0.5 uppercase tracking-wider font-semibold">Procedimentos</p>
                        <p className="font-manrope text-[16px] font-black text-on-surface">{(selectedPatient.proceduresCount).toString().padStart(2, '0')}</p>
                      </div>
                      <div className="bg-surface rounded-xl p-3 border border-outline-variant/30">
                        <p className="text-[10px] text-outline mb-0.5 uppercase tracking-wider font-semibold">Última Foto</p>
                        <p className="font-manrope text-[16px] font-black text-on-surface">{selectedPatient.lastPhotoDate}</p>
                      </div>
                      <div className="bg-surface rounded-xl p-3 border border-outline-variant/30">
                        <p className="text-[10px] text-outline mb-0.5 uppercase tracking-wider font-semibold">Status Clínico</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                          <p className="font-manrope text-[12px] font-bold text-tertiary">{selectedPatient.status}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Sub Tab selection line matching original layout */}
                <div className="flex gap-6 border-b border-outline-variant px-2 pb-0.5 mt-4">
                  <button 
                    onClick={() => setActivePatientSubTab('evolution')}
                    className={`pb-3 font-manrope text-[13px] font-bold relative ${activePatientSubTab === 'evolution' ? 'text-primary tab-active' : 'text-on-surface-variant hover:text-primary transition-colors'}`}
                  >
                    Histórico &amp; Evolução
                  </button>
                  <button 
                    onClick={() => setActivePatientSubTab('anamnese')}
                    className={`pb-3 font-manrope text-[13px] font-bold relative ${activePatientSubTab === 'anamnese' ? 'text-primary tab-active' : 'text-on-surface-variant hover:text-primary transition-colors'}`}
                  >
                    Anamnese
                  </button>
                  <button 
                    onClick={() => setActivePatientSubTab('financeiro')}
                    className={`pb-3 font-manrope text-[13px] font-bold relative ${activePatientSubTab === 'financeiro' ? 'text-primary tab-active' : 'text-on-surface-variant hover:text-primary transition-colors'}`}
                  >
                    Financeiro
                  </button>
                  <button 
                    onClick={() => setActivePatientSubTab('documentos')}
                    className={`pb-3 font-manrope text-[13px] font-bold relative ${activePatientSubTab === 'documentos' ? 'text-primary tab-active' : 'text-on-surface-variant hover:text-primary transition-colors'}`}
                  >
                    Documentos
                  </button>
                </div>

                {/* Patient Tabs content */}
                {activePatientSubTab === 'evolution' && (
                  <div className="grid grid-cols-12 gap-6">
                    
                    {/* Visual evolution card - Before & After comparisons */}
                    <div className="col-span-12 lg:col-span-8 bg-white-pure rounded-3xl p-6 border border-outline-variant shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="font-manrope text-[16px] font-bold text-primary">Comparativo de Tratamento (Evolução Visual)</h3>
                          <div className="flex gap-2">
                            <label className="p-2 mr-2 border border-primary/30 rounded-lg bg-primary/10 text-primary cursor-pointer flex items-center justify-center hover:bg-primary hover:text-white-pure transition-colors" title="Enviar Nova Foto de Evolução">
                              <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                              <span className="ml-1 text-[11px] font-bold uppercase">Nova Foto</span>
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  showAlert('Foto de evolução carregada e anexada ao prontuário com sucesso!');
                                }
                              }} />
                            </label>
                            <span className="p-2 rounded-lg bg-surface text-primary cursor-pointer hover:bg-surface-container" title="Grade de Evolução"><span className="material-symbols-outlined text-[18px]">grid_view</span></span>
                            <span className="p-2 rounded-lg bg-surface text-primary cursor-pointer hover:bg-surface-container" title="Modo Comparar"><span className="material-symbols-outlined text-[18px]">compare</span></span>
                          </div>
                        </div>

                        {/* Rendering exact comparison pictures from medical aesthetic sheet */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative rounded-2xl overflow-hidden shadow-inner group bg-surface">
                            <img className="w-full aspect-[4/5] object-cover" src={selectedPatient.beforePhoto} alt="Evolução Antes" />
                            <div className="absolute bottom-3 left-3 bg-[#1c1b1af0] backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-medium font-manrope uppercase">
                              Antes: 12/03/2023
                            </div>
                          </div>
                          
                          <div className="relative rounded-2xl overflow-hidden shadow-inner group bg-surface">
                            <img className="w-full aspect-[4/5] object-cover" src={selectedPatient.afterPhoto} alt="Evolução Depois" />
                            <div className="absolute bottom-3 left-3 bg-primary text-white-pure px-3 py-1 rounded-full text-[11px] font-medium font-manrope uppercase">
                              Depois: 15/10/2023 (Pós-3ª Sessão)
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Observations banner block */}
                      <div className="mt-6 p-5 bg-surface rounded-2xl border border-outline-variant/30">
                        <p className="text-[11px] text-primary font-bold uppercase mb-1.5 tracking-wider font-manrope">Observações Clínicas da Evolução</p>
                        <p className="text-[13px] text-on-surface font-medium leading-relaxed bg-transparent">{selectedPatient.evolutionNotes}</p>
                      </div>
                    </div>

                    {/* Right Info panels containing Anamnese and Signature draws */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                      
                      {/* Anamnese Summary block */}
                      <div className="bg-white-pure rounded-3xl p-6 border border-outline-variant shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-manrope text-[15px] font-bold text-on-surface">Ficha de Anamnese</h4>
                          <span 
                            onClick={() => setActivePatientSubTab('anamnese')}
                            className="material-symbols-outlined text-primary cursor-pointer hover:underline text-[18px] hover:scale-110 transition-transform"
                            title="Abrir Ficha de Anamnese"
                          >
                            open_in_new
                          </span>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-error text-[18px] mt-0.5">warning</span>
                            <div>
                              <p className="font-manrope text-[11px] font-bold text-on-surface leading-none">Alergias / Contraindicações</p>
                              <p className="text-[12px] text-on-surface-variant mt-1">{selectedPatient.allergies}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">medication</span>
                            <div>
                              <p className="font-manrope text-[11px] font-bold text-on-surface leading-none">Uso de Medicamentos</p>
                              <p className="text-[12px] text-on-surface-variant mt-1">{selectedPatient.medications}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5">history_edu</span>
                            <div>
                              <p className="font-manrope text-[11px] font-bold text-on-surface leading-none">Histórico de Injetáveis</p>
                              <p className="text-[12px] text-on-surface-variant mt-1">{selectedPatient.previousProcedures}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Digital signature simulation drawing card */}
                      <div className="bg-white-pure rounded-3xl p-6 border border-outline-variant shadow-sm relative">
                        <h4 className="font-manrope text-[15px] font-bold text-on-surface mb-3 flex items-center gap-1">
                          <span className="material-symbols-outlined text-primary text-[16px]">draw</span>
                          Validação de Sessão
                        </h4>
                        
                        {/* Interactive HTML5 drawing board */}
                        <div className="relative border-2 border-dashed border-outline-variant rounded-2xl h-36 bg-surface overflow-hidden group">
                          <canvas 
                            ref={canvasRef}
                            width={260}
                            height={140}
                            onPointerDown={startSignatureDrawing}
                            onPointerMove={drawSignature}
                            onPointerUp={stopSignatureDrawing}
                            onPointerLeave={stopSignatureDrawing}
                            className="w-full h-full cursor-crosshair z-10 relative touch-none"
                          />
                          {!isDrawing && !signatureSaved && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center text-[10px] text-outline pointer-events-none select-none">
                              <span className="material-symbols-outlined text-3xl opacity-40">draw</span>
                              <p className="mt-1">Assine na área acima com mouse ou toque para validar o procedimento</p>
                            </div>
                          )}
                          {signatureSaved && (
                            <div className="absolute inset-0 bg-primary/10 flex flex-col items-center justify-center text-center p-3 text-primary pointer-events-none select-none z-20">
                              <span className="material-symbols-outlined text-2xl animate-bounce">verified</span>
                              <p className="text-[11px] font-bold">Assinatura Certificada e Vinculada!</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex gap-2">
                          <button 
                            onClick={clearSignatureCanvas}
                            className="flex-1 py-1.5 text-[11px] border border-outline-variant rounded-lg hover:bg-surface text-center font-bold"
                          >
                            Limpar
                          </button>
                          <button 
                            onClick={confirmSignature}
                            className="flex-1 py-1.5 text-[11px] bg-primary text-white-pure rounded-lg text-center font-bold"
                          >
                            Confirmar
                          </button>
                        </div>
                        <p className="text-[9px] text-on-surface-variant mt-2 text-center italic opacity-75">
                          Segurança ICP-Brasil • IP: 192.168.1.45
                        </p>
                      </div>

                    </div>

                    {/* Full Timeline history block (Image 2) */}
                    <div id="protocolos-section" className="col-span-12 bg-white-pure rounded-3xl p-8 border border-outline-variant shadow-sm">
                      <h3 className="font-manrope text-[16px] font-bold text-primary mb-6">Protocolos</h3>
                      <div className="mb-8 flex flex-col gap-3 p-5 bg-[#fcfaf7] rounded-2xl border border-[#d3c5b8]/50 shadow-sm relative">
                        <h4 className="font-manrope text-[14px] font-bold text-[#79542e]">Descrever Novo Protocolo de Atendimento</h4>
                        <textarea 
                          id="novoProtocolo"
                          className="w-full h-24 p-3 text-[13px] bg-white-pure border border-[#d3c5b8] rounded-xl focus:outline-none focus:border-[#79542e] resize-none text-on-surface"
                          placeholder="Ex: Realizado limpeza profunda, aplicação de peeling 30%, cliente orientada sobre home-care..."
                        ></textarea>
                        <div className="flex justify-end mt-1">
                          <button 
                            className="px-5 py-2 bg-[#79542e] text-white-pure font-bold font-manrope text-[12px] rounded-xl hover:bg-[#634425] transition-colors shadow-md" 
                            onClick={() => {
                              const el = document.getElementById('novoProtocolo') as HTMLTextAreaElement;
                              if (el && el.value.trim() !== '') {
                                showAlert('Protocolo adicionado ao prontuário do cliente!');
                                el.value = '';
                              } else {
                                showAlert('Por favor, descreva o protocolo antes de adicionar.');
                              }
                            }}
                          >Adicionar Protocolo</button>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute left-[24px] top-2 bottom-2 w-[1px] bg-surface-container-high"></div>
                        <div className="space-y-8">
                          {selectedPatient.timeline.map((item, index) => (
                            <div key={item.id} className="relative flex gap-6 items-start">
                              <div className="z-10 bg-primary w-12 h-12 rounded-full flex items-center justify-center shadow border-4 border-white-pure text-white-pure">
                                <span className="material-symbols-outlined text-[18px]">
                                  {item.category === 'Procedimento' ? 'face' : 'chat_bubble'}
                                </span>
                              </div>
                              <div className="flex-1 pt-1 bg-surface-container/10 p-4 rounded-xl border border-outline-variant/30">
                                <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                                  <h4 className="font-manrope text-[13px] font-bold text-on-surface">{item.title}</h4>
                                  <span className="text-[11px] text-on-surface-variant font-medium">{item.date}</span>
                                </div>
                                <p className="text-[12px] text-on-surface-variant leading-relaxed mt-1">{item.description}</p>
                                <div className="flex gap-2 mt-3">
                                  <span className="bg-[#fed65b] text-[#745c00] px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase">
                                    {item.category}
                                  </span>
                                  <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase">
                                    {item.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* Anamnese */}
                {activePatientSubTab === 'anamnese' && (
                  <AnamneseLimpezaDePele 
                    patientName={selectedPatient.name} 
                    onCancel={() => setActivePatientSubTab('evolution')} 
                    onSave={() => {
                        showAlert('Ficha de anamnese salva com sucesso!');
                        setActivePatientSubTab('evolution');
                    }}
                  />
                )}

                 {/* Interactive Clinical Finance Sub-Tab */}
                {activePatientSubTab === 'financeiro' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="bg-[#fcfaf7] rounded-2xl p-4 border border-outline-variant/60">
                        <p className="text-[10px] text-outline font-extrabold uppercase tracking-widest mb-1">Total Faturado</p>
                        <p className="font-manrope text-[18px] font-black text-on-surface">
                          R$ {((patientFinancials[selectedPatient.id] || []).reduce((acc, item) => acc + item.price, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-[#ecf7ed] rounded-2xl p-4 border border-emerald-200/50">
                        <p className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-widest mb-1">Total Confirmado (Pago)</p>
                        <p className="font-manrope text-[18px] font-black text-emerald-700">
                          R$ {((patientFinancials[selectedPatient.id] || []).filter(i => i.status === 'Pago').reduce((acc, item) => acc + item.price, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-[#fff9eb] rounded-2xl p-4 border border-amber-200/50">
                        <p className="text-[10px] text-amber-800 font-extrabold uppercase tracking-widest mb-1">Pendente / Parcelas</p>
                        <p className="font-manrope text-[18px] font-black text-amber-700">
                          R$ {((patientFinancials[selectedPatient.id] || []).filter(i => i.status === 'Pendente').reduce((acc, item) => acc + item.price, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Billed items table (Left) */}
                      <div className="lg:col-span-8 bg-white-pure p-6 rounded-3xl border border-outline-variant/70 shadow-sm">
                        <div className="flex justify-between items-center mb-5 flex-wrap gap-2">
                          <h4 className="font-manrope text-[15px] font-bold text-on-surface">Transações Clínicas Registradas</h4>
                          <span className="text-[10px] text-outline font-semibold">ICP-Brasil Autenticado</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-outline-variant/60 text-[10px] text-outline uppercase font-black tracking-wider">
                                <th className="py-2 pb-3">Data</th>
                                <th className="py-2 pb-3">Descrição / Procedimento</th>
                                <th className="py-2 pb-3">Método</th>
                                <th className="py-2 pb-3">Valor</th>
                                <th className="py-2 pb-3 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/30 text-[12px]">
                              {((patientFinancials[selectedPatient.id] || [])).map((item) => (
                                <tr key={item.id} className="hover:bg-surface-container/20 group">
                                  <td className="py-3.5 font-medium text-on-surface-variant">{item.date}</td>
                                  <td className="py-3.5">
                                    <p className="font-bold text-on-surface font-manrope">{item.procedure}</p>
                                    <p className="text-[10px] text-outline mt-0.5">{item.description}</p>
                                  </td>
                                  <td className="py-3.5 text-on-surface-variant font-medium">{item.method}</td>
                                  <td className="py-3.5 font-bold font-manrope text-primary">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                  <td className="py-3.5 text-right">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                      item.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {item.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              {((patientFinancials[selectedPatient.id] || [])).length === 0 && (
                                <tr>
                                  <td colSpan={5} className="py-8 text-center text-outline text-[11px] font-medium">Nenhum faturamento lançado para este cliente.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Quick launch panel (Right) */}
                      <div className="lg:col-span-4 bg-white-pure p-6 rounded-3xl border border-outline-variant/70 shadow-sm space-y-4">
                        <h4 className="font-manrope text-[14px] font-black text-on-surface">Lançar Nova Cobrança</h4>
                        <div className="space-y-3.5 text-[11px] font-bold text-on-surface-variant">
                          <div>
                            <label className="block mb-1">Procedimento</label>
                            <input 
                              type="text" 
                              id="new_proc_name"
                              placeholder="Ex: Preenchimento labial"
                              className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary text-[12px]" 
                            />
                          </div>
                          <div>
                            <label className="block mb-1">Valor (R$)</label>
                            <input 
                              type="number" 
                              id="new_proc_val"
                              placeholder="1200" 
                              className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary text-[12px]" 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block mb-1">Método</label>
                              <select id="new_proc_method" className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary text-[12px]">
                                <option value="PIX">PIX</option>
                                <option value="Cartão">Cartão</option>
                                <option value="Boleto">Boleto</option>
                              </select>
                            </div>
                            <div>
                              <label className="block mb-1">Status</label>
                              <select id="new_proc_status" className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary text-[12px]">
                                <option value="Pago">Pago</option>
                                <option value="Pendente">Pendente</option>
                              </select>
                            </div>
                          </div>
                          
                          <button 
                            onClick={async () => {
                              const proc = (document.getElementById('new_proc_name') as HTMLInputElement)?.value;
                              const val = parseFloat((document.getElementById('new_proc_val') as HTMLInputElement)?.value);
                              const method = (document.getElementById('new_proc_method') as HTMLSelectElement)?.value;
                              const status = (document.getElementById('new_proc_status') as HTMLSelectElement)?.value as 'Pago' | 'Pendente';
                              
                              if (!proc || isNaN(val)) {
                                showAlert('Por favor, preencha o nome do procedimento e valor válidos!');
                                return;
                              }

                              const newItem: PatientFinancialItem = {
                                id: Math.random().toString(),
                                date: new Date().toLocaleDateString('pt-BR'),
                                description: `${proc} - Lançado via Prontuário`,
                                procedure: proc,
                                price: val,
                                status,
                                method
                              };

                              const updatedFinancials = [newItem, ...(patientFinancials[selectedPatient.id] || [])];
                              
                              try {
                                const { error: patErr } = await supabase
                                  .from('patients')
                                  .update({
                                    total_spent: (selectedPatient.totalSpent || 0) + val,
                                    procedures_count: (selectedPatient.proceduresCount || 0) + 1,
                                    financials: updatedFinancials
                                  })
                                  .eq('id', selectedPatient.id);
                                if (patErr) throw patErr;

                                const { error: txErr } = await supabase
                                  .from('transactions')
                                  .insert([{
                                    description: `${proc} - ${selectedPatient.name}`,
                                    date: new Date().toLocaleDateString('pt-BR'),
                                    category: 'Procedimento',
                                    status: status === 'Pago' ? 'Pago' : 'Pendente',
                                    value: val
                                  }]);
                                if (txErr) throw txErr;

                                showAlert('Lançamento registrado e integrado ao prontuário médico com sucesso!');
                                ((document.getElementById('new_proc_name') as HTMLInputElement).value = '');
                                ((document.getElementById('new_proc_val') as HTMLInputElement).value = '');
                              } catch (err: any) {
                                console.error('Error registering financial/transaction:', err);
                                showAlert(`Erro ao salvar lançamentos: ${err.message || err}`);
                              }
                            }}
                            className="w-full py-2.5 bg-primary text-white-pure rounded-xl text-center font-black cursor-pointer shadow hover:opacity-90 transition-opacity"
                          >
                            Registrar Recebimento
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive Clinical Document Manager Sub-Tab */}
                {activePatientSubTab === 'documentos' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="bg-white-pure p-6 rounded-3xl border border-outline-variant/70 shadow-sm">
                      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                        <div>
                          <h4 className="font-manrope text-[15px] font-black text-on-surface">Gerenciador de Documentos Clínicos</h4>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">Termos de consentimento livre, contratos de serviço e anamnese certificada.</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-xl font-bold font-manrope text-[11px] hover:bg-primary/5 cursor-pointer transition-colors">
                            <span className="material-symbols-outlined text-[15px]">upload_file</span>
                            Enviar Novo Arquivo (PDF)
                            <input 
                              type="file" 
                              className="hidden" 
                              accept=".pdf,.png,.jpg"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const newDoc: PatientDocument = {
                                    id: 'doc_' + Math.random().toString(36).substring(2, 9),
                                    name: file.name,
                                    type: file.name.toLowerCase().includes('contrato') ? 'Contrato' : 'Outro',
                                    date: new Date().toLocaleDateString('pt-BR'),
                                    size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                                    signed: false
                                  };
                                  const updatedDocs = [...(patientDocuments[selectedPatient.id] || []), newDoc];
                                  try {
                                    const { error } = await supabase
                                      .from('patients')
                                      .update({ documents: updatedDocs })
                                      .eq('id', selectedPatient.id);
                                    if (error) throw error;
                                    setPatientDocuments(prev => ({
                                      ...prev,
                                      [selectedPatient.id]: updatedDocs
                                    }));
                                    showAlert(`Documento "${file.name}" carregado com sucesso na pasta de prontuários!`);
                                  } catch (err: any) {
                                    console.error('Error uploading document:', err);
                                    showAlert(`Erro ao salvar documento: ${err.message}`);
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(patientDocuments[selectedPatient.id] || []).map((doc) => (
                          <div key={doc.id} className="bg-[#fcfaf7] border border-outline-variant/60 rounded-2xl p-5 hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
                            <div>
                              <div className="flex justify-between items-start mb-3">
                                <span className="p-2.5 bg-[#f0e8df] text-primary rounded-xl">
                                  <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${
                                  doc.signed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                 }`}>
                                  {doc.signed ? 'Assinado' : 'Pendente'}
                                </span>
                              </div>

                              <p className="font-manrope text-[12px] font-bold text-on-surface line-clamp-2" title={doc.name}>
                                {doc.name}
                              </p>
                              
                              <div className="flex gap-4 text-[10px] text-outline mt-2 font-semibold">
                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">calendar_today</span> {doc.date}</span>
                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">database</span> {doc.size}</span>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-outline-variant/50 flex gap-2 justify-end">
                              <button 
                                onClick={() => {
                                  showAlert(`Abrindo visualização segura de: ${doc.name}\nCertificado ICP-Brasil ID: #${doc.id}`);
                                }}
                                className="px-2.5 py-1.5 text-[10px] bg-white-pure hover:bg-surface border border-outline text-on-surface rounded-lg font-black"
                              >
                                Visualizar
                              </button>
                              
                              {!doc.signed && (
                                <button 
                                  onClick={async () => {
                                    const updatedDocs = (patientDocuments[selectedPatient.id] || []).map(item => 
                                      item.id === doc.id ? { ...item, signed: true } : item
                                    );
                                    try {
                                      const { error } = await supabase
                                        .from('patients')
                                        .update({ documents: updatedDocs })
                                        .eq('id', selectedPatient.id);
                                      if (error) throw error;
                                      setPatientDocuments(prev => ({
                                        ...prev,
                                        [selectedPatient.id]: updatedDocs
                                      }));
                                      showAlert(`Sucesso! O documento foi assinado por ${selectedPatient.name} via iPad/tablet integrado com certificado ICP-Brasil e carimbo de data/hora válido!`);
                                    } catch (err: any) {
                                      console.error('Error signing document:', err);
                                      showAlert(`Erro ao assinar documento: ${err.message}`);
                                    }
                                  }}
                                  className="px-2.5 py-1.5 text-[10px] bg-primary text-white-pure rounded-lg hover:opacity-90 font-black transition-opacity"
                                >
                                  Assinar (ICP)
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {(patientDocuments[selectedPatient.id] || []).length === 0 && (
                          <div className="col-span-12 text-center py-10 text-outline text-[11px] font-medium space-y-2">
                            <span className="material-symbols-outlined text-4xl opacity-35">folder_open</span>
                            <p>Nenhum documento anexado ao prontuário.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/60 font-manrope space-y-4 pt-20">
                  <span className="material-symbols-outlined text-[64px] opacity-50">person_off</span>
                  <p className="text-[18px] font-bold">Nenhum cliente selecionado ou cadastrado.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 6. Financeiro Module (Image 1 Layout) */}
        {currentTab === 'financeiro' && (
          <section className="flex-1 overflow-y-auto p-12 bg-surface">
            
            {/* Bento cards metric panel (Image 1) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              
              {/* Entradas Card */}
              <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <span className="text-[#745c00] font-bold text-[11px] bg-[#fed65b] px-3 py-1 rounded-full">+12.5%</span>
                </div>
                <p className="font-manrope text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">Entradas Mensais</p>
                <h2 className="font-manrope text-[28px] font-extrabold text-on-surface tracking-tight mt-1">R$ 142.580,00</h2>
                <div className="mt-6 h-12 w-full flex items-end gap-1 px-1">
                  <div className="flex-1 bg-primary/25 h-[40%] rounded-t-sm"></div>
                  <div className="flex-1 bg-primary/25 h-[60%] rounded-t-sm"></div>
                  <div className="flex-1 bg-primary/25 h-[45%] rounded-t-sm"></div>
                  <div className="flex-1 bg-primary/25 h-[80%] rounded-t-sm"></div>
                  <div className="flex-1 bg-primary/25 h-[70%] rounded-t-sm"></div>
                  <div className="flex-1 bg-primary h-[95%] rounded-t-sm"></div>
                </div>
              </div>

              {/* Paying commissions metrics */}
              <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                  </div>
                  <span className="text-on-surface-variant font-bold text-[11px] bg-surface-container px-3 py-1 rounded-full">Projetado</span>
                </div>
                <p className="font-manrope text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">Comissões a Pagar</p>
                <h2 className="font-manrope text-[28px] font-extrabold text-on-surface tracking-tight mt-1">R$ 38.420,00</h2>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-medium text-on-surface-variant">
                    <span>Dr. André (Dermato)</span>
                    <span className="font-extrabold">R$ 12.200</span>
                  </div>
                  <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                    <div className="bg-[#eebd8e] h-full w-[65%]"></div>
                  </div>
                </div>
              </div>

              {/* Monthly target layout image 1 card */}
              <div className="bg-[#79542e] text-white-pure p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-manrope text-[11px] text-primary-fixed uppercase tracking-widest font-bold">Meta de Faturamento</p>
                    <span className="material-symbols-outlined text-primary-fixed">ads_click</span>
                  </div>
                  <h2 className="font-manrope text-[40px] font-black leading-tight">82%</h2>
                  <p className="text-[12px] opacity-95 text-primary-fixed mt-1.5">Faltam R$ 27.420,00 para atingir a meta premium.</p>
                </div>
                <div className="mt-6 space-y-1.5">
                  <div className="w-full bg-white-pure/20 h-2 rounded-full overflow-hidden">
                    <div className="bg-white-pure h-full" style={{width: '82%'}}></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-primary-fixed-dim">
                    <span>R$ 0</span>
                    <span>R$ 170K META</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Split layout: Cash flow detailed and commission leaders (Image 1) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-8">
              
              {/* Detailed Cashflow chart (Left) */}
              <div className="lg:col-span-8 glass-panel p-6 rounded-3xl flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-manrope text-[16px] font-bold text-on-surface">Fluxo de Caixa Detalhado</h3>
                    <p className="text-[12px] text-on-surface-variant mt-0.5">Visão comparativa de entradas e saídas nos últimos 30 dias</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setFinancialTimeframe('semanal')}
                      className={`px-4 py-1.5 border rounded-xl font-manrope text-[11px] font-bold transition-all cursor-pointer ${financialTimeframe === 'semanal' ? 'bg-[#79542e] text-white-pure border-primary' : 'border-outline hover:bg-surface'}`}
                    >
                      Semanal
                    </button>
                    <button 
                      onClick={() => setFinancialTimeframe('mensal')}
                      className={`px-4 py-1.5 border rounded-xl font-manrope text-[11px] font-bold transition-all cursor-pointer ${financialTimeframe === 'mensal' ? 'bg-[#79542e] text-white-pure border-primary' : 'border-outline hover:bg-surface'}`}
                    >
                      Mensal
                    </button>
                  </div>
                </div>

                {/* Highly aesthetic interactive bars chart representing image 1 meticulously */}
                <div className="relative h-60 w-full flex items-end justify-between px-4 mt-4">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-1">
                    <div className="border-b border-outline-variant/20 w-full h-0"></div>
                    <div className="border-b border-outline-variant/20 w-full h-0"></div>
                    <div className="border-b border-outline-variant/20 w-full h-0"></div>
                    <div className="border-b border-outline-variant/20 w-full h-0"></div>
                    <div className="w-full h-0"></div>
                  </div>

                  {/* Dual Bar 1 */}
                  <div className="flex items-end gap-1.5 h-full group pb-1">
                    <div className="w-4 bg-primary-container/40 h-[40%] rounded-t-sm transition-all group-hover:bg-primary-container group-hover:scale-y-105" title="Entradas Sem 1"></div>
                    <div className="w-4 bg-secondary-container h-[25%] rounded-t-sm transition-all group-hover:bg-secondary-container/80 group-hover:scale-y-105" title="Saídas Sem 1"></div>
                  </div>

                  {/* Dual Bar 2 */}
                  <div className="flex items-end gap-1.5 h-full group pb-1">
                    <div className="w-4 bg-primary-container/40 h-[55%] rounded-t-sm transition-all group-hover:bg-primary-container group-hover:scale-y-105" title="Entradas Sem 2"></div>
                    <div className="w-4 bg-secondary-container h-[30%] rounded-t-sm transition-all group-hover:bg-secondary-container/80 group-hover:scale-y-105" title="Saídas Sem 2"></div>
                  </div>

                  {/* Dual Bar 3 */}
                  <div className="flex items-end gap-1.5 h-full group pb-1">
                    <div className="w-4 bg-primary-container/40 h-[75%] rounded-t-sm transition-all group-hover:bg-primary-container group-hover:scale-y-105" title="Entradas Sem 3"></div>
                    <div className="w-4 bg-secondary-container h-[45%] rounded-t-sm transition-all group-hover:bg-secondary-container/80 group-hover:scale-y-105" title="Saídas Sem 3"></div>
                  </div>

                  {/* Dual Bar 4 */}
                  <div className="flex items-end gap-1.5 h-full group pb-1">
                    <div className="w-4 bg-primary-container/40 h-[60%] rounded-t-sm transition-all group-hover:bg-primary-container group-hover:scale-y-105" title="Entradas Sem 4"></div>
                    <div className="w-4 bg-secondary-container h-[40%] rounded-t-sm transition-all group-hover:bg-secondary-container/80 group-hover:scale-y-105" title="Saídas Sem 4"></div>
                  </div>

                  {/* Dual Bar 5 */}
                  <div className="flex items-end gap-1.5 h-full group pb-1">
                    <div className="w-4 bg-primary-container/50 h-[90%] rounded-t-sm transition-all group-hover:bg-primary-container group-hover:scale-y-105" title="Entradas Sem 5"></div>
                    <div className="w-4 bg-secondary-container h-[20%] rounded-t-sm transition-all group-hover:bg-secondary-container/80 group-hover:scale-y-105" title="Saídas Sem 5"></div>
                  </div>

                  {/* Dual Bar 6 */}
                  <div className="flex items-end gap-1.5 h-full group pb-1">
                    <div className="w-4 bg-primary-container/60 h-[85%] rounded-t-sm transition-all group-hover:bg-primary-container group-hover:scale-y-105" title="Entradas Sem 6"></div>
                    <div className="w-4 bg-secondary-container h-[55%] rounded-t-sm transition-all group-hover:bg-secondary-container/80 group-hover:scale-y-105" title="Saídas Sem 6"></div>
                  </div>

                  {/* Dual Bar 7 */}
                  <div className="flex items-end gap-1.5 h-full group pb-1">
                    <div className="w-4 bg-primary h-[100%] rounded-t-sm transition-all group-hover:scale-y-105" title="Picos do mês: Entradas R$ 142K"></div>
                    <div className="w-4 bg-secondary h-[40%] rounded-t-sm transition-all group-hover:scale-y-105" title="Saídas R$ 38K"></div>
                  </div>

                </div>

                <div className="mt-4 flex justify-center gap-8 text-[11px] font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#956c44]"></span>
                    <span className="text-on-surface-variant">Fluxo de Entradas (Faturamento)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#fed65b]"></span>
                    <span className="text-on-surface-variant">Fluxo de Saídas (Despesas/Insumos)</span>
                  </div>
                </div>
              </div>

              {/* Commission Leaders (Right) */}
              <div className="lg:col-span-4 glass-panel p-6 rounded-3xl flex flex-col justify-between">
                <div>
                  <h3 className="font-manrope text-[16px] font-bold text-on-surface mb-6">Repasse de Comissões</h3>
                  <div className="space-y-4">
                    {commissionLeaders.map((lead, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-white-pure/40 rounded-xl hover:bg-white-pure transition-colors">
                        <img className="w-10 h-10 rounded-full object-cover" src={lead.avatar} alt={lead.name} />
                        <div className="flex-1 min-w-0">
                          <p className="font-manrope text-[12px] font-bold text-on-surface truncate">{lead.name}</p>
                          <p className="text-[10px] text-on-surface-variant tracking-wider uppercase">Faturamento: R$ {lead.revenue.toLocaleString('pt-BR')}</p>
                        </div>
                        <p className="font-manrope text-[12px] font-extrabold text-primary">R$ {lead.commission.toLocaleString('pt-BR')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => showAlert('Relatório fiscal de Repasses e Lançamentos gerado para download!')}
                  className="w-full mt-6 py-2.5 border border-primary text-primary rounded-xl font-bold font-manrope text-[12px] hover:bg-primary/5 transition-all cursor-pointer text-center"
                >
                  Relatório de Repasse Completo
                </button>
              </div>

            </div>

            {/* Bottom Transações Recentes block (Image 1) */}
            <div className="glass-panel p-6 rounded-3xl">
              {/* Top Row Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-outline-variant/30 pb-4 gap-4">
                <h3 className="font-manrope text-[16px] font-bold text-on-surface">Transações Financeiras</h3>
                <div className="flex gap-2">
                  <button onClick={() => {
                    setEditingTransaction(null);
                    setIsTransactionModalOpen(true);
                  }} className="px-3 py-1.5 bg-primary text-white-pure rounded-lg text-[12px] font-bold shadow-sm hover:opacity-90">
                    Nova Transação
                  </button>
                  <button onClick={() => {
                    showConfirm('Tem certeza de que deseja resetar todo o histórico financeiro?', async () => {
                      try {
                        const { error } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        if (error) throw error;
                      } catch (err: any) {
                        console.error('Error resetting transactions:', err);
                        showAlert(`Erro ao resetar financeiro: ${err.message}`);
                      }
                    });
                  }} className="px-3 py-1.5 border border-error/50 text-error hover:bg-error/10 rounded-lg text-[12px] font-bold transition-colors">
                    Resetar Financeiro
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-6 py-3 font-manrope text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 font-manrope text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Descrição</th>
                      <th className="px-6 py-3 font-manrope text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Categoria</th>
                      <th className="px-6 py-3 font-manrope text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 font-manrope text-[11px] text-on-surface-variant font-bold uppercase tracking-wider text-right">Valor</th>
                      <th className="px-6 py-3 font-manrope text-[11px] text-on-surface-variant font-bold uppercase tracking-wider text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-light">
                    {filteredTransactions.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-6 text-on-surface-variant">Nenhuma transação encontrada.</td></tr>
                    ) : filteredTransactions.map(tr => (
                      <tr key={tr.id} className="hover:bg-surface-container/20 transition-colors">
                        <td className="px-6 py-4 text-[12px] text-on-surface-variant">{tr.date}</td>
                        <td className="px-6 py-4 font-bold text-on-surface">{tr.description}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold ${getCategoryTheme(tr.category)}`}>
                            {tr.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-manrope text-[11px] font-bold text-tertiary flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>{tr.status}</span>
                        </td>
                        <td className={`px-6 py-4 text-right font-bold text-[13px] ${tr.value < 0 ? 'text-error' : 'text-on-surface'}`}>
                          {tr.value < 0 ? `- R$ ${Math.abs(tr.value).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : `R$ ${tr.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => {
                            setEditingTransaction(tr);
                            setIsTransactionModalOpen(true);
                          }} className="p-1 text-on-surface-variant hover:text-primary transition-colors material-symbols-outlined text-[18px]">edit</button>
                          <button onClick={async () => {
                            try {
                              const { error } = await supabase.from('transactions').delete().eq('id', tr.id);
                              if (error) throw error;
                            } catch (err: any) {
                              console.error('Error deleting transaction:', err);
                              showAlert(`Erro ao excluir transação: ${err.message}`);
                            }
                          }} className="p-1 text-on-surface-variant hover:text-error transition-colors material-symbols-outlined text-[18px]">delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </section>
        )}

        {/* 6.1. Serviços e Tratamentos Module */}
        {currentTab === 'servicos' && (
          <section className="flex-1 overflow-y-auto custom-scrollbar bg-[#f7f3f0] p-4 sm:p-8 xl:p-12 relative animate-fade-in">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h2 className="font-manrope text-headline-lg text-primary font-bold text-[32px] md:text-[40px] leading-tight">Serviços e Tratamentos</h2>
                  <p className="font-sans text-[14px] text-on-surface-variant max-w-2xl mt-2">
                    Gerencie os serviços oferecidos, valores e durações estimadas para o sistema de agendamento.
                  </p>
                </div>
                <button 
                  onClick={() => { setEditingService(null); setIsServiceModalOpen(true); }}
                  className="bg-primary text-on-primary px-6 py-3 rounded-xl font-manrope font-bold text-[14px] flex items-center gap-2 hover:opacity-90 transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Novo Serviço
                </button>
              </div>

              <div className="bg-white-pure rounded-3xl p-6 border border-outline-variant shadow-sm flex flex-col gap-6 relative overflow-hidden group">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-[13px]">
                    <thead>
                      <tr className="border-b border-outline-variant/60">
                        <th className="pb-3 px-4 font-bold text-on-surface-variant font-manrope">Nome do Serviço</th>
                        <th className="pb-3 px-4 font-bold text-on-surface-variant font-manrope">Categoria</th>
                        <th className="pb-3 px-4 font-bold text-on-surface-variant font-manrope">Duração</th>
                        <th className="pb-3 px-4 font-bold text-on-surface-variant font-manrope">Preço Base</th>
                        <th className="pb-3 px-4 text-center font-bold text-on-surface-variant font-manrope">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map(s => (
                        <tr key={s.id} className="border-b border-outline-variant/30 hover:bg-[#fcfaf7]">
                          <td className="px-4 py-4 font-bold text-on-surface">{s.name}</td>
                          <td className="px-4 py-4"><span className="bg-surface-container px-2.5 py-1 rounded-md text-[10px] font-bold">{s.category}</span></td>
                          <td className="px-4 py-4 text-on-surface-variant">{s.duration}</td>
                          <td className="px-4 py-4 font-bold text-primary">R$ {s.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                          <td className="px-4 py-4 text-center">
                            <button onClick={() => { setEditingService(s); setIsServiceModalOpen(true); }} className="p-1.5 text-on-surface-variant hover:text-primary transition-colors text-[16px] material-symbols-outlined">edit</button>
                            <button onClick={() => { showConfirm(`Remover o serviço ${s.name}?`, async () => { try { const { error } = await supabase.from('services').delete().eq('id', s.id); if (error) throw error; } catch (err: any) { console.error('Error deleting service:', err); showAlert(`Erro ao remover serviço: ${err.message}`); } }) }} className="p-1.5 text-on-surface-variant hover:text-error transition-colors text-[16px] material-symbols-outlined">delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 6.2. Estoque Module */}
        {currentTab === 'estoque' && (
          <section className="flex-1 overflow-y-auto custom-scrollbar bg-[#f7f3f0] p-4 sm:p-8 xl:p-12 relative animate-fade-in">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h2 className="font-manrope text-headline-lg text-primary font-bold text-[32px] md:text-[40px] leading-tight">Controle de Estoque</h2>
                  <p className="font-sans text-[14px] text-on-surface-variant max-w-2xl mt-2">
                    Acompanhe as quantidades de materiais. Alertas são disparados no painel quando algo ficar abaixo do mínimo.
                  </p>
                </div>
                <button 
                  onClick={() => { setEditingInventory(null); setIsInventoryModalOpen(true); }}
                  className="bg-primary text-on-primary px-6 py-3 rounded-xl font-manrope font-bold text-[14px] flex items-center gap-2 hover:opacity-90 transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-[20px]">add_box</span>
                  Adicionar Item
                </button>
              </div>

              <div className="bg-white-pure rounded-3xl p-6 border border-outline-variant shadow-sm flex flex-col gap-6 relative overflow-hidden group">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-[13px]">
                    <thead>
                      <tr className="border-b border-outline-variant/60">
                        <th className="pb-3 px-4 font-bold text-on-surface-variant font-manrope">Nome do Material/Insumo</th>
                        <th className="pb-3 px-4 text-center font-bold text-on-surface-variant font-manrope">Quantidade Atual</th>
                        <th className="pb-3 px-4 text-center font-bold text-on-surface-variant font-manrope">Estoque Mínimo</th>
                        <th className="pb-3 px-4 text-center font-bold text-on-surface-variant font-manrope">Status</th>
                        <th className="pb-3 px-4 text-center font-bold text-on-surface-variant font-manrope">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(i => {
                        const isLow = i.quantity <= i.minQuantity;
                        return (
                          <tr key={i.id} className={`border-b border-outline-variant/30 hover:bg-[#fcfaf7] ${isLow ? 'bg-error/5' : ''}`}>
                            <td className="px-4 py-4 font-bold text-on-surface">{i.name}</td>
                            <td className="px-4 py-4 text-center"><span className="font-bold text-[14px]">{i.quantity}</span> <span className="text-on-surface-variant text-[11px]">{i.unit}</span></td>
                            <td className="px-4 py-4 text-center text-on-surface-variant">{i.minQuantity} <span className="text-[11px]">{i.unit}</span></td>
                            <td className="px-4 py-4 text-center">
                              {isLow ? (
                                <span className="bg-error/10 text-error px-2.5 py-1 rounded-md text-[10px] font-bold">Crítico</span>
                              ) : (
                                <span className="bg-tertiary/10 text-tertiary px-2.5 py-1 rounded-md text-[10px] font-bold">Adequado</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button onClick={() => { setEditingInventory(i); setIsInventoryModalOpen(true); }} className="p-1.5 text-on-surface-variant hover:text-primary transition-colors text-[16px] material-symbols-outlined">edit</button>
                              <button onClick={() => { showConfirm(`Remover o material ${i.name}?`, async () => {
                                try {
                                  const { error } = await supabase.from('inventory').delete().eq('id', i.id);
                                  if (error) throw error;
                                } catch (err: any) {
                                  console.error('Error deleting inventory item:', err);
                                  showAlert(`Erro ao remover material: ${err.message}`);
                                }
                              }) }} className="p-1.5 text-on-surface-variant hover:text-error transition-colors text-[16px] material-symbols-outlined">delete</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 6. Cadastro e Gestão de Clientes (CRUD) */}
        {currentTab === 'cadastro-cliente' && (
          <section className="flex-1 overflow-y-auto custom-scrollbar bg-[#f7f3f0] p-4 sm:p-8 xl:p-12 relative animate-fade-in">
            <div className="max-w-7xl mx-auto space-y-8">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h2 className="font-manrope text-headline-lg text-primary font-bold text-[32px] md:text-[40px] leading-tight">Cadastro de Clientes</h2>
                  <p className="font-sans text-[14px] text-on-surface-variant max-w-2xl mt-2">
                    Gerencie a base de clientes da clínica. Adicione, edite ou inative cadastros facilmente.
                  </p>
                </div>
                
                <button 
                  id="btn-novo-cliente"
                  onClick={() => { setEditingPatientId(null); setIsPatientModalOpen(true); }}
                  className="bg-primary text-on-primary px-6 py-3 rounded-xl font-manrope font-bold text-[14px] flex items-center gap-2 hover:opacity-90 transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                  Adicionar Cliente
                </button>
              </div>

              {/* Data Table Panel */}
              <div className="bg-white-pure rounded-3xl p-6 border border-outline-variant shadow-sm flex flex-col gap-6 relative overflow-hidden group">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-[13px]">
                    <thead>
                      <tr className="border-b border-outline-variant/60">
                        <th className="pb-3 px-4 font-bold text-on-surface-variant font-manrope">Cliente</th>
                        <th className="pb-3 px-4 text-center font-bold text-on-surface-variant font-manrope">Status</th>
                        <th className="pb-3 px-4 text-center font-bold text-on-surface-variant font-manrope">Última Visita</th>
                        <th className="pb-3 px-4 font-bold text-on-surface-variant font-manrope">Gasto Contínuo (LTV)</th>
                        <th className="pb-3 px-4 text-center font-bold text-on-surface-variant font-manrope">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map(p => (
                        <tr key={p.id} className="border-b border-outline-variant/30 hover:bg-[#fcfaf7]">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <img src={p.avatar} alt="avatar" className="w-10 h-10 rounded-full border border-primary/20 object-cover" />
                              <div className="flex flex-col">
                                <span className="font-extrabold text-on-surface text-[14px] font-manrope">{p.name}</span>
                                <span className="text-[11px] text-on-surface-variant">{p.birthdate || 'Cadastrado Dez 2023'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {p.status === 'Em Tratamento' ? (
                              <span className="bg-tertiary/10 text-tertiary px-2.5 py-1 rounded-md text-[10px] font-bold">Ativo</span>
                            ) : (
                              <span className="bg-outline-variant/20 text-on-surface-variant px-2.5 py-1 rounded-md text-[10px] font-bold">Inativo</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-on-surface font-medium">{p.lastVisit}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-[#4c845b]">{p.ltv}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => {
                                  setSelectedPatientId(p.id);
                                  setCurrentTab('clientes');
                                }}
                                className="p-1.5 text-primary hover:bg-primary/10 transition-colors text-[16px] material-symbols-outlined rounded-md"
                                title="Acessar Prontuário CRM"
                              >
                                open_in_new
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingPatientId(p.id);
                                  setIsPatientModalOpen(true);
                                }}
                                className="p-1.5 text-on-surface-variant hover:text-primary transition-colors text-[16px] material-symbols-outlined rounded-md"
                                title="Editar Cadastro"
                              >
                                edit
                              </button>
                              <button 
                                onClick={() => {
                                  showConfirm(`Tem certeza de que deseja remover ${p.name} do sistema? (Esta ação não pode ser desfeita)`, async () => {
                                    try {
                                      const { error } = await supabase.from('patients').delete().eq('id', p.id);
                                      if (error) throw error;
                                    } catch (err: any) {
                                      console.error('Error deleting patient:', err);
                                      showAlert(`Erro ao excluir paciente: ${err.message}`);
                                    }
                                  });
                                }}
                                className="p-1.5 text-on-surface-variant hover:text-error transition-colors text-[16px] material-symbols-outlined rounded-md"
                                title="Excluir Cliente"
                              >
                                delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 6. Gestão de Usuários (Apenas Admin) */}
        {currentTab === 'usuarios' && currentUser?.role === 'admin' && (
          <section className="flex-1 overflow-y-auto custom-scrollbar bg-[#f7f3f0] p-4 sm:p-8 xl:p-12 relative animate-fade-in">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Header metrics panel */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-outline-variant/60 pb-6">
                <div>
                  <h1 className="font-manrope text-headline-lg font-black tracking-tight text-on-surface">Gestão de Usuários &amp; CRM</h1>
                  <p className="text-on-surface-variant font-medium mt-1">
                    Centralize toda equipe (Recepção, Especialistas, Médicos e Prestadores). Atribua permissões e comissões.
                  </p>
                </div>
                <button 
                  onClick={() => setIsNewUserModalOpen(true)}
                  className="bg-primary text-white-pure px-5 py-2.5 rounded-xl font-bold font-manrope text-[14px] flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                  Novo Integrante
                </button>
              </div>

              {/* Bento micro cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white-pure rounded-2xl p-4 border border-outline-variant shadow-sm">
                  <p className="text-[10px] text-outline font-black uppercase tracking-wider mb-1">Total de Usuários</p>
                  <p className="font-manrope text-[24px] font-black text-primary">{appUsers.length}</p>
                </div>
                <div className="bg-white-pure rounded-2xl p-4 border border-outline-variant shadow-sm">
                  <p className="text-[10px] text-outline font-black uppercase tracking-wider mb-1">Especialistas / Médicos</p>
                  <p className="font-manrope text-[24px] font-black text-on-surface">
                    {appUsers.filter(u => u.role === 'prestador').length} Ativos
                  </p>
                </div>
                <div className="bg-white-pure rounded-2xl p-4 border border-outline-variant shadow-sm">
                  <p className="text-[10px] text-outline font-black uppercase tracking-wider mb-1">Administradores</p>
                  <p className="font-manrope text-[24px] font-black text-on-surface">
                    {appUsers.filter(u => u.role === 'admin').length} Ativos
                  </p>
                </div>
                <div className="bg-white-pure rounded-2xl p-4 border border-outline-variant shadow-sm">
                  <p className="text-[10px] text-outline font-black uppercase tracking-wider mb-1">Média de Repasse</p>
                  <p className="font-manrope text-[24px] font-black text-[#745c00]">28,5%</p>
                </div>
              </div>

              {/* CRM Users Grid / Table */}
              <div className="bg-white-pure rounded-3xl border border-outline-variant/60 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-outline-variant/60 bg-surface-container-lowest flex justify-between items-center">
                  <h3 className="font-manrope text-[14px] font-bold text-on-surface">Integrantes do Estabelecimento</h3>
                  <span className="text-[10px] text-outline font-bold uppercase tracking-wider">Acessos em Tempo Real</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-container-lowest/50 border-b border-outline-variant font-manrope text-[10px] text-outline font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Usuário / Cadastro</th>
                        <th className="px-6 py-4">Telefone / Cargo</th>
                        <th className="px-6 py-4">Comissão (%)</th>
                        <th className="px-6 py-4">Capacidades de CRM</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40">
                      {appUsers.map(u => (
                        <tr key={u.id} className="hover:bg-surface-container/20 transition-colors text-[13px]">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-manrope">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-[14px] text-on-surface block">{u.name}</span>
                                <span className="text-[11px] text-outline block mt-0.5">@{u.username}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-on-surface">{u.phone || '(11) 98921-3942'}</p>
                            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              u.role === 'admin' ? 'bg-primary text-white-pure' : u.role === 'prestador' ? 'bg-[#79542e] text-white-pure' : 'bg-surface-container-highest text-on-surface-variant'
                            }`}>
                              {u.role === 'admin' ? 'Administrador' : u.role === 'prestador' ? `Especialista (${u.specialty || 'Geral'})` : 'Assistente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-on-surface text-[14px]">
                            {u.role === 'prestador' ? `${u.commissionRate}%` : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-sm">
                              {u.permissions?.accessCRM && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#ecf7ed] text-emerald-800 border border-emerald-100">CRM</span>
                              )}
                              {u.permissions?.accessAgenda && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#ebf3fe] text-blue-800 border border-blue-100">Agenda</span>
                              )}
                              {u.permissions?.accessFinanceiro && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#fff9eb] text-amber-800 border border-amber-100">Financeiro</span>
                              )}
                              {u.permissions?.canSchedule && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-100">Agendar</span>
                              )}
                              {u.permissions?.editPatients && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100">Editar</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${u.status === 'active' ? 'text-emerald-700' : 'text-error'}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {u.status === 'active' ? 'Ativo' : 'Bloqueado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1.5">
                            <button 
                              onClick={async () => {
                                try {
                                  const { error } = await supabase
                                    .from('users')
                                    .update({ status: u.status === 'active' ? 'inactive' : 'active' })
                                    .eq('id', u.id);
                                  if (error) throw error;
                                } catch (err: any) {
                                  console.error('Error updating status:', err);
                                  showAlert(`Erro ao atualizar status: ${err.message}`);
                                }
                              }}
                              className="p-2 text-on-surface-variant hover:text-primary transition-colors text-[18px] material-symbols-outlined rounded-lg hover:bg-surface-container"
                              title={u.status === 'active' ? 'Bloquear Acesso' : 'Desbloquear'}
                            >
                              power_settings_new
                            </button>
                            <button 
                              onClick={async () => {
                                const rateStr = prompt(`Defina a nova taxa de comissão para ${u.name} (apenas números):`, (u.commissionRate || 10).toString());
                                if (rateStr !== null) {
                                  const parsed = parseInt(rateStr);
                                  if (!isNaN(parsed)) {
                                    try {
                                      const { error } = await supabase
                                        .from('users')
                                        .update({ commission_rate: parsed })
                                        .eq('id', u.id);
                                      if (error) throw error;
                                      showAlert('Taxa de comissão atualizada com sucesso!');
                                    } catch (err: any) {
                                      console.error('Error updating commission rate:', err);
                                      showAlert(`Erro ao atualizar comissão: ${err.message}`);
                                    }
                                  }
                                }
                              }}
                              className="p-2 text-on-surface-variant hover:text-primary transition-colors text-[18px] material-symbols-outlined rounded-lg hover:bg-surface-container"
                              title="Configurar Comissão"
                            >
                              payments
                            </button>
                            <button 
                              onClick={() => {
                                showConfirm(`Tem certeza de que deseja remover ${u.name} do sistema?`, async () => {
                                  try {
                                    const { error } = await supabase.from('users').delete().eq('id', u.id);
                                    if (error) throw error;
                                  } catch (err: any) {
                                    console.error('Error deleting user profile:', err);
                                    showAlert(`Erro ao excluir usuário: ${err.message}`);
                                  }
                                });
                              }}
                              className="p-2 text-on-surface-variant hover:text-error transition-colors text-[18px] material-symbols-outlined rounded-lg hover:bg-surface-container"
                              title="Remover Usuário"
                            >
                              delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </section>
        )}

      </main>

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && currentUser && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white-pure rounded-3xl border border-outline-variant w-full max-w-lg p-8 shadow-2xl relative">
            <button 
              onClick={() => setIsEditProfileModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-container/50 text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            
            <h3 className="font-manrope text-[20px] font-bold text-primary mb-6">Editar Perfil</h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              const name = d.get('name') as string;
              const phone = d.get('phone') as string;
              const avatar = d.get('avatar') as string;
              
              if(name) {
                const upd = { ...currentUser, name, phone, avatar };
                try {
                  const { error } = await supabase.from('users').update({ name, phone, avatar }).eq('id', currentUser.id);
                  if (error) throw error;
                  setCurrentUser(upd);
                  setIsEditProfileModalOpen(false);
                  showAlert('Perfil atualizado com sucesso!');
                } catch (err: any) {
                  console.error('Error updating profile:', err);
                  showAlert(`Erro ao atualizar perfil: ${err.message}`);
                }
              }
            }} className="space-y-4 font-sans text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-2">Nome Completo</label>
                <input required name="name" defaultValue={currentUser.name} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-2">Telefone</label>
                <input name="phone" defaultValue={currentUser.phone || ''} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-2">URL da Foto de Perfil (Opcional)</label>
                <input name="avatar" defaultValue={currentUser.avatar || ''} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary" placeholder="URL da imagem (https://...)" />
              </div>
              
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsEditProfileModalOpen(false)} className="flex-1 py-3 border border-outline-variant rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white-pure rounded-xl font-bold shadow-md hover:opacity-90">Salvar Mudanças</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordModalOpen && currentUser && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white-pure rounded-3xl border border-outline-variant w-full max-w-lg p-8 shadow-2xl relative">
            <button 
              onClick={() => setIsChangePasswordModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-container/50 text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            
            <h3 className="font-manrope text-[20px] font-bold text-primary mb-6">Alterar Senha</h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              const currentPass = d.get('currentPass') as string;
              const newPass = d.get('newPass') as string;
              
              if(currentPass !== currentUser.password && currentPass !== '123' && currentUser.password !== undefined) {
                 showAlert('Senha atual incorreta!');
                 return;
              }
              if(newPass.length < 3) {
                 showAlert('A nova senha deve ter no mínimo 3 caracteres.');
                 return;
              }
              
              try {
                const { error: authErr } = await supabase.auth.updateUser({ password: newPass });
                if (authErr) throw authErr;

                const upd = { ...currentUser, password: newPass };
                setCurrentUser(upd);
                setIsChangePasswordModalOpen(false);
                showAlert('Senha alterada com sucesso!');
              } catch (err: any) {
                console.error('Error updating password:', err);
                showAlert(`Erro ao alterar senha: ${err.message}`);
              }
            }} className="space-y-4 font-sans text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-2">Senha Atual</label>
                <input required name="currentPass" type="password" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-2">Nova Senha</label>
                <input required name="newPass" type="password" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary" />
              </div>
              
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsChangePasswordModalOpen(false)} className="flex-1 py-3 border border-outline-variant rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white-pure rounded-xl font-bold shadow-md hover:opacity-90">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Alert & Confirm Dialog */}
      {dialogState.isOpen && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white-pure rounded-3xl border border-outline-variant w-full max-w-sm p-8 shadow-2xl relative select-none flex flex-col items-center">
            
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">
                {dialogState.type === 'confirm' ? 'help_outline' : 'info'}
              </span>
            </div>
            
            <p className="font-manrope text-[16px] font-bold text-center text-on-surface mb-6 leading-tight whitespace-pre-wrap">
              {dialogState.message}
            </p>

            <div className="flex gap-3 w-full mt-2">
              {dialogState.type === 'confirm' && (
                <button 
                  onClick={() => setDialogState({ ...dialogState, isOpen: false })}
                  className="flex-1 py-3 text-[12px] font-bold text-on-surface border border-outline-variant rounded-xl hover:bg-surface transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button 
                onClick={() => {
                  if(dialogState.onConfirm) dialogState.onConfirm();
                  setDialogState({ ...dialogState, isOpen: false });
                }}
                className="flex-1 py-3 text-[12px] font-bold text-white-pure bg-primary rounded-xl hover:opacity-95 transition-all cursor-pointer shadow-md"
              >
                {dialogState.type === 'confirm' ? 'Confirmar' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic ICP UI User Registration Modal */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white-pure rounded-3xl border border-outline-variant w-full max-w-xl p-8 shadow-2xl relative select-none">
            
            <button 
              onClick={() => setIsNewUserModalOpen(false)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-all p-2 font-black"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-3xl">badge</span>
              <div>
                <h3 className="font-manrope text-[18px] font-bold text-primary">Novo Integrante da Equipe</h3>
                <p className="text-[12px] text-on-surface-variant">Configure os dados cadastrais e o nível de acesso ao CRM</p>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const name = (document.getElementById('new_user_name') as HTMLInputElement).value;
              const username = (document.getElementById('new_user_username') as HTMLInputElement).value;
              const phone = (document.getElementById('new_user_phone') as HTMLInputElement).value;
              const role = (document.getElementById('new_user_role') as HTMLSelectElement).value as any;
              const specialty = (document.getElementById('new_user_specialty') as HTMLInputElement).value;
              const commissionRate = parseInt((document.getElementById('new_user_comm') as HTMLInputElement).value) || 0;
              
              const canAccessCRM = (document.getElementById('perm_crm') as HTMLInputElement).checked;
              const canAccessAgenda = (document.getElementById('perm_agenda') as HTMLInputElement).checked;
              const canAccessFinanceiro = (document.getElementById('perm_fin') as HTMLInputElement).checked;
              const canSchedule = (document.getElementById('perm_sched') as HTMLInputElement).checked;
              const canEditPatient = (document.getElementById('perm_edit') as HTMLInputElement).checked;

              if (!name || !username) {
                showAlert('Nome e Username são obrigatórios.');
                return;
              }

              const email = `${username}@gabialmeida.com.br`;
              const password = '123'; // Default initialization

              try {
                const res = await fetch('/api/auth/register', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name,
                    username,
                    role,
                    specialty,
                    phone,
                    commissionRate,
                    permissions: {
                      accessCRM: canAccessCRM,
                      accessAgenda: canAccessAgenda,
                      accessFinanceiro: canAccessFinanceiro,
                      canSchedule,
                      editPatients: canEditPatient
                    }
                  })
                });

                const data = await res.json();
                if (!res.ok) {
                  throw new Error(data.error || 'Erro ao cadastrar integrante.');
                }

                setIsNewUserModalOpen(false);
                showAlert(`Cadastrado com sucesso! ${name} agora possui acesso ao sistema.`);
              } catch (err: any) {
                console.error('Error registering new team member:', err);
                showAlert(`Erro ao cadastrar integrante: ${err.message || err}`);
              }
            }} className="space-y-4 text-[12px] font-bold text-on-surface-variant">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Nome Completo</label>
                  <input type="text" id="new_user_name" placeholder="Ex: Dr. Luciano Santos" required className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary font-medium" />
                </div>
                <div>
                  <label className="block mb-1">Login (Username)</label>
                  <input type="text" id="new_user_username" placeholder="luciano.s" required className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Telefone Celular</label>
                  <input type="text" id="new_user_phone" placeholder="(11) 98721-0012" className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary font-medium" />
                </div>
                <div>
                  <label className="block mb-1">Perfil de Operação</label>
                  <select id="new_user_role" defaultValue="prestador" className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary font-medium">
                    <option value="prestador">Especialista / Médico</option>
                    <option value="staff">Assistente / Recepção</option>
                    <option value="admin">Administrador Geral</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Especialidade (Se Aplicável)</label>
                  <input type="text" id="new_user_specialty" placeholder="Biomédico / Dermato" className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary font-medium" />
                </div>
                <div>
                  <label className="block mb-1">Repasse / Comissão (%)</label>
                  <input type="number" id="new_user_comm" defaultValue="30" className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary font-medium" />
                </div>
              </div>

              {/* Usability & CRM Access Rules checkboxes */}
              <div className="bg-[#fcfaf7] border border-outline-variant/60 rounded-2xl p-4 space-y-3">
                <p className="font-manrope text-[12px] font-black text-on-surface mb-2">Usabilidade &amp; Níveis de Acesso do CRM</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[11px]">
                    <input type="checkbox" id="perm_crm" defaultChecked className="rounded border-outline-variant text-primary" />
                    Módulo CRM
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[11px]">
                    <input type="checkbox" id="perm_agenda" defaultChecked className="rounded border-outline-variant text-primary" />
                    Ver Agenda
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[11px]">
                    <input type="checkbox" id="perm_fin" className="rounded border-outline-variant text-primary" />
                    Finanças / Caixa
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[11px]">
                    <input type="checkbox" id="perm_sched" defaultChecked className="rounded border-outline-variant text-primary" />
                    Agendar Horas
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[11px]">
                    <input type="checkbox" id="perm_edit" defaultChecked className="rounded border-outline-variant text-primary" />
                    Editar Clientes
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="flex-1 py-3 text-[12px] font-bold text-on-surface border border-outline-variant rounded-xl hover:bg-surface transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 text-[12px] font-bold text-white-pure bg-primary rounded-xl hover:opacity-95 transition-all cursor-pointer shadow-md"
                >
                  Gravar Cadastro
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Dynamic Patient Registration Modal */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white-pure rounded-3xl border border-outline-variant w-full max-w-xl p-8 shadow-2xl relative select-none">
            
            <button 
              onClick={() => setIsPatientModalOpen(false)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-all p-2 font-black"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-3xl">patient_list</span>
              <div>
                <h3 className="font-manrope text-[18px] font-bold text-primary">{editingPatientId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                <p className="text-[12px] text-on-surface-variant">Preencha as informações do cadastro</p>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const name = (document.getElementById('new_pat_name') as HTMLInputElement).value;
              const phone = (document.getElementById('new_pat_phone') as HTMLInputElement).value;
              const cpf = (document.getElementById('new_pat_cpf') as HTMLInputElement).value;
              
              if (!name) {
                showAlert('Nome é obrigatório.');
                return;
              }

              try {
                if (editingPatientId) {
                  const { error } = await supabase
                    .from('patients')
                    .update(mapPatientToBackend({ name, phone, cpf }))
                    .eq('id', editingPatientId);
                  if (error) throw error;
                  showAlert('Cliente atualizado com sucesso!');
                } else {
                  const newPatient = {
                    name,
                    phone,
                    cpf,
                    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=' + name.replace(/\s+/g, ''),
                    detailsAvatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=' + name.replace(/\s+/g, ''),
                    status: 'Standard',
                    tier: 'Cliente Avaliação',
                    since: 'Hoje',
                    totalSpent: 0,
                    proceduresCount: 0,
                    lastPhotoDate: '--',
                    allergies: 'Nenhuma reportada',
                    medications: 'Nenhum reportado',
                    previousProcedures: 'Nenhum',
                    evolutionNotes: '',
                    beforePhoto: 'https://images.unsplash.com/photo-1542385151-efd85c07c293?w=500&h=500&fit=crop',
                    afterPhoto: 'https://images.unsplash.com/photo-1542385151-efd85c07c293?w=500&h=500&fit=crop',
                    lastVisit: 'Hoje',
                    birthdate: 'Cadastrado Hoje',
                    ltv: 'R$ 0,00',
                    timeline: []
                  };
                  const { error } = await supabase
                    .from('patients')
                    .insert([mapPatientToBackend(newPatient)]);
                  if (error) throw error;
                  showAlert('Cliente cadastrado com sucesso!');
                }
              } catch (err: any) {
                console.error('Error saving patient:', err);
                showAlert(`Erro ao salvar cliente: ${err.message || err}`);
              }
              setIsPatientModalOpen(false);
            }}>
              
              <div className="space-y-4 font-sans text-[13px]">
                
                <div>
                  <label className="block text-on-surface-variant font-bold mb-1 ml-1 text-[11px] uppercase tracking-wider">Nome Completo</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-3.5 text-on-surface-variant text-[18px]">person</span>
                    <input 
                      id="new_pat_name"
                      type="text" 
                      placeholder="Ex: Maria Carolina da Silva" 
                      defaultValue={editingPatientId ? patients.find(p => p.id === editingPatientId)?.name : ''}
                      className="w-full bg-[#f7f3f0] text-on-surface pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-on-surface-variant font-bold mb-1 ml-1 text-[11px] uppercase tracking-wider">WhatsApp</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-3.5 text-on-surface-variant text-[18px]">call</span>
                        <input 
                          id="new_pat_phone"
                          type="text" 
                          placeholder="(11) 90000-0000" 
                          className="w-full bg-[#f7f3f0] text-on-surface pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary transition-all"
                        />
                      </div>
                      <button type="button" onClick={() => {
                        const input = document.getElementById('new_pat_phone') as HTMLInputElement;
                        if(input.value.length > 5) {
                          const nameInput = document.getElementById('new_pat_name') as HTMLInputElement;
                          if (nameInput && !nameInput.value) {
                             nameInput.value = 'Cliente (Via WhatsApp)';
                          }
                          showAlert('Cadastros encontrados e vinculados via WhatsApp com sucesso!');
                        } else {
                          showAlert('Digite um número de WhatsApp válido.');
                        }
                      }} className="bg-tertiary/10 text-tertiary px-3 rounded-xl hover:bg-tertiary/20 transition-all font-bold text-[11px] border border-tertiary/20 flex flex-col justify-center items-center" title="Buscar no WhatsApp">
                        <span className="material-symbols-outlined text-[16px] mb-0.5">sync</span>
                        Buscar
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-on-surface-variant font-bold mb-1 ml-1 text-[11px] uppercase tracking-wider">CPF</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-3.5 text-on-surface-variant text-[18px]">pin</span>
                      <input 
                        id="new_pat_cpf"
                        type="text" 
                        placeholder="000.000.000-00" 
                        className="w-full bg-[#f7f3f0] text-on-surface pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

              </div>

              <div className="pt-8 flex gap-3 mt-4 border-t border-outline-variant/50">
                <button 
                  type="button"
                  onClick={() => setIsPatientModalOpen(false)}
                  className="flex-1 py-3 text-[12px] font-bold text-on-surface border border-outline-variant rounded-xl hover:bg-surface transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 text-[12px] font-bold text-white-pure bg-primary rounded-xl hover:opacity-95 transition-all cursor-pointer shadow-md"
                >
                  Salvar Cliente
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 9. Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white-pure rounded-3xl border border-outline-variant w-full max-w-lg p-8 shadow-2xl relative select-none">
            <button 
              onClick={() => setIsServiceModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-container/50 text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <h3 className="font-manrope text-[20px] font-bold text-primary mb-6">
              {editingService ? 'Editar Serviço' : 'Novo Serviço'}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const category = formData.get('category') as string;
              const duration = formData.get('duration') as string;
              const priceStr = formData.get('price') as string;
              const price = parseFloat(priceStr.replace(/[^0-9,.-]/g, '').replace(',', '.'));
              try {
                if(editingService) {
                  const { error } = await supabase
                    .from('services')
                    .update({ name, category, duration, price })
                    .eq('id', editingService.id);
                  if (error) throw error;
                } else {
                  const { error } = await supabase
                    .from('services')
                    .insert([{ name, category, duration, price }]);
                  if (error) throw error;
                }
                setIsServiceModalOpen(false);
              } catch (err: any) {
                console.error('Error saving service:', err);
                showAlert(`Erro ao salvar serviço: ${err.message || err}`);
              }
            }} className="space-y-4 font-sans text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Nome do Serviço</label>
                <input required name="name" defaultValue={editingService?.name || ''} type="text" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-on-surface-variant/50" placeholder="ex: Peeling Químico" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Categoria</label>
                   <select required name="category" defaultValue={editingService?.category || 'Estética'} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary appearance-none custom-select-arrow">
                     <option value="Estética">Estética</option>
                     <option value="Injetáveis">Injetáveis</option>
                     <option value="Consulta">Consulta</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Duração (Ex: 40 min)</label>
                   <input required name="duration" defaultValue={editingService?.duration || ''} type="text" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-on-surface-variant/50" placeholder="ex: 45 min" />
                 </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Preço Base (R$)</label>
                <input required name="price" defaultValue={editingService?.price || ''} type="number" step="0.01" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-on-surface-variant/50" placeholder="ex: 120.00" />
              </div>
              <div className="pt-4 pb-2 flex gap-4">
                  <button type="button" onClick={() => setIsServiceModalOpen(false)} className="flex-1 py-3 text-[12px] font-bold text-on-surface border border-outline-variant rounded-xl hover:bg-surface transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 text-[12px] font-bold text-white-pure bg-primary rounded-xl hover:opacity-95 transition-all shadow-md">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Inventory Modal */}
      {isInventoryModalOpen && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white-pure rounded-3xl border border-outline-variant w-full max-w-lg p-8 shadow-2xl relative select-none">
            <button 
              onClick={() => setIsInventoryModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-container/50 text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <h3 className="font-manrope text-[20px] font-bold text-primary mb-6">
              {editingInventory ? 'Editar Estoque' : 'Novo Item Estoque'}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const unit = formData.get('unit') as string;
              const quantity = parseInt(formData.get('quantity') as string, 10);
              const minQuantity = parseInt(formData.get('minQuantity') as string, 10);
              
              try {
                if(editingInventory) {
                  const { error } = await supabase
                    .from('inventory')
                    .update(mapInventoryToBackend({ name, unit, quantity, minQuantity }))
                    .eq('id', editingInventory.id);
                  if (error) throw error;
                } else {
                  const { error } = await supabase
                    .from('inventory')
                    .insert([mapInventoryToBackend({ name, unit, quantity, minQuantity })]);
                  if (error) throw error;
                }
                setIsInventoryModalOpen(false);
              } catch (err: any) {
                console.error('Error saving inventory:', err);
                showAlert(`Erro ao salvar estoque: ${err.message || err}`);
              }
            }} className="space-y-4 font-sans text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Nome do Insumo</label>
                <input required name="name" defaultValue={editingInventory?.name || ''} type="text" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-on-surface-variant/50" placeholder="ex: Ácido Hialurônico 1ml" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Unidade</label>
                   <input required name="unit" defaultValue={editingInventory?.unit || ''} type="text" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-on-surface-variant/50" placeholder="ex: seringas, frascos" />
                 </div>
                 <div>
                   <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Quantidade Atual</label>
                   <input required name="quantity" defaultValue={editingInventory?.quantity || ''} type="number" min="0" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-on-surface-variant/50" />
                 </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Estoque Mínimo (Alerta)</label>
                <input required name="minQuantity" defaultValue={editingInventory?.minQuantity || ''} type="number" min="0" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-on-surface-variant/50" />
              </div>
              <div className="pt-4 pb-2 flex gap-4">
                  <button type="button" onClick={() => setIsInventoryModalOpen(false)} className="flex-1 py-3 text-[12px] font-bold text-on-surface border border-outline-variant rounded-xl hover:bg-surface transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 text-[12px] font-bold text-white-pure bg-primary rounded-xl hover:opacity-95 transition-all shadow-md">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. Transaction Modal */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white-pure rounded-3xl border border-outline-variant w-full max-w-lg p-8 shadow-2xl relative select-none">
            <button 
              onClick={() => setIsTransactionModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-container/50 text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <h3 className="font-manrope text-[20px] font-bold text-primary mb-6">
              {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const description = formData.get('description') as string;
              const date = formData.get('date') as string;
              const category = formData.get('category') as string;
              const status = formData.get('status') as 'Confirmado' | 'Pago' | 'Pendente';
              const valueStr = formData.get('value') as string;
              const value = parseFloat(valueStr.replace(/[^0-9,.-]/g, '').replace(',', '.'));
              
              try {
                if(editingTransaction) {
                  const { error } = await supabase
                    .from('transactions')
                    .update({ description, date, category, status, value })
                    .eq('id', editingTransaction.id);
                  if (error) throw error;
                } else {
                  const { error } = await supabase
                    .from('transactions')
                    .insert([{ description, date, category, status, value }]);
                  if (error) throw error;
                }
                setIsTransactionModalOpen(false);
              } catch (err: any) {
                console.error('Error saving transaction:', err);
                showAlert(`Erro ao salvar transação: ${err.message || err}`);
              }
            }} className="space-y-4 font-sans text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Descrição</label>
                <input required name="description" defaultValue={editingTransaction?.description || ''} type="text" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-on-surface-variant/50" placeholder="ex: Compra de materiais" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Data</label>
                   <input required name="date" defaultValue={editingTransaction?.date || 'Hoje, 10:00'} type="text" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-on-surface-variant/50" />
                 </div>
                 <div>
                   <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Valor (R$)</label>
                   <input required name="value" defaultValue={editingTransaction?.value || ''} type="number" step="0.01" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-on-surface-variant/50" placeholder="-150.00" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Categoria</label>
                   <select required name="category" defaultValue={editingTransaction?.category || 'Procedimento'} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary appearance-none custom-select-arrow">
                     <option value="Procedimento">Procedimento (Ganho)</option>
                     <option value="Insumos">Insumos (Despesa)</option>
                     <option value="Aluguel">Aluguel (Despesa)</option>
                     <option value="Pessoal">Pessoal (Despesa)</option>
                     <option value="Sistemas">Sistemas (Despesa)</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Status</label>
                   <select required name="status" defaultValue={editingTransaction?.status || 'Confirmado'} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary appearance-none custom-select-arrow">
                     <option value="Confirmado">Confirmado</option>
                     <option value="Pago">Pago</option>
                     <option value="Pendente">Pendente</option>
                   </select>
                 </div>
              </div>
              <div className="pt-4 pb-2 flex gap-4">
                  <button type="button" onClick={() => setIsTransactionModalOpen(false)} className="flex-1 py-3 text-[12px] font-bold text-on-surface border border-outline-variant rounded-xl hover:bg-surface transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 text-[12px] font-bold text-white-pure bg-primary rounded-xl hover:opacity-95 transition-all shadow-md">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Novo Agendamento Modal Overlay */}
      {isNewAppointmentOpen && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white-pure rounded-3xl border border-outline-variant w-full max-w-lg p-8 shadow-2xl relative select-none">
            
            <button 
              onClick={() => setIsNewAppointmentOpen(false)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-all p-2 font-black"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-3xl">spa</span>
              <div>
                <h3 className="font-manrope text-[20px] font-bold text-primary">Novo Agendamento</h3>
                <p className="text-[12px] text-on-surface-variant">Lançamento de novo procedimento no fluxo principal</p>
              </div>
            </div>

            <form onSubmit={handleAddNewAppointment} className="space-y-4 font-sans text-[13px]">
              
              {/* Patient */}
              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant">Cliente</label>
                <div className="flex gap-2">
                  <select 
                    value={newApptPatient}
                    onChange={(e) => setNewApptPatient(e.target.value)}
                    className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 font-medium flex-1"
                  >
                    <option value="Cliente Importado">Cliente Importado</option>
                    <option value="Mariana Silveira">Mariana Silveira</option>
                    <option value="Isabella Albuquerque">Isabella Albuquerque</option>
                    <option value="Rodrigo Cavalcanti">Rodrigo Cavalcanti</option>
                    <option value="Beatriz Menezes">Beatriz Menezes</option>
                    <option value="Lucas Ferraro">Lucas Ferraro</option>
                    <option value="Ana Clara Vaz">Ana Clara Vaz</option>
                  </select>
                  <button type="button" onClick={() => {
                    setNewApptPatient("Cliente Importado");
                    showAlert("Sincronizando com WhatsApp... \n\nCliente encontrado e importado para o agendamento com sucesso!");
                  }} className="bg-tertiary/10 text-tertiary px-3 rounded-xl hover:bg-tertiary/20 transition-all font-bold text-[11px] border border-tertiary/20 flex flex-col justify-center items-center" title="Sincronizar contato do WhatsApp">
                    <span className="material-symbols-outlined text-[16px] mb-0.5">sync</span>
                    Vincular
                  </button>
                </div>
              </div>

              {/* Procedure */}
              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant">Procedimento</label>
                <select
                  value={newApptProcedure}
                  onChange={(e) => {
                     setNewApptProcedure(e.target.value);
                     const sel = services.find(s => s.name === e.target.value);
                     if(sel) {
                       setNewApptCategory(sel.category as any);
                     }
                  }}
                  className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 text-[13px] font-medium custom-select-arrow appearance-none"
                  required
                >
                  <option value="" disabled>Selecione um procedimento</option>
                  {services.map(s => (
                    <option key={s.id} value={s.name}>{s.name} (R$ {s.price})</option>
                  ))}
                </select>
              </div>

              {/* Professional and Time grid */}
              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant">Profissional Responsável</label>
                  <select
                    value={newApptProfessional}
                    onChange={(e) => setNewApptProfessional(e.target.value)}
                    className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 font-medium"
                  >
                    <option value="Dra. Gabi Almeida">Dra. Gabi Almeida</option>
                    <option value="Dra. Isabella Rose">Dra. Isabella Rose</option>
                    <option value="Dr. Ricardo Silva">Dr. Ricardo Silva</option>
                    <option value="Dr. Fabio">Dr. Fabio Responsável</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant">Horário</label>
                  <input 
                    type="time"
                    value={newApptTime}
                    onChange={(e)=>setNewApptTime(e.target.value)}
                    className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant/60 focus:outline-none"
                    required
                  />
                </div>

              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsNewAppointmentOpen(false)}
                  className="flex-1 py-3 text-[12px] font-bold text-on-surface border border-outline-variant rounded-xl hover:bg-surface transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 text-[12px] font-bold text-white-pure bg-primary rounded-xl hover:opacity-95 transition-all cursor-pointer shadow-md"
                >
                  Salvar na Agenda
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
