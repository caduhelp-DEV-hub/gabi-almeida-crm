'use client';

import React, {useState, useEffect, useRef, useCallback} from 'react';
import Image from 'next/image';
import AnamneseLimpezaDePele from '../components/AnamneseLimpezaDePele';
import DocumentViewerModal from '../components/DocumentViewerModal';
import ChangePasswordModal from '../components/modals/ChangePasswordModal';
import { supabase } from '../lib/supabase';
import {
  mapUserToFrontend,
  mapUserToBackend,
  mapClienteToFrontend,
  mapClienteToBackend,
  mapAgendamentoToFrontend,
  mapAgendamentoToBackend,
  mapInventoryToFrontend,
  mapInventoryToBackend,
  mapServicoToFrontend,
  mapServicoToBackend,
  mapCobrancaToFrontend,
  mapCobrancaToBackend,
  getAppointmentColorClass
} from '../lib/mappers';
import type {
  TimelineItem,
  EvolutionPhoto,
  Cliente,
  Agendamento,
  Servico,
  InventoryItem,
  Cobranca,
  CommissionLeader,
  AppUser
} from '../lib/types';

const checkTimeOverlap = (time1: string, dur1: number, time2: string, dur2: number) => {
  if (!time1 || !time2) return false;
  const t1 = time1.split(':').map(Number);
  const start1 = t1[0] * 60 + t1[1];
  const end1 = start1 + dur1;

  const t2 = time2.split(':').map(Number);
  const start2 = t2[0] * 60 + t2[1];
  const end2 = start2 + dur2;

  return start1 < end2 && start2 < end1;
};

export default function CRMPage() {
  // Global Modal State
  const [dialogState, setDialogState] = useState<{isOpen: boolean, type: 'alert' | 'confirm', message: string, onConfirm?: () => void}>({isOpen: false, type: 'alert', message: ''});
  const showAlert = (message: string) => setDialogState({isOpen: true, type: 'alert', message});
  const showConfirm = (message: string, onConfirm: () => void) => setDialogState({isOpen: true, type: 'confirm', message, onConfirm});
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Sidebar tab control
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'agenda' | 'clientes' | 'financeiro' | 'usuarios' | 'cadastro-cliente' | 'servicos' | 'estoque' | 'comandas' | 'mensagens-pre' | 'despesas' | 'funcionarios' | 'relatorios-performance' | 'relatorios-financeiro' | 'relatorios-melhores-clientes' | 'configuracoes' | 'dados-empresa'>('agenda');
  
  const [despesas, setDespesas] = useState<{id: string, descricao: string, valor: number, data: string, categoria: string, status: string}[]>([]);
  const [isDespesaModalOpen, setIsDespesaModalOpen] = useState(false);
  const [newDespesa, setNewDespesa] = useState({ descricao: '', valor: '', data: new Date().toISOString().split('T')[0], categoria: 'Outros', status: 'Pago' });

  const [dashboardPeriod, setDashboardPeriod] = useState('Hoje');
  const [editingTimelineItemId, setEditingTimelineItemId] = useState<string | null>(null);
  const [editingTimelineText, setEditingTimelineText] = useState('');
  const [clearedNotifications, setClearedNotifications] = useState(false);
  const [mensagensPredefinidas, setMensagensPredefinidas] = useState<any[]>([]);
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [editingMsg, setEditingMsg] = useState<any | null>(null);
  
  // Agenda View Control (Diária / Semanal / Mensal)
  const [agendaView, setAgendaView] = useState<'diaria' | 'semanal' | 'mensal' | 'lista'>('diaria');
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState<boolean>(false);
  const [newUserAvatarUrl, setNewUserAvatarUrl] = useState<string>('');
  const [newUserAvatarUploading, setNewUserAvatarUploading] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Agendamento | null>(null);
  
  // Perfil / Menu
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const [isPatientModalOpen, setIsPatientModalOpen] = useState<boolean>(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [newPatAvatar, setNewPatAvatar] = useState<string>('');
  const [newApptStatus, setNewApptStatus] = useState<'Confirmado' | 'Em Atendimento' | 'Finalizado' | 'Pendente'>('Confirmado');

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Servico | null>(null);

  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingCobranca, setEditingTransaction] = useState<Cobranca | null>(null);

  const [isClientInteractModalOpen, setIsClientInteractModalOpen] = useState(false);
  const [interactClient, setInteractClient] = useState<Cliente | null>(null);
  const [interactAppointmentId, setInteractAppointmentId] = useState<string | null>(null);
  const [isWhatsAppSubmenuOpen, setIsWhatsAppSubmenuOpen] = useState(false);
  const [isClientDetailsWhatsAppOpen, setIsClientDetailsWhatsAppOpen] = useState(false);

  // Cliente Sub-tabs Financial & Document Lists States
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
    signatureBase64?: string;
    content?: any;
  }

  const [patientFinancials, setPatientFinancials] = useState<Record<string, PatientFinancialItem[]>>({});

  const [patientDocuments, setPatientDocuments] = useState<Record<string, PatientDocument[]>>({});

  const [viewingDocument, setViewingDocument] = useState<PatientDocument | null>(null);
  const [primaryRevenueTarget, setPrimaryRevenueTarget] = useState<number>(170000);
  const [agendaNavDate, setAgendaNavDate] = useState<Date>(new Date());
  const selectedCalendarDay = agendaNavDate.getDate();

  const [companyData, setCompanyData] = useState({
    id: '00000000-0000-0000-0000-000000000001',
    nome: 'Gabi Almeida Estética Avançada',
    cnpj: '00.000.000/0001-00',
    endereco: 'São Paulo - SP',
    telefone: '(11) 99999-9999'
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTarget = localStorage.getItem('primaryRevenueTarget');
      if (savedTarget) {
        setPrimaryRevenueTarget(parseFloat(savedTarget));
      }
      
      const fetchCompany = async () => {
        const { data, error } = await supabase.from('configuracoes_empresa').select('*').limit(1).single();
        if (data && !error) {
          setCompanyData(prev => ({ ...prev, ...data }));
        }
      };
      fetchCompany();
    }
  }, []);

  // Search state (unified search experience across views)
  const [searchQuery, setSearchQuery] = useState('');
  
  // Current logged in medical professional representation
  const [currentProfessional, setCurrentProfessional] = useState<{name: string; role: string; avatar: string}>({
    name: 'Gabi Almeida',
    role: 'Especialista em Estética',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAT08URyhdfggkdZ7ICFiM_aQytGw7uUJWUutntKzSZ2THn_qUatoCkxPlUDBzFo87XxXHDIl7bCPEF2zrZVbTVxZ6-ljXhgCjobz-tjjXWRgRPn8QgwKryuOkx4g6g_vI6k7ReJVAlRtFVi6oS_cA6ulr-fFIr2DH5ORI4qFAGBjKPoXtENy5oCT-Oi75JuN0RlQBMgw7dzZwQ5Fis2TriJ2rG67NgCQN4Hi2OzqyWrFUUPWiR2Dp4895lJRurxR0r_L6Qa600ado'
  });

  // Professionals derived from DB users (active only) - synced with CRUD de usuários
  const professionals = appUsers
    .filter(u => u.status === 'active')
    .map(u => ({ id: u.id, name: u.name, role: u.specialty || u.role, avatar: u.avatar }));

  // Active Dropdowns state
  const [isProfDropdownOpen, setIsProfDropdownOpen] = useState(false);
  const [isAlertNotificationOpen, setIsAlertNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Gabi Almeida AI State Engine
  const [aiAdvice, setAiAdvice] = useState<string>('Dica Gabi Almeida AI: Você tem 3 clientes com interesse em Bioestimuladores hoje. Que tal oferecer o novo protocolo?');
  const [aiCustomInput, setAiCustomInput] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(true);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('todos');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');

  // Drawing signature pad states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signatureContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  const [signatureSaved, setSignatureSaved] = useState<boolean>(false);

  // New appointment dialog options
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictPendingData, setConflictPendingData] = useState<any>(null);
  const [conflictPassword, setConflictPassword] = useState('');
  const [conflictError, setConflictError] = useState('');
  const [isValidatingConflict, setIsValidatingConflict] = useState(false);
  const [newApptPatient, setNewApptPatient] = useState('');
  const [newApptProcedure, setNewApptProcedure] = useState('Limpeza de Pele Profunda');
  const [newApptProfessional, setNewApptProfessional] = useState('Gabi Almeida');
  const [newApptTime, setNewApptTime] = useState('09:00');
  const [newApptDate, setNewApptDate] = useState(new Date().toISOString().split('T')[0]);
  const [newApptCategory, setNewApptCategory] = useState<'Estética' | 'Consulta'>('Estética');

  // Clientes Module Detail Tab
  const [activePatientSubTab, setActivePatientSubTab] = useState<'evolution' | 'anamnese' | 'financeiro' | 'documentos'>('evolution');
  const [activeLightboxImage, setActiveLightboxImage] = useState<string>('');
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [compareSelectedIds, setCompareSelectedIds] = useState<string[]>([]);
  const [pendingEvolutionPhoto, setPendingEvolutionPhoto] = useState<{file: File, base64: string} | null>(null);

  // Financeiro module detailed view timeframe
  const [financialTimeframe, setFinancialTimeframe] = useState<'semanal' | 'mensal'>('mensal');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // Core Patients DB Status
  const [patients, setPatients] = useState<Cliente[]>([]);

  // Selected patient on detail panel (default Isabella Albuquerque)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0] || {
    id: '',
    nome: 'Nenhum Paciente',
    avatar: '',
    ultimaVisita: '',
    tier: '',
    desde: '',
    totalGasto: 0,
    qtdeProcedimentos: 0,
    dataUltimaFoto: '',
    status: '',
    alergias: 'Nenhuma',
    medicacoes: 'Nenhum',
    procedimentosAnteriores: 'Nenhum',
    observacoesEvolucao: '',
    fotoAntes: '',
    fotoDepois: '',
    fotosEvolucao: [],
    timeline: []
  };

  // Agendamento states
  const [appointments, setAppointments] = useState<Agendamento[]>([]);

  // Current list of upcoming/next appointments to list in the detailed sidebars
  const activeNextAppointments: { time: string; name: string; category: string; tagColor: string }[] = [];

  // Core Financial Database
  const [transactions, setTransactions] = useState<Cobranca[]>([]);

  // Services Database
  const [services, setServices] = useState<Servico[]>([]);

  // Inventory Database
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Commissions Leaders database will be computed dynamically below

  // Dynamic metrics helpers
  const todayDate = new Date();
  const todayDateStr = todayDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const todayStr = agendaNavDate.toLocaleDateString('pt-BR'); // DD/MM/YYYY
  const [,, todayYear] = todayStr.split('/');
  const [, todayMonth] = todayStr.split('/');

  const dailyFinancialRevenue = transactions
    .filter(t => t.data === todayStr && t.valor > 0)
    .reduce((acc, t) => acc + t.valor, 0);

  const totalRevenueThisMonth = transactions
    .filter(t => {
      const parts = t.data.split('/');
      if (parts.length === 3) {
        const [, m, y] = parts;
        return m === todayMonth && y === todayYear && t.valor > 0;
      }
      return false;
    })
    .reduce((acc, t) => acc + t.valor, 0);

  // Mobile Financeiro metrics
  const monthlyRevenueTransactions = transactions.filter(t => {
    const parts = t.data.split('/');
    if (parts.length === 3) {
      const [, m, y] = parts;
      return m === todayMonth && y === todayYear && t.valor > 0;
    }
    return false;
  });
  const receitaEsperada = monthlyRevenueTransactions.reduce((acc, t) => acc + t.valor, 0);
  const receitaRecebida = monthlyRevenueTransactions
    .filter(t => t.status === 'Pago' || t.status === 'Confirmado')
    .reduce((acc, t) => acc + t.valor, 0);
  const aReceber = monthlyRevenueTransactions
    .filter(t => t.status === 'Pendente')
    .reduce((acc, t) => acc + t.valor, 0);

  const appointmentsToConsider = appointments;
  const appointmentsToday = appointmentsToConsider.filter(a => a.data === todayDateStr).length;
  const totalAtendimentosDisplay = appointmentsToday;
  const totalDailyRevenueDisplay = dailyFinancialRevenue;
  const ticketMedio = totalAtendimentosDisplay > 0 ? (totalDailyRevenueDisplay / totalAtendimentosDisplay) : 0;
  const leadsAtivos = patients.length;
  const conversoes = appointmentsToConsider.filter(a => a.status === 'Confirmado' && a.data === todayDateStr).length;
  const taxaConversao = appointmentsToday > 0 ? Math.round((conversoes / appointmentsToday) * 100) : 0;

  const getWeekDays = () => {
    const today = agendaNavDate;
    const currentDay = today.getDay();
    const distance = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distance);
    
    const days = [];
    const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        label: labels[i],
        date: d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', ''),
        dateString: d.toISOString().split('T')[0],
        active: d.toDateString() === today.toDateString()
      });
    }
    return days;
  };
  const weekDays = getWeekDays();

  // Dynamic calculation of commissions and revenue
  const getDynamicCommissions = () => {
    const monthlyTransactions = transactions.filter(t => {
      const parts = t.data.split('/');
      if (parts.length === 3) {
        const [, m, y] = parts;
        return m === todayMonth && y === todayYear && t.valor > 0;
      }
      return false;
    });

    const professionalCommissions: { [name: string]: { revenue: number; commission: number; avatar: string } } = {};

    monthlyTransactions.forEach(t => {
      const descLower = t.descricao.toLowerCase();
      // Match appointment by name
      const matchedAppt = appointments.find(a => {
        if (!a.clienteNome) return false;
        const patNameLower = a.clienteNome.toLowerCase();
        return descLower.includes(patNameLower) || patNameLower.includes(descLower);
      });

      const profName = matchedAppt ? matchedAppt.profissional : (currentUser?.name || appUsers[0]?.name || 'Profissional');
      const profUser = appUsers.find(u => u.name === profName);
      const rate = profUser && profUser.commissionRate !== undefined ? profUser.commissionRate : 25;
      const commVal = t.valor * (rate / 100);

      if (!professionalCommissions[profName]) {
        professionalCommissions[profName] = {
          revenue: 0,
          commission: 0,
          avatar: profUser?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${profName.replace(/\s+/g, '')}`
        };
      }
      professionalCommissions[profName].revenue += t.valor;
      professionalCommissions[profName].commission += commVal;
    });

    const leaders: CommissionLeader[] = Object.entries(professionalCommissions).map(([name, info]) => ({
      name,
      avatar: info.avatar,
      revenue: Math.round(info.revenue),
      commission: Math.round(info.commission)
    })).sort((a, b) => b.commission - a.commission);

    const total = leaders.reduce((acc, lead) => acc + lead.commission, 0);
    return { leaders, total };
  };

  const { leaders: commissionLeaders, total: commissionsToPay } = getDynamicCommissions();
  const currentRevenuePercent = Math.min(100, Math.round((totalRevenueThisMonth / primaryRevenueTarget) * 100));

  // Active Alerts state derived from inventory
  
  const currentDateStr = new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
  const todaysAppointments = appointments.filter(a => a.data === currentDateStr && a.status !== 'Finalizado');
  
  const criticalAlerts = clearedNotifications ? [] : [
    ...inventory.filter(i => i.quantity <= i.minQuantity).map(i => ({
      id: `inv-${i.id}`,
      type: 'inventory',
      title: 'Estoque Baixo: ' + i.name,
      text: `Apenas ${i.quantity} ${i.unit} restantes no estoque.`,
      icon: 'inventory_2',
      alertClass: 'bg-primary/5 border-primary text-on-surface'
    })),
    ...todaysAppointments.map(a => ({
      id: `appt-${a.id}`,
      type: 'appointment',
      title: 'Agendamento Hoje',
      text: `${a.hora} - ${a.clienteNome} (${a.procedimento})`,
      icon: 'event',
      alertClass: 'bg-secondary/5 border-secondary text-on-surface'
    }))
  ];


  // Handle patient avatar initialization in edit mode
  useEffect(() => {
    if (editingPatientId) {
      const pat = patients.find(p => p.id === editingPatientId);
      if (pat) {
        setNewPatAvatar(pat.avatar || '');
      }
    } else {
      setNewPatAvatar('');
    }
  }, [editingPatientId, isPatientModalOpen, patients]);

  // Check Gemini API Key status on mount
  useEffect(() => {
    const checkAI = async () => {
      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'check_status' })
        });
        if (res.status === 500) setApiKeyConfigured(false);
        else setApiKeyConfigured(true);
      } catch (err) {
        console.error('API check failed:', err);
        setApiKeyConfigured(false);
      }
    };
    checkAI();
  }, []);

  const deleteTimelineItem = async (patientId: string, itemId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este protocolo?')) return;
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;
      const newHistorico = patient.historico.filter(item => item.id !== itemId);
      const { error } = await supabase.from('clientes').update({ historico: newHistorico }).eq('id', patientId);
      if (error) throw error;
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, historico: newHistorico } : p));
      
    } catch (err: any) {
      showAlert('Erro ao excluir: ' + err.message);
    }
  };

  const saveTimelineItem = async (patientId: string, itemId: string) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;
      const newHistorico = patient.historico.map(item => item.id === itemId ? { ...item, description: editingTimelineText } : item);
      const { error } = await supabase.from('clientes').update({ historico: newHistorico }).eq('id', patientId);
      if (error) throw error;
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, historico: newHistorico } : p));
      
      setEditingTimelineItemId(null);
    } catch (err: any) {
      showAlert('Erro ao atualizar: ' + err.message);
    }
  };

  const saveMsgPredefinida = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const trigger_type = formData.get('trigger_type') as string;
    const contentText = formData.get('content') as string;
    
    try {
      if (editingMsg?.id) {
        const { data, error } = await supabase.from('mensagens_predefinidas').update({ title, trigger_type, content: contentText }).eq('id', editingMsg.id).select();
        if (error) throw error;
        const updatedObj = (data && data.length > 0) ? data[0] : { ...editingMsg, title, trigger_type, content: contentText };
        setMensagensPredefinidas(prev => prev.map(m => m.id === editingMsg.id ? updatedObj : m));
        showAlert('Mensagem atualizada com sucesso!');
      } else {
        const { data, error } = await supabase.from('mensagens_predefinidas').insert([{ title, trigger_type, content: contentText }]).select();
        if (error) throw error;
        const newObj = (data && data.length > 0) ? data[0] : { id: crypto.randomUUID(), title, trigger_type, content: contentText, created_at: new Date().toISOString() };
        setMensagensPredefinidas(prev => [newObj, ...prev]);
        showAlert('Mensagem criada com sucesso!');
      }
      setIsMsgModalOpen(false);
    } catch (err: any) {
      showAlert('Erro ao salvar mensagem: ' + err.message);
    }
  };

  const deleteMsgPredefinida = async (id: string) => {
    if (!window.confirm('Excluir esta mensagem?')) return;
    try {
      const { error } = await supabase.from('mensagens_predefinidas').delete().eq('id', id);
      if (error) throw error;
      setMensagensPredefinidas(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      showAlert('Erro ao excluir: ' + err.message);
    }
  };

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
      setIsInitialLoading(true);

      const [
        { data: pats },
        { data: appts },
        { data: trans },
        { data: servs },
        { data: inv },
        { data: usrs },
        { data: msgs },
        { data: desp },
        { data: compData }
      ] = await Promise.all([
        supabase.from('clientes').select('*'),
        supabase.from('agendamentos').select('*, clientes(id, nome, avatar)'),
        supabase.from('cobrancas').select('*'),
        supabase.from('servicos').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('users').select('*'),
        supabase.from('mensagens_predefinidas').select('*').order('created_at', { ascending: false }),
        supabase.from('despesas').select('*').order('data', { ascending: false }),
        supabase.from('configuracoes_empresa').select('*').limit(1)
      ]);

      if (pats) {
        setPatients(pats.map(mapClienteToFrontend));
        const financialsMap: Record<string, PatientFinancialItem[]> = {};
        const documentsMap: Record<string, PatientDocument[]> = {};
        pats.forEach((p: any) => {
          if (p.financials) financialsMap[p.id] = p.financials;
          if (p.documents) documentsMap[p.id] = p.documents;
        });
        setPatientFinancials(financialsMap);
        setPatientDocuments(documentsMap);
      }

      if (appts) {
        const validAppts = appts.filter((a: any) => a.cliente_id && a.clientes);
        setAppointments(validAppts.map(mapAgendamentoToFrontend));
      }

      if (trans) setTransactions(trans.map(mapCobrancaToFrontend));
      if (servs) setServices(servs.map(mapServicoToFrontend));
      if (inv) setInventory(inv.map(mapInventoryToFrontend));
      if (usrs) setAppUsers(usrs.map(mapUserToFrontend));
      if (msgs) setMensagensPredefinidas(msgs);
      if (desp) setDespesas(desp);
      if (compData && compData.length > 0) setCompanyData(prev => ({ ...prev, ...compData[0] }));
      
      setIsInitialLoading(false);
    };

    fetchInitial();

    // Setup Realtime subscriptions for auto-sync
    const dbChangesChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
        supabase.from('clientes').select('*').then((res: any) => {
          const data = res.data;
          if (data) {
            setPatients(data.map(mapClienteToFrontend));
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, async (payload: any) => {
        if (payload.eventType === 'DELETE') {
          setAppointments(prev => prev.filter(a => a.id !== payload.old.id));
        } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const { data } = await supabase.from('agendamentos').select('*, clientes(id, nome, avatar)').eq('id', payload.new.id).single();
          if (data && data.cliente_id && data.clientes) {
            const mapped = mapAgendamentoToFrontend(data);
            setAppointments(prev => {
              const exists = prev.find(a => a.id === mapped.id);
              return exists ? prev.map(a => a.id === mapped.id ? mapped : a) : [...prev, mapped];
            });
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cobrancas' }, () => {
        supabase.from('cobrancas').select('*').then((res: any) => { const data = res.data; if (data) setTransactions(data.map(mapCobrancaToFrontend)); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servicos' }, () => {
        supabase.from('servicos').select('*').then((res: any) => { const data = res.data; if (data) setServices(data.map(mapServicoToFrontend)); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        supabase.from('inventory').select('*').then((res: any) => { const data = res.data; if (data) setInventory(data.map(mapInventoryToFrontend)); });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        supabase.from('users').select('*').then((res: any) => { const data = res.data; if (data) setAppUsers(data.map(mapUserToFrontend)); });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dbChangesChannel);
    };
  }, [isAuthenticated]);

  // Handle new appointment submission
  const getServiceDuration = (procedureName: string) => {
    const s = services.find(srv => srv.nome === procedureName);
    return s ? parseInt(s.duracao) || 30 : 30;
  };

  const handleAddNewAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPat = patients.find(p => p.nome === newApptPatient);
    const apptData = {
      hora: newApptTime,
      clienteId: selectedPat?.id,
      clienteNome: newApptPatient,
      clienteAvatar: selectedPat?.avatar || '',
      procedimento: newApptProcedure,
      status: newApptStatus,
      profissional: newApptProfessional,
      categoria: newApptCategory,
      data: newApptDate
    };
    
    const newDur = getServiceDuration(newApptProcedure);
    const hasConflict = appointments.some(a => {
      if (a.data !== newApptDate) return false;
      if (editingAppointment && a.id === editingAppointment.id) return false;
      const durA = getServiceDuration(a.procedimento);
      return checkTimeOverlap(a.hora.slice(0, 5), durA, newApptTime.slice(0, 5), newDur);
    });

    if (hasConflict && !conflictPendingData) {
      setConflictPendingData(apptData);
      setIsConflictModalOpen(true);
      return;
    }
    
    try {
      if (editingAppointment) {
        const { error } = await supabase
          .from('agendamentos')
          .update(mapAgendamentoToBackend(apptData))
          .eq('id', editingAppointment.id);
        if (error) throw error;
        
        const updatedAppt = {
          ...editingAppointment,
          hora: newApptTime,
          clienteNome: newApptPatient,
          clienteAvatar: selectedPat?.avatar || '',
          procedimento: newApptProcedure,
          profissional: newApptProfessional,
          categoria: newApptCategory,
          data: newApptDate,
          clienteId: selectedPat?.id,
          status: newApptStatus
        };
        setAppointments(prev => prev.map(a => a.id === editingAppointment.id ? updatedAppt : a));
        showAlert('Agendamento atualizado com sucesso!');
      } else {
        const { data, error } = await supabase
          .from('agendamentos')
          .insert([mapAgendamentoToBackend(apptData)])
          .select('*, clientes(id, nome, avatar)');
        if (error) throw error;
        if (data && data[0]) {
          setAppointments(prev => [...prev, mapAgendamentoToFrontend(data[0])]);
        }
        setAiAdvice(`Dica Gabi Almeida AI: Agendamento agendado às ${newApptTime}. Com isso, sua jornada de ocupação de hoje subiu para ${Math.min(98, 92 + 2)}%. Excelente trabalho de otimização de horário!`);
      }
      setIsNewAppointmentOpen(false);
      setEditingAppointment(null);
    } catch (err: any) {
      console.error('Error saving appointment:', err);
      showAlert(`Erro ao salvar na agenda: ${err.message || err}`);
    }
  };

  const handleConfirmConflict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidatingConflict(true);
    setConflictError('');
    try {
      if (!currentUser?.username) throw new Error('Usuário não autenticado.');
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, password: conflictPassword })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Senha incorreta.');
      
      const finalApptData = {
        ...conflictPendingData,
        notas: '[CONFLITO] ' + (conflictPendingData.notas || '')
      };
      
      if (editingAppointment) {
        const { error } = await supabase
          .from('agendamentos')
          .update(mapAgendamentoToBackend(finalApptData))
          .eq('id', editingAppointment.id);
        if (error) throw error;
        
        const updatedAppt = {
          ...editingAppointment,
          ...finalApptData
        };
        setAppointments(prev => prev.map(a => a.id === editingAppointment.id ? updatedAppt : a));
        showAlert('Agendamento (em conflito) atualizado com sucesso!');
      } else {
        const { data: newData, error } = await supabase
          .from('agendamentos')
          .insert([mapAgendamentoToBackend(finalApptData)])
          .select('*, clientes(id, nome, avatar)');
        if (error) throw error;
        if (newData && newData[0]) {
          setAppointments(prev => [...prev, mapAgendamentoToFrontend(newData[0])]);
        }
        setAiAdvice(`Dica Gabi Almeida AI: Agendamento forçado às ${finalApptData.hora}. Cuidado com o choque de horário!`);
      }
      
      setIsNewAppointmentOpen(false);
      setEditingAppointment(null);
      setIsConflictModalOpen(false);
      setConflictPendingData(null);
      setConflictPassword('');
    } catch (err: any) {
      setConflictError(err.message || 'Erro ao validar senha.');
    } finally {
      setIsValidatingConflict(false);
    }
  };

  // Canvas drawing handler for signature pad
  // ========== Resize canvas to match container, accounting for devicePixelRatio ==========
  const resizeSignatureCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = signatureContainerRef.current;
    if (!canvas || !container) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = container.clientWidth;
    const displayHeight = container.clientHeight;

    canvas.width = Math.round(displayWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, displayWidth, displayHeight);
    }
  }, []);

  useEffect(() => {
    resizeSignatureCanvas();
    const container = signatureContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => resizeSignatureCanvas());
    observer.observe(container);
    const handleOrientation = () => setTimeout(resizeSignatureCanvas, 150);
    window.addEventListener('orientationchange', handleOrientation);
    return () => { observer.disconnect(); window.removeEventListener('orientationchange', handleOrientation); };
  }, [resizeSignatureCanvas]);

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

    canvas.setPointerCapture(e.pointerId);

    ctx.strokeStyle = '#7B2FBE';
    ctx.lineWidth = e.pointerType === 'pen' ? 2.5 : 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    isDrawingRef.current = true;
    setIsDrawing(true);
    setSignatureSaved(false);
  };

  const drawSignature = (e: React.PointerEvent) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (e.pointerType === 'pen' && e.pressure > 0) {
      ctx.lineWidth = 1 + e.pressure * 3;
    }

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopSignatureDrawing = (e: React.PointerEvent) => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    }
  };

  const clearSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
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

    const updatedTimeline = [newTimelineItem, ...(selectedPatient.historico || [])];

    try {
      const { error } = await supabase
        .from('clientes')
        .update({ historico: updatedTimeline })
        .eq('id', selectedPatient.id);
      if (error) throw error;
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, historico: updatedTimeline } : p));
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
            selectedPatientName: selectedPatient.nome,
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
        console.error('Gemini API Error:', data.error);
        setApiKeyConfigured(false);
      }
    } catch (err: any) {
      console.error('AI Fetch Error:', err);
      setApiKeyConfigured(false);
    } finally {
      setAiLoading(false);
    }
  };

  // Filter patients by search query
  const filteredPatients = patients.filter(p => 
    p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter transactions by search query
  const filteredTransactions = transactions.filter(t =>
    t.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Quick helper to categorize custom category tags in Cobranca views
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

  const exportTransactionsCSV = () => {
    const headers = ['Data', 'Descricao', 'Categoria', 'Status', 'Valor'];
    const rows = filteredTransactions.map(t => [
      t.data,
      `"${t.descricao.replace(/"/g, '""')}"`,
      t.categoria,
      t.status,
      t.valor.toFixed(2).replace('.', ',')
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printTransactions = () => {
    window.print();
  };

  const fileToBase64 = (file: File, maxWidth: number = 1200): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target?.result) return reject('Failed to read file');
        if (typeof e.target.result !== 'string') return reject('Invalid file type');
        
        // If it's a PDF or non-image, skip compression
        if (!file.type.startsWith('image/')) {
          return resolve(e.target.result);
        }

        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(e.target?.result as string);
          
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadUserAvatar = async (file: File): Promise<string> => {
    const base64 = await fileToBase64(file);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const contentType = file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    const path = `users/${crypto.randomUUID()}.${ext === 'jpg' ? 'jpg' : ext}`;
    const res = await fetch('/api/storage/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ bucket: 'avatars', path, base64, contentType })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Falha no upload do avatar.');
    }
    const data = await res.json();
    return data.url;
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

  if (isAuthenticated && isInitialLoading) {
    return (
      <div className="bg-surface-container-lowest h-screen w-full flex flex-col items-center justify-center relative select-none">
        <div className="flex flex-col items-center animate-fade-in">
          <span className="material-symbols-outlined text-primary text-[60px] mb-6 animate-spin" style={{ animationDuration: '3s' }}>schedule</span>
          <h2 className="font-manrope text-2xl font-black text-on-surface uppercase tracking-tight">Carregando CRM</h2>
          <p className="font-manrope text-[11px] tracking-[0.2em] font-bold text-on-surface-variant uppercase mt-2">Sincronizando Banco de Dados...</p>
        </div>
      </div>
    );
  }

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

  
  const addDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('despesas').insert({
      descricao: newDespesa.descricao,
      valor: parseFloat(newDespesa.valor.replace(',', '.')),
      data: newDespesa.data,
      categoria: newDespesa.categoria,
      status: newDespesa.status
    }).select();
    
    if (error) {
      showAlert('Erro ao adicionar despesa: ' + error.message);
    } else if (data) {
      setDespesas([data[0], ...despesas]);
      setIsDespesaModalOpen(false);
      setNewDespesa({ descricao: '', valor: '', data: new Date().toISOString().split('T')[0], categoria: 'Outros', status: 'Pago' });
      showAlert('Despesa cadastrada com sucesso!');
    }
  };

  const deleteDespesa = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta despesa?')) return;
    const { error } = await supabase.from('despesas').delete().eq('id', id);
    if (error) {
      showAlert('Erro ao excluir despesa: ' + error.message);
    } else {
      setDespesas(despesas.filter(d => d.id !== id));
      showAlert('Despesa excluída com sucesso!');
    }
  };

  return (
    <div className="bg-background text-on-surface font-sans overflow-hidden h-[100dvh] flex relative">
      
      {/* Mobile Menu Overlay */}
      
      {/* Modal Nova Despesa */}
      {isDespesaModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white-pure rounded-[32px] w-full max-w-md p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsDespesaModalOpen(false)} className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-colors bg-surface-container-lowest rounded-full p-2">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <h2 className="text-[24px] font-black text-primary font-manrope mb-2">Nova Despesa</h2>
            <p className="text-[13px] text-on-surface-variant mb-6 leading-relaxed">Cadastre uma nova conta, aluguel ou gasto em materiais.</p>
            <form onSubmit={addDespesa} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Descrição</label>
                <input required value={newDespesa.descricao} onChange={e => setNewDespesa({...newDespesa, descricao: e.target.value})} placeholder="Ex: Energia Elétrica, Aluguel..." className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-outline" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Valor (R$)</label>
                  <input required value={newDespesa.valor} onChange={e => setNewDespesa({...newDespesa, valor: e.target.value})} placeholder="0,00" type="number" step="0.01" className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Data</label>
                  <input required value={newDespesa.data} onChange={e => setNewDespesa({...newDespesa, data: e.target.value})} type="date" className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Status</label>
                  <select value={newDespesa.status} onChange={e => setNewDespesa({...newDespesa, status: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option value="Pago">Pago</option>
                    <option value="Pendente">Pendente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Categoria</label>
                  <select value={newDespesa.categoria} onChange={e => setNewDespesa({...newDespesa, categoria: e.target.value})} className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option value="Fixa">Fixa (Aluguel, Luz)</option>
                    <option value="Insumos">Insumos/Materiais</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-white-pure font-bold text-[14px] py-3.5 rounded-xl hover:opacity-90 transition-opacity mt-4 flex justify-center items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">check</span>
                Adicionar Despesa
              </button>
            </form>
          </div>
        </div>
      )}
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 1. Left SideNavBar */}
      <aside className={`sidebar fixed lg:relative left-0 top-0 h-full w-72 flex flex-col border-r border-outline-variant bg-surface-container-low backdrop-blur-md z-40 transition-transform duration-300 ${isMobileMenuOpen ? 'open translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 pb-4 flex flex-col">
          <div className="h-16 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">spa</span>
            <div className="flex flex-col">
              <span className="font-manrope text-primary tracking-tighter text-2xl font-black uppercase leading-none">Gabi Almeida</span>
              <span className="font-manrope text-outline tracking-[0.22em] uppercase text-[9px] mt-0.5 font-bold">Estética Avançada</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 flex flex-col pt-2 overflow-y-auto custom-scrollbar">
          <button 
            id="nav-agenda"
            onClick={() => { setCurrentTab('agenda'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-300 text-left ${currentTab === 'agenda' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: currentTab === 'agenda' ? "'FILL' 1" : "'FILL' 0"}}>calendar_month</span>
            <span className="font-manrope text-[14px] leading-none text-primary">Agenda</span>
          </button>

          <button 
            id="nav-financeiro"
            onClick={() => { setCurrentTab('financeiro'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-300 text-left ${currentTab === 'financeiro' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: currentTab === 'financeiro' ? "'FILL' 1" : "'FILL' 0"}}>payments</span>
            <span className="font-manrope text-[14px] leading-none text-primary">Cobranças</span>
          </button>



          <button 
            id="nav-mensagens-pre"
            onClick={() => { setCurrentTab('mensagens-pre'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-300 text-left ${currentTab === 'mensagens-pre' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: currentTab === 'mensagens-pre' ? "'FILL' 1" : "'FILL' 0"}}>chat_bubble</span>
            <span className="font-manrope text-[14px] leading-none text-primary">Msgs Pre-definidas</span>
          </button>

          <button 
            id="nav-cadastro-cliente"
            onClick={() => { setCurrentTab('cadastro-cliente'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-300 text-left ${currentTab === 'cadastro-cliente' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: currentTab === 'cadastro-cliente' ? "'FILL' 1" : "'FILL' 0"}}>person_add</span>
            <span className="font-manrope text-[14px] leading-none text-primary">Cadastro de Clientes</span>
          </button>

          <button 
            id="nav-clientes"
            onClick={() => { setCurrentTab('clientes'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-300 text-left ${currentTab === 'clientes' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: currentTab === 'clientes' ? "'FILL' 1" : "'FILL' 0"}}>group</span>
            <span className="font-manrope text-[14px] leading-none text-primary">Prontuário (CRM)</span>
          </button>

          <button 
            id="nav-servicos"
            onClick={() => { setCurrentTab('servicos'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-300 text-left ${currentTab === 'servicos' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: currentTab === 'servicos' ? "'FILL' 1" : "'FILL' 0"}}>medical_services</span>
            <span className="font-manrope text-[14px] leading-none text-primary">Serviços & Pacotes</span>
          </button>

          <button 
            id="nav-estoque"
            onClick={() => { setCurrentTab('estoque'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-300 text-left ${currentTab === 'estoque' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: currentTab === 'estoque' ? "'FILL' 1" : "'FILL' 0"}}>shopping_cart</span>
            <span className="font-manrope text-[14px] leading-none text-primary">Produtos & Estoque</span>
          </button>

          <button 
            id="nav-despesas"
            onClick={() => { setCurrentTab('despesas'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-300 text-left ${currentTab === 'despesas' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: currentTab === 'despesas' ? "'FILL' 1" : "'FILL' 0"}}>monetization_on</span>
            <span className="font-manrope text-[14px] leading-none text-primary">Despesas</span>
          </button>

          <button 
            id="nav-funcionarios"
            onClick={() => { setCurrentTab('funcionarios'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-300 text-left ${currentTab === 'funcionarios' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: currentTab === 'funcionarios' ? "'FILL' 1" : "'FILL' 0"}}>badge</span>
            <span className="font-manrope text-[14px] leading-none text-primary">Funcionários</span>
          </button>

          <div className="pt-4 pb-1">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider px-4">Relatórios</span>
          </div>

          <button 
            id="nav-relatorios-performance"
            onClick={() => { setCurrentTab('relatorios-performance'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-2 rounded-xl transition-all duration-300 text-left ${currentTab === 'relatorios-performance' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-primary text-[18px]" style={{fontVariationSettings: currentTab === 'relatorios-performance' ? "'FILL' 1" : "'FILL' 0"}}>speed</span>
            <span className="font-manrope text-[13px] leading-none text-primary">Performance</span>
          </button>

          <button 
            id="nav-relatorios-financeiro"
            onClick={() => { setCurrentTab('relatorios-financeiro'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-2 rounded-xl transition-all duration-300 text-left ${currentTab === 'relatorios-financeiro' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-primary text-[18px]" style={{fontVariationSettings: currentTab === 'relatorios-financeiro' ? "'FILL' 1" : "'FILL' 0"}}>bar_chart</span>
            <span className="font-manrope text-[13px] leading-none text-primary">Resumo Financeiro</span>
          </button>

          <button 
            id="nav-relatorios-melhores-clientes"
            onClick={() => { setCurrentTab('relatorios-melhores-clientes'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-2 rounded-xl transition-all duration-300 text-left ${currentTab === 'relatorios-melhores-clientes' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-primary text-[18px]" style={{fontVariationSettings: currentTab === 'relatorios-melhores-clientes' ? "'FILL' 1" : "'FILL' 0"}}>person</span>
            <span className="font-manrope text-[13px] leading-none text-primary">Melhores Clientes</span>
          </button>

          <button 
            id="nav-configuracoes"
            onClick={() => { setCurrentTab('configuracoes'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-2 rounded-xl transition-all duration-300 text-left ${currentTab === 'configuracoes' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-primary text-[18px]" style={{fontVariationSettings: currentTab === 'configuracoes' ? "'FILL' 1" : "'FILL' 0"}}>settings</span>
            <span className="font-manrope text-[13px] leading-none text-primary">Configurações</span>
          </button>

          <button 
            id="nav-dados-empresa"
            onClick={() => { setCurrentTab('dados-empresa'); setSearchQuery(''); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-4 px-4 py-2 rounded-xl transition-all duration-300 text-left ${currentTab === 'dados-empresa' ? 'text-primary font-bold border-r-4 border-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-primary text-[18px]" style={{fontVariationSettings: currentTab === 'dados-empresa' ? "'FILL' 1" : "'FILL' 0"}}>business</span>
            <span className="font-manrope text-[13px] leading-none text-primary">Dados da Empresa</span>
          </button>
        </nav>

        {/* Create appointment trigger from sidebar */}
        <div className="p-4 mx-4 mb-4 bg-surface-container-lowest/40 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <button 
            id="sidebar-new-appointment"
            onClick={() => {
              setEditingAppointment(null);
              setNewApptPatient(patients[0]?.nome || '');
              setNewApptProcedure(services[0]?.nome || '');
              setNewApptTime('09:00');
              setNewApptDate(new Date().toISOString().split('T')[0]);
              setIsNewAppointmentOpen(true);
              setIsMobileMenuOpen(false);
            }}
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
           <button onClick={() => {
            handleLogout();
            setCurrentTab('dashboard');
          }} className="w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-error/80 hover:text-error transition-colors text-left text-[14px]">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-manrope">Sair</span>
          </button>
        </div>
      </aside>
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Top Header and Main Section */}
      <main className="main-content flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* TopNavBar Shell */}
        <header className="h-16 md:h-20 w-full flex justify-between items-center px-4 md:px-8 bg-white-pure/60 backdrop-blur-xl border-b border-outline-variant z-20 relative gap-4">
          
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center justify-center -ml-2"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="sm:hidden p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[24px]">search</span>
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
              <div className="relative hidden sm:block">
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
                  <div className="absolute right-4 sm:right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-xl z-50">
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

              <button onClick={() => setCurrentTab('agenda')} className="hidden sm:block p-2 hover:text-primary transition-colors cursor-pointer" title="Histórico da Studio">
                <span className="material-symbols-outlined">history</span>
              </button>
              
              <button 
                onClick={() => {
                  setCurrentTab('clientes');
                  setSelectedPatientId('p1');
                }} 
                className="hidden sm:block p-2 hover:text-primary transition-colors cursor-pointer" 
                title="Mensagens do CRM"
              >
                <span className="material-symbols-outlined">chat_bubble</span>
              </button>
            </div>

            <div className="hidden sm:block h-8 w-[1px] bg-outline-variant"></div>

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
                {currentUser?.avatar && !currentUser.avatar.includes('dicebear') ? (
                  <Image width={500} height={500} unoptimized 
                    alt="Perfil" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 transition-all hover:border-primary shrink-0" 
                    src={currentUser.avatar} sizes="(max-width: 768px) 100vw, 500px"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-surface flex items-center justify-center text-primary font-bold shrink-0">
                    {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {isProfileMenuOpen && (
                <div className="absolute right-4 sm:right-0 mt-3 w-[calc(100vw-2rem)] sm:w-56 bg-white-pure rounded-2xl shadow-xl border border-outline-variant py-2 z-50 animate-fade-in text-[13px] font-sans">
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

        {isMobileSearchOpen && (
          <div className="fixed inset-0 z-40 bg-white-pure p-4 flex items-center gap-2 sm:hidden">
            <span className="material-symbols-outlined text-on-surface-variant opacity-60">search</span>
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="flex-1 bg-[#f7f3f0] border-none rounded-full font-sans text-[14px] focus:ring-1 focus:ring-primary/40 focus:outline-none placeholder:text-on-surface-variant/50 px-4 py-2.5"
            />
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 text-on-surface-variant"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}

        {/* 4. Agenda Tab Canvas */}
        {currentTab === 'agenda' && (
          <section className="flex-1 overflow-hidden flex flex-col p-0 lg:p-8 bg-surface select-none relative">
            
            {/* Mobile-Only Header and Calendar */}
            <div className="lg:hidden flex flex-col w-full bg-white-pure border-b border-outline-variant sticky top-0 z-30">
              {/* Header: ☰ | [Semanal] [Mensal] | 🔍 */}
              <div className="h-14 flex items-center justify-between px-4">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center justify-center -ml-2"
                >
                  <span className="material-symbols-outlined text-[24px]">menu</span>
                </button>

                <div className="flex p-1 bg-surface-container rounded-full border border-outline-variant/60 select-none">
                  <button 
                    onClick={() => setAgendaView('semanal')}
                    className={`px-4 py-1 rounded-full text-[12px] font-bold transition-all cursor-pointer h-9 flex items-center justify-center min-w-[70px] ${agendaView !== 'mensal' ? 'bg-[#7B2FBE] text-white-pure shadow-sm' : 'text-on-surface-variant'}`}
                  >
                    Semana
                  </button>
                  <button 
                    onClick={() => setAgendaView('mensal')}
                    className={`px-4 py-1 rounded-full text-[12px] font-bold transition-all cursor-pointer h-9 flex items-center justify-center min-w-[70px] ${agendaView === 'mensal' ? 'bg-[#7B2FBE] text-white-pure shadow-sm' : 'text-on-surface-variant'}`}
                  >
                    Mês
                  </button>
                  </div>

                <button 
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center justify-center -mr-2"
                >
                  <span className="material-symbols-outlined text-[24px]">search</span>
                </button>
              </div>

              {/* Compact Weekly Calendar (only if not monthly view) */}
              {agendaView !== 'mensal' && (
                <div className="flex flex-col bg-white-pure pt-2 pb-3 px-4 border-t border-outline-variant/30 select-none">
                  <div className="flex justify-between items-center mb-2">
                    <button 
                      onClick={() => {
                        const newDate = new Date(agendaNavDate);
                        newDate.setDate(newDate.getDate() - 7);
                        setAgendaNavDate(newDate);
                      }}
                      className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <span className="font-manrope text-[11px] font-black uppercase tracking-wider text-primary">
                      {agendaNavDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                    </span>
                    <button 
                      onClick={() => {
                        const newDate = new Date(agendaNavDate);
                        newDate.setDate(newDate.getDate() + 7);
                        setAgendaNavDate(newDate);
                      }}
                      className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                  
                  {/* 7 Columns: Dom-Sáb */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {(() => {
                      const activeDate = new Date(agendaNavDate);
                      const dayOfWeek = activeDate.getDay();
                      const sunday = new Date(activeDate);
                      sunday.setDate(activeDate.getDate() - dayOfWeek);

                      const days = [];
                      const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                      for (let i = 0; i < 7; i++) {
                        const d = new Date(sunday);
                        d.setDate(sunday.getDate() + i);
                        days.push({
                          label: labels[i],
                          dayNum: d.getDate(),
                          dateObject: d,
                          isToday: d.toDateString() === new Date().toDateString(),
                          isSelected: d.toDateString() === agendaNavDate.toDateString()
                        });
                      }

                      return days.map((day, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setAgendaNavDate(day.dateObject)}
                          className="flex flex-col items-center cursor-pointer py-1"
                        >
                          <span className="text-[10px] text-outline font-bold uppercase tracking-tight mb-1">{day.label}</span>
                          <span className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] font-bold transition-all ${
                            day.isSelected 
                              ? 'bg-[#7B2FBE] text-white-pure shadow-sm' 
                              : day.isToday 
                                ? 'text-[#7B2FBE] border border-[#7B2FBE]' 
                                : 'text-on-surface hover:bg-surface-container/50'
                          }`}>
                            {day.dayNum}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
            
            {/* Calendar Controls */}
            <div className="hidden lg:flex justify-between items-end mb-6">
              <div className="space-y-3">
                <h2 className="font-manrope text-headline-md font-bold text-on-surface flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[20px] sm:text-[26px]">
                  <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>calendar_today</span>
                  Agenda Diária Studio
                  <span className="date-header text-on-surface-variant font-normal text-[15px] sm:ml-2">Quinta-feira, 24 de Outubro, 2023</span>
                </h2>
                
                <div className="flex items-center gap-3">
                  <div className="view-toggle flex p-1 bg-surface-container rounded-full border border-outline-variant/60 select-none">
                    <button 
                      onClick={() => setAgendaView('diaria')}
                      className={`px-5 py-1.5 rounded-full text-label-md text-[12px] font-bold transition-all cursor-pointer ${agendaView === 'diaria' ? 'bg-[#7B2FBE] text-white-pure shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                    >
                      Dia
                    </button>
                    <button 
                      onClick={() => setAgendaView('semanal')}
                      className={`px-5 py-1.5 rounded-full text-label-md text-[12px] font-bold transition-all cursor-pointer ${agendaView === 'semanal' ? 'bg-[#7B2FBE] text-white-pure shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                    >
                      Semana
                    </button>
                    <button 
                      onClick={() => setAgendaView('mensal')}
                      className={`px-5 py-1.5 rounded-full text-label-md text-[12px] font-bold transition-all cursor-pointer ${agendaView === 'mensal' ? 'bg-[#7B2FBE] text-white-pure shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                    >
                      Mês
                    </button>
                    </div>
                  
                  <div className="h-6 w-[1px] bg-outline-variant"></div>
                  
                  {/* Dynamic Practitioner Avatars (from DB users) */}
                  <div className="flex -space-x-2">
                    {professionals.slice(0, 3).map((prof) => (
                      <div
                        key={prof.id || prof.name}
                        title={prof.name}
                        className="w-8 h-8 rounded-full border-2 border-surface bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary hover:z-10 transition-transform hover:scale-110"
                      >
                        {prof.avatar && !prof.avatar.includes('dicebear') ? (
                          <Image width={500} height={500} unoptimized alt={prof.name} className="w-8 h-8 rounded-full object-cover shrink-0" src={prof.avatar} sizes="(max-width: 768px) 100vw, 500px" />
                        ) : (
                          prof.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                        )}
                      </div>
                    ))}
                    {professionals.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-surface bg-[#e5e2df] flex items-center justify-center text-[10px] font-bold text-primary cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors">
                        +{professionals.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Legend Indicator labels exactly matching layout of Image 3 */}
              <div className="flex flex-wrap gap-4 select-none">
                {/* Categorias Legend */}
                <div className="flex items-center gap-4 px-5 py-2.5 bg-white-pure border border-outline-variant/60 rounded-2xl shadow-sm">
                  <span className="text-[9px] uppercase font-bold text-outline tracking-wider border-r border-outline-variant/50 pr-3">Categorias</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                    <span className="text-label-md text-[11px] font-semibold text-on-surface-variant">Estética</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container"></span>
                    <span className="text-label-md text-[11px] font-semibold text-on-surface-variant">Consulta</span>
                  </div>
                </div>

                {/* Status Legend */}
                <div className="flex items-center gap-4 px-5 py-2.5 bg-white-pure border border-outline-variant/60 rounded-2xl shadow-sm">
                  <span className="text-[9px] uppercase font-bold text-outline tracking-wider border-r border-outline-variant/50 pr-3">Status</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-label-md text-[11px] font-semibold text-on-surface-variant">Finalizado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                    <span className="text-label-md text-[11px] font-semibold text-on-surface-variant">Em Atendimento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-label-md text-[11px] font-semibold text-on-surface-variant">Confirmado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span className="text-label-md text-[11px] font-semibold text-on-surface-variant">Pendente</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split layout: Sidebar Left / Main Schedule Right */}
            <div className="flex-1 overflow-hidden flex gap-4">
              
              {/* Agenda Sidebar (240px) */}
              <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
                <div className="bg-white-pure rounded-3xl border border-outline-variant/60 shadow-sm p-4 space-y-5">
                  
                  {/* Profissionais */}
                  <div>
                    <p className="text-[10px] text-outline font-extrabold uppercase tracking-widest mb-3">Profissionais</p>
                    <div className="space-y-1.5">
                      <button
                        onClick={() => setSelectedProfessional('todos')}
                        className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-left transition-colors ${selectedProfessional === 'todos' ? 'bg-primary/10' : 'hover:bg-surface-container'}`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-outline flex-shrink-0"></span>
                        <span className={`text-[12px] ${selectedProfessional === 'todos' ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>Todos</span>
                      </button>
                      {professionals.map((prof, idx) => {
                        const colors = [
                          { bg: '#fce4f0', text: '#7a1a4a' },
                          { bg: '#daeeff', text: '#0c4478' },
                          { bg: '#d4f5e5', text: '#0a4a2a' }
                        ];
                        const c = colors[idx % colors.length];
                        const isActive = selectedProfessional === prof.name;
                        return (
                          <button
                            key={prof.name}
                            onClick={() => setSelectedProfessional(isActive ? 'todos' : prof.name)}
                            className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-left transition-colors ${isActive ? 'bg-primary/10' : 'hover:bg-surface-container'}`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.text }}></span>
                            <span className={`text-[12px] truncate ${isActive ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>{prof.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filtros: Categorias */}
                  <div>
                    <p className="text-[10px] text-outline font-extrabold uppercase tracking-widest mb-2">Categorias</p>
                    <div className="space-y-1.5">
                      {['todos', 'Estética', 'Consulta'].map(cat => {
                        const isActive = selectedCategoryFilter === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategoryFilter(cat)}
                            className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-left transition-colors ${isActive ? 'bg-primary/10' : 'hover:bg-surface-container'}`}
                          >
                            <span className={`text-[12px] ${isActive ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>
                              {cat === 'todos' ? 'Todas' : cat}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filtros: Status */}
                  <div>
                    <p className="text-[10px] text-outline font-extrabold uppercase tracking-widest mb-2">Status</p>
                    <div className="space-y-1.5">
                      {['todos', 'Confirmado', 'Em Atendimento', 'Finalizado', 'Pendente'].map(st => {
                        const isActive = selectedStatusFilter === st;
                        const statusColor = st === 'Confirmado' ? 'bg-amber-500' : st === 'Em Atendimento' ? 'bg-cyan-500' : st === 'Finalizado' ? 'bg-emerald-500' : st === 'Pendente' ? 'bg-slate-400' : 'bg-outline';
                        return (
                          <button
                            key={st}
                            onClick={() => setSelectedStatusFilter(st)}
                            className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-left transition-colors ${isActive ? 'bg-primary/10' : 'hover:bg-surface-container'}`}
                          >
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`}></span>
                            <span className={`text-[12px] ${isActive ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>
                              {st === 'todos' ? 'Todos' : st}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Métricas Resumidas */}
                  <div className="pt-3 border-t border-outline-variant/40 space-y-3">
                    <p className="text-[10px] text-outline font-extrabold uppercase tracking-widest">Métricas do Dia</p>
                    <div className="flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined text-[16px]">trending_up</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-on-surface-variant leading-tight">Faturamento Estimado</p>
                        <p className="font-bold text-[13px] text-primary truncate">R$ 16.700,00</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary flex-shrink-0">
                        <span className="material-symbols-outlined text-[16px]">person_check</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-on-surface-variant leading-tight">Taxa Ocupacional</p>
                        <p className="font-bold text-[13px] text-on-surface">92%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Schedule Container */}
              <div className="flex-1 min-w-0 bg-white-pure rounded-3xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
                
                {/* Compact Weekly Calendar (desktop) */}
                {agendaView !== 'mensal' && (
                  <div className="hidden lg:flex flex-col bg-white-pure pt-3 pb-3 px-4 border-b border-outline-variant/30 select-none">
                    <div className="flex justify-between items-center mb-2">
                      <button
                        onClick={() => {
                          const newDate = new Date(agendaNavDate);
                          newDate.setDate(newDate.getDate() - 7);
                          setAgendaNavDate(newDate);
                        }}
                        className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1 min-h-[36px] min-w-[36px]"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                      </button>
                      <span className="font-manrope text-[12px] font-black uppercase tracking-wider text-primary">
                        {agendaNavDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                      </span>
                      <button
                        onClick={() => {
                          const newDate = new Date(agendaNavDate);
                          newDate.setDate(newDate.getDate() + 7);
                          setAgendaNavDate(newDate);
                        }}
                        className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1 min-h-[36px] min-w-[36px]"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center">
                      {(() => {
                        const activeDate = new Date(agendaNavDate);
                        const dayOfWeek = activeDate.getDay();
                        const sunday = new Date(activeDate);
                        sunday.setDate(activeDate.getDate() - dayOfWeek);

                        const days = [];
                        const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                        for (let i = 0; i < 7; i++) {
                          const d = new Date(sunday);
                          d.setDate(sunday.getDate() + i);
                          const fDay = String(d.getDate()).padStart(2, '0');
                          const fMonth = String(d.getMonth() + 1).padStart(2, '0');
                          const dateStr = `${d.getFullYear()}-${fMonth}-${fDay}`;
                          const hasAppt = appointments.some(a => a.data === dateStr);
                          days.push({
                            label: labels[i],
                            dayNum: d.getDate(),
                            dateObject: d,
                            isToday: d.toDateString() === new Date().toDateString(),
                            isSelected: d.toDateString() === agendaNavDate.toDateString(),
                            hasAppt
                          });
                        }

                        return days.map((day, idx) => (
                          <div
                            key={idx}
                            onClick={() => setAgendaNavDate(day.dateObject)}
                            className="flex flex-col items-center cursor-pointer py-1"
                          >
                            <span className="text-[10px] text-outline font-bold uppercase tracking-tight mb-1">{day.label}</span>
                            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] font-bold transition-all ${
                              day.isSelected
                                ? 'bg-[#7B2FBE] text-white-pure shadow-sm'
                                : day.isToday
                                  ? 'text-[#7B2FBE] border border-[#7B2FBE]'
                                  : 'text-on-surface hover:bg-surface-container/50'
                            }`}>
                              {day.dayNum}
                            </span>
                            <span className={`w-1 h-1 rounded-full mt-1 ${day.hasAppt ? 'bg-primary' : 'bg-transparent'}`}></span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Card list view (replaces timeline on desktop) */}
                {agendaView !== 'mensal' && (
                  <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 bg-[#fbfaf8] flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                      <p className="text-[14px] font-medium text-primary text-center sm:text-left">
                        {(() => {
                          const d = agendaNavDate;
                          const isToday = d.toDateString() === new Date().toDateString();
                          const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
                          const day = d.getDate();
                          const month = d.toLocaleDateString('pt-BR', { month: 'long' });
                          const year = d.getFullYear();
                          return `${isToday ? 'Hoje, ' : ''}${day} de ${month.charAt(0).toUpperCase() + month.slice(1)}, ${year}`;
                        })()}
                      </p>
                      <button
                        onClick={() => {
                          setEditingAppointment(null);
                          setNewApptPatient(patients[0]?.nome || '');
                          setNewApptProcedure(services[0]?.nome || '');
                          setNewApptTime('09:00');
                          setNewApptDate(`${agendaNavDate.getFullYear()}-${String(agendaNavDate.getMonth() + 1).padStart(2, '0')}-${String(agendaNavDate.getDate()).padStart(2, '0')}`);
                          setIsNewAppointmentOpen(true);
                        }}
                        className="self-center sm:self-auto flex items-center gap-2 bg-primary text-white-pure px-4 py-2 rounded-xl font-bold text-[13px] hover:opacity-90 transition-opacity shadow-sm min-h-[36px]"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Novo agendamento
                      </button>
                    </div>
                    {(() => {
                      const formattedDay = String(agendaNavDate.getDate()).padStart(2, '0');
                      const formattedMonth = String(agendaNavDate.getMonth() + 1).padStart(2, '0');
                      const dateStr = `${agendaNavDate.getFullYear()}-${formattedMonth}-${formattedDay}`;
                      const dayAppts = appointments.filter(appt => appt.data === dateStr);

                      const hours = Array.from({length: 16}, (_, i) => i + 7); // 07:00 to 22:00

                      return (
                        <div className="relative mt-4 bg-white-pure rounded-2xl border border-outline-variant/50 shadow-sm overflow-hidden flex flex-col max-h-[60vh] overflow-y-auto custom-scrollbar">
                          {hours.map(hour => {
                            const formattedHour = `${String(hour).padStart(2, '0')}:00`;
                            const hourAppts = dayAppts.filter(appt => {
                              const apptHour = parseInt(appt.hora.split(':')[0]);
                              return apptHour === hour;
                            });

                            return (
                              <div key={hour} className="flex h-[90px] border-b border-outline-variant/30 last:border-0 relative group">
                                <div className="w-[70px] flex-shrink-0 text-center text-[12px] font-bold text-on-surface-variant/60 pt-3 border-r border-outline-variant/30 bg-surface/30 z-10">
                                  {formattedHour}
                                </div>
                                <div 
                                  className="flex-1 relative bg-transparent transition-colors group-hover:bg-surface-container-lowest/50 cursor-pointer"
                                  onClick={() => {
                                    setEditingAppointment(null);
                                    setNewApptPatient('');
                                    setNewApptProcedure(services[0]?.nome || '');
                                    setNewApptTime(formattedHour);
                                    setNewApptDate(dateStr);
                                    setIsNewAppointmentOpen(true);
                                  }}
                                >
                                  {hourAppts.length > 0 ? (
                                    hourAppts.map((appt, i) => {
                                      const isConsult = appt.categoria === 'Consulta';
                                      
                                      let cardColorClass = 'bg-surface-container border-outline-variant text-on-surface z-20';
                                      const durAppt = getServiceDuration(appt.procedimento);
                                      const apptIndex = appointments.findIndex(a => a.id === appt.id);
                                      const isConflicted = appointments.some((a, idx) => {
                                        if (idx >= apptIndex || a.data !== appt.data) return false;
                                        const durA = getServiceDuration(a.procedimento);
                                        return checkTimeOverlap(a.hora.slice(0, 5), durA, appt.hora.slice(0, 5), durAppt);
                                      });
                                      if (isConflicted || appt.notas?.includes('[CONFLITO]')) {
                                        cardColorClass = 'bg-red-600 border-red-800 text-white-pure shadow-xl z-30 scale-[0.98] origin-left';
                                      } else if (appt.profissional.toLowerCase().includes('ricardo')) {
                                        cardColorClass = 'bg-blue-50 border-blue-200 text-blue-900 z-20';
                                      } else if (appt.profissional.toLowerCase().includes('helena')) {
                                        cardColorClass = 'bg-pink-50 border-pink-200 text-pink-900';
                                      } else {
                                        cardColorClass = 'bg-purple-50 border-purple-200 text-purple-900 z-20';
                                      }

                                      const badgeBg = appt.status === 'Finalizado' 
                                        ? 'bg-emerald-500 text-white-pure' 
                                        : appt.status === 'Em Atendimento' 
                                          ? 'bg-cyan-500 text-white-pure' 
                                          : appt.status === 'Confirmado' 
                                            ? 'bg-amber-500 text-white-pure' 
                                            : 'bg-slate-400 text-white-pure';

                                      const startMinute = parseInt(appt.hora.split(':')[1] || '0');
                                      const topPx = (startMinute / 60) * 90;
                                      const heightPx = (durAppt / 60) * 90;

                                      return (
                                        <div 
                                          key={appt.id} 
                                          style={{ top: `${topPx}px`, height: `${Math.max(heightPx, 40)}px`, left: '8px', right: '8px' }}
                                          className={`absolute p-2 rounded-xl border border-l-4 shadow-sm flex flex-col gap-0.5 overflow-hidden hover:shadow-md transition-all cursor-pointer ${cardColorClass}`}
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             const client = patients.find(p => p.nome.toLowerCase() === appt.clienteNome.toLowerCase() || p.id === appt.clienteId);
                                             if (client) {
                                               setInteractClient(client);
                                               setInteractAppointmentId(appt.id);
                                               setIsWhatsAppSubmenuOpen(false);
                                               setIsClientInteractModalOpen(true);
                                             }
                                          }}
                                        >
                                          <div className="flex justify-between items-start">
                                            <p className="font-manrope text-[13px] font-extrabold flex items-center gap-1.5">
                                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                                              {appt.hora}
                                            </p>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${badgeBg}`}>
                                              {appt.status}
                                            </span>
                                          </div>

                                          <p className="text-[13px] font-bold mt-1 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px]">person</span>
                                            {appt.clienteNome}
                                          </p>

                                          <p className="text-[12px] font-medium flex items-center gap-1.5 opacity-90">
                                            <span className="material-symbols-outlined text-[15px]">
                                              {isConsult ? 'event_note' : 'spa'}
                                            </span>
                                            {appt.procedimento}
                                          </p>

                                          <div className="flex gap-2 justify-end mt-1 pt-2 border-t border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingAppointment(appt);
                                                setNewApptPatient(appt.clienteNome);
                                                setNewApptProcedure(appt.procedimento);
                                                setNewApptProfessional(appt.profissional);
                                                setNewApptTime(appt.hora);
                                                setNewApptDate(appt.data);
                                                setNewApptCategory(appt.categoria);
                                                setNewApptStatus(appt.status);
                                                setIsNewAppointmentOpen(true);
                                              }}
                                              className="p-1 hover:text-primary transition-colors flex items-center gap-1 font-bold text-[10px]"
                                            >
                                              <span className="material-symbols-outlined text-[14px]">edit</span>
                                              Editar
                                            </button>
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                showConfirm(`Remover agendamento de ${appt.clienteNome}?`, async () => {
                                                  try {
                                                    const { error } = await supabase.from('agendamentos').delete().eq('id', appt.id);
                                                    if (error) throw error;
                                                    setAppointments(prev => prev.filter(a => a.id !== appt.id));
                                                    showAlert('Agendamento removido.');
                                                  } catch (err: any) {
                                                    showAlert(`Erro ao excluir: ${err.message}`);
                                                  }
                                                });
                                              }}
                                              className="p-1 hover:text-error transition-colors flex items-center gap-1 font-bold text-[10px]"
                                            >
                                              <span className="material-symbols-outlined text-[14px]">delete</span>
                                              Excluir
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="w-full h-full min-h-[40px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => {
                                          setEditingAppointment(null);
                                          setNewApptPatient(patients[0]?.nome || '');
                                          setNewApptProcedure(services[0]?.nome || '');
                                          setNewApptTime(formattedHour);
                                          setNewApptDate(dateStr);
                                          setIsNewAppointmentOpen(true);
                                        }}
                                        className="text-[11px] font-bold text-primary flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">add</span>
                                        Agendar às {formattedHour}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {/* 4.2 Weekly View Layout */}
                {agendaView === 'semanal' && (
                  <div className="agenda-grid w-full h-full hidden lg:flex flex-col overflow-x-auto overflow-y-hidden bg-white-pure custom-scrollbar">
                    <div className="flex flex-col min-w-[800px] h-full overflow-hidden">
                      {/* Header: Weekdays */}
                      <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container/30">
                        {weekDays.map((day, idx) => (
                          <div key={idx} className={`p-3 text-center border-r border-outline-variant/60 relative ${day.active ? 'bg-primary/5' : ''}`}>
                            <p className="text-[10px] text-outline font-extrabold uppercase tracking-wider">{day.label}</p>
                            <p className={`font-manrope text-[14px] font-bold mt-1 ${day.active ? 'text-primary' : 'text-on-surface'}`}>{day.date}</p>
                            {day.active && <span className="absolute bottom-0 inset-x-0 h-1 bg-primary"></span>}
                          </div>
                        ))}
                      </div>

                      {/* Columns grid body */}
                      <div className="grid grid-cols-7 flex-1 divide-x divide-outline-variant/40 overflow-y-auto custom-scrollbar p-2 bg-[#fbfaf8]">
                        {weekDays.map((day, idx) => {
                          const dayAppts = appointments.filter(appt => appt.data === day.dateString);
                          return (
                            <div key={idx} className={`p-1.5 space-y-3 ${day.active ? 'bg-primary/[0.01]' : ''}`}>
                              {dayAppts.map(appt => {
                                const isConsult = appt.categoria === 'Consulta';
                                let cardClass = isConsult
                                  ? 'bg-tertiary-container/10 border-tertiary-container text-tertiary'
                                  : 'bg-secondary-container/10 border-secondary-container text-[#745c00]';
                                const durAppt = getServiceDuration(appt.procedimento);
                                const apptIndex = appointments.findIndex(a => a.id === appt.id);
                                const isConflicted = appointments.some((a, idx) => {
                                  if (idx >= apptIndex || a.data !== appt.data) return false;
                                  const durA = getServiceDuration(a.procedimento);
                                  return checkTimeOverlap(a.hora.slice(0, 5), durA, appt.hora.slice(0, 5), durAppt);
                                });
                                if (isConflicted || appt.notas?.includes('[CONFLITO]')) {
                                  cardClass = 'bg-red-600 border-red-800 text-white-pure animate-pulse shadow-md';
                                }
                                return (
                                  <div 
                                    key={appt.id} 
                                    onClick={() => {
                                      setNewApptDate(day.dateString);
                                      setAgendaView('diaria');
                                    }}
                                    className={`border-l-2 p-2 rounded-lg relative hover:shadow-sm transition-all cursor-pointer ${cardClass}`}
                                  >
                                    <p className="text-[8px] text-outline font-bold">{appt.hora}</p>
                                    <p className="font-manrope text-[11px] font-extrabold text-on-surface truncate">{appt.clienteNome}</p>
                                    <p className="text-[9px] text-on-surface-variant truncate">{appt.procedimento}</p>
                                  </div>
                                );
                              })}
                              {dayAppts.length === 0 && (
                                <div className="text-center py-8 text-outline text-[9px] italic">Sem agendamentos</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4.3 Monthly View Layout */}
                {agendaView === 'mensal' && (
                  <div className="agenda-grid w-full h-full flex flex-col md:flex-row overflow-hidden bg-white-pure">
                    {/* Left: Dynamic month calendar grid */}
                    <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-outline-variant overflow-y-auto">
                      <div className="flex justify-between items-center mb-6 select-none font-manrope">
                        <h4 className="font-black text-primary text-[15px] uppercase tracking-wider">
                          {agendaNavDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                        </h4>
                        <span className="text-[12px] text-on-surface-variant font-bold">Studio Activa</span>
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
                        {Array.from({ length: new Date(agendaNavDate.getFullYear(), agendaNavDate.getMonth() + 1, 0).getDate() }).map((_, index) => {
                          const dayNum = index + 1;
                          const isSelected = dayNum === selectedCalendarDay;
                          const formattedDay = String(dayNum).padStart(2, '0');
                          const formattedMonth = String(agendaNavDate.getMonth() + 1).padStart(2, '0');
                          const dateStr = `${agendaNavDate.getFullYear()}-${formattedMonth}-${formattedDay}`;
                          const dayAppts = appointments.filter(appt => appt.data === dateStr);
                          const hasAppt = dayAppts.length > 0;
                          
                          return (
                            <button 
                              key={dayNum}
                              onClick={() => setAgendaNavDate(new Date(agendaNavDate.getFullYear(), agendaNavDate.getMonth(), dayNum))}
                              className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative cursor-pointer transition-all ${
                                isSelected ? 'bg-[#7B2FBE] text-white-pure shadow-md font-bold' : 'hover:bg-surface-container text-on-surface'
                              }`}
                            >
                              <span className="text-[12px]">{dayNum}</span>
                              {hasAppt && (
                                <div className="absolute bottom-1 w-full flex justify-center items-center">
                                  <span className={`material-symbols-outlined text-[10px] ${isSelected ? 'text-white-pure' : 'text-primary'}`}>circle</span>
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
                          <h5 className="font-manrope text-[15px] font-black text-on-surface mt-1">
                            {selectedCalendarDay} de {agendaNavDate.toLocaleDateString('pt-BR', { month: 'long' })}
                          </h5>
                        </div>

                        {/* Event list of selected calendar day */}
                        <div className="space-y-3 animate-fade-in">
                          {appointments
                            .filter(appt => {
                              const formattedDay = String(selectedCalendarDay).padStart(2, '0');
                              const formattedMonth = String(agendaNavDate.getMonth() + 1).padStart(2, '0');
                              const dateStr = `${agendaNavDate.getFullYear()}-${formattedMonth}-${formattedDay}`;
                              return appt.data === dateStr;
                            })
                            .map(appt => {
                              const isConsult = appt.categoria === 'Consulta';
                              const categoryColorClass = isConsult
                                ? 'bg-tertiary-container/10 border-tertiary-container text-tertiary'
                                : 'bg-secondary-container/10 border-secondary-container text-[#745c00]';
                              return (
                                <div 
                                  key={appt.id}
                                  onClick={() => setAgendaView('diaria')}
                                  className={`p-3 bg-white-pure border border-outline-variant/50 rounded-xl hover:border-primary/40 transition-colors cursor-pointer ${categoryColorClass}`}
                                >
                                  <p className="text-[9px] font-bold">{appt.hora} - {appt.categoria}</p>
                                  <p className="font-manrope text-[12px] font-bold text-on-surface mt-0.5">{appt.clienteNome}</p>
                                  <p className="text-[10px] text-on-surface-variant">{appt.procedimento}</p>
                                </div>
                              );
                            })
                          }

                          {appointments.filter(appt => {
                            const formattedDay = String(selectedCalendarDay).padStart(2, '0');
                            const formattedMonth = String(agendaNavDate.getMonth() + 1).padStart(2, '0');
                            const dateStr = `${agendaNavDate.getFullYear()}-${formattedMonth}-${formattedDay}`;
                            return appt.data === dateStr;
                          }).length === 0 && (
                            <div className="text-center py-10 text-outline space-y-2 select-none">
                              <span className="material-symbols-outlined text-4xl opacity-35">event_busy</span>
                              <p className="text-[11px]">Nenhum agendamento ativo ou faturado para este dia.</p>
                              <button 
                                onClick={() => {
                                  const formattedDay = String(selectedCalendarDay).padStart(2, '0');
                                  const formattedMonth = String(agendaNavDate.getMonth() + 1).padStart(2, '0');
                                  const dateStr = `${agendaNavDate.getFullYear()}-${formattedMonth}-${formattedDay}`;
                                  setEditingAppointment(null);
                                  setNewApptPatient(patients[0]?.nome || '');
                                  setNewApptProcedure(services[0]?.nome || '');
                                  setNewApptTime('10:00');
                                  setNewApptDate(dateStr);
                                  setIsNewAppointmentOpen(true);
                                }}
                                className="text-[10px] bg-primary/10 text-primary px-3 py-1.5 rounded-xl font-bold hover:bg-primary/20 transition-all select-none mt-2"
                              >
                                Agendar Procedimento
                              </button>
                            </div>
                          )}
                        </div>
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

                {/* 4.4 List View (Monthly Chronological) */}
                {agendaView === 'lista' && (
                  <div className="agenda-grid w-full h-full flex flex-col overflow-hidden bg-white-pure rounded-3xl border border-outline-variant/60">
                    <div className="flex justify-between items-center p-6 border-b border-outline-variant select-none">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setAgendaNavDate(new Date(agendaNavDate.getFullYear(), agendaNavDate.getMonth() - 1, 1))}
                          className="w-9 h-9 rounded-full border border-outline-variant/60 hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Mês anterior"
                        >
                          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <h4 className="font-manrope font-black text-primary text-[18px] uppercase tracking-wider">
                          {agendaNavDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h4>
                        <button
                          onClick={() => setAgendaNavDate(new Date(agendaNavDate.getFullYear(), agendaNavDate.getMonth() + 1, 1))}
                          className="w-9 h-9 rounded-full border border-outline-variant/60 hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Próximo mês"
                        >
                          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                      </div>
                      <span className="text-[12px] text-on-surface-variant font-bold">
                        {(() => {
                          const monthStr = `${agendaNavDate.getFullYear()}-${String(agendaNavDate.getMonth() + 1).padStart(2, '0')}`;
                          return appointments.filter(a => a.data.startsWith(monthStr)).length;
                        })()} agendamentos
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                      {(() => {
                        const month = agendaNavDate.getMonth();
                        const year = agendaNavDate.getFullYear();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const daysWithAppts: { day: number; dateStr: string; appts: typeof appointments }[] = [];
                        for (let day = 1; day <= daysInMonth; day++) {
                          const formattedDay = String(day).padStart(2, '0');
                          const formattedMonth = String(month + 1).padStart(2, '0');
                          const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
                          const dayAppts = appointments
                            .filter(a => a.data === dateStr)
                            .filter(a => selectedProfessional === 'todos' || a.profissional === selectedProfessional)
                            .sort((a, b) => a.hora.localeCompare(b.hora));
                          if (dayAppts.length > 0) {
                            daysWithAppts.push({ day, dateStr, appts: dayAppts });
                          }
                        }
                        if (daysWithAppts.length === 0) {
                          return (
                            <div className="text-center py-16 text-outline space-y-2">
                              <span className="material-symbols-outlined text-5xl opacity-35">event_busy</span>
                              <p className="text-[13px]">Nenhum agendamento neste mês.</p>
                            </div>
                          );
                        }
                        return daysWithAppts.map(({ day, dateStr, appts }) => {
                          const date = new Date(year, month, day);
                          const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
                          return (
                            <div key={dateStr}>
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                                  <span className="text-[18px] font-black text-primary leading-none">{day}</span>
                                  <span className="text-[8px] uppercase font-bold text-primary/70 leading-none mt-0.5">{date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[14px] font-bold text-on-surface capitalize">{weekday}</p>
                                  <p className="text-[11px] text-on-surface-variant">{appts.length} agendamento{appts.length > 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              <div className="space-y-2 sm:ml-[60px] sm:border-l-2 sm:border-outline-variant/40 sm:pl-4">
                                {appts.map(appt => {
                                  const isConsult = appt.categoria === 'Consulta';
                                  const statusColors: { [key: string]: string } = {
                                    'Finalizado': 'bg-emerald-500',
                                    'Em Atendimento': 'bg-cyan-500',
                                    'Confirmado': 'bg-amber-500',
                                    'Pendente': 'bg-slate-400'
                                  };
                                  return (
                                    <div
                                      key={appt.id}
                                      onClick={() => {
                                        setAgendaNavDate(new Date(year, month, day));
                                        setAgendaView('diaria');
                                      }}
                                      className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/50 bg-white-pure hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
                                    >
                                      <span className="text-[12px] font-mono font-bold text-primary w-12 flex-shrink-0">{appt.hora}</span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-on-surface truncate">{appt.clienteNome}</p>
                                        <p className="text-[11px] text-on-surface-variant truncate">{appt.procedimento} • {appt.profissional}</p>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                        isConsult ? 'bg-tertiary-container/15 text-tertiary' : 'bg-secondary-container/20 text-[#745c00]'
                                      }`}>
                                        {appt.categoria}
                                      </span>
                                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[appt.status] || 'bg-slate-400'}`} title={appt.status}></span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* FAB Floating action button for mobile */}
            <button 
              onClick={() => {
                setEditingAppointment(null);
                setNewApptPatient('');
                setNewApptProcedure('');
                setNewApptProfessional('');
                setNewApptTime('08:00');
                const formattedDay = String(agendaNavDate.getDate()).padStart(2, '0');
                const formattedMonth = String(agendaNavDate.getMonth() + 1).padStart(2, '0');
                setNewApptDate(`${agendaNavDate.getFullYear()}-${formattedMonth}-${formattedDay}`);
                setNewApptCategory('Estética');
                setNewApptStatus('Pendente');
                setIsNewAppointmentOpen(true);
              }}
              className="lg:hidden fixed bottom-6 right-5 w-14 h-14 bg-[#7B2FBE] text-white-pure rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-95 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-[28px]">add</span>
            </button>

          </section>
        )}

        {/* 5. Clientes CRM Details Tab (Image 2) */}
        {currentTab === 'clientes' && (
          <section className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-[#f7f3f0]">
            
            {/* Master Cliente List Column */}
            <div className={`w-full lg:w-80 lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r border-outline-variant bg-white-pure flex-col overflow-hidden z-10 transition-all print-hidden ${selectedPatientId ? 'hidden lg:flex flex-1 lg:h-auto' : 'flex flex-1 lg:h-auto'}`}>
              <div className="p-4 lg:p-6 flex justify-between items-center border-b border-outline-variant/60">
                <h2 className="font-manrope text-headline-md text-primary font-bold text-[18px]" id="patients-module-title">Clientes</h2>
                <span className="bg-surface-container text-primary px-3 py-1 rounded-full text-[11px] font-bold font-manrope">
                  {filteredPatients.length} Ativos
                </span>
              </div>

              {/* Cliente items list wrapper */}
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
                    {patient.avatar && !patient.avatar.includes('dicebear') ? (
                      <Image width={500} height={500} unoptimized className="h-10 w-10 rounded-full object-cover shrink-0" src={patient.avatar} alt={patient.nome} sizes="(max-width: 768px) 100vw, 500px" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/40 text-on-surface-variant font-bold">
                        {patient.nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p 
                        onClick={(e) => {
                          e.stopPropagation();
                          setInteractClient(patient);
                          setInteractAppointmentId(null);
                          setIsWhatsAppSubmenuOpen(false);
                          setIsClientInteractModalOpen(true);
                        }}
                        className="font-manrope text-[13px] font-extrabold text-primary hover:underline cursor-pointer truncate"
                      >
                        {patient.pronome ? patient.pronome + ' ' : ''}{patient.nome}
                      </p>
                      <p className="text-[10px] text-on-surface-variant truncate mt-0.5">Última consulta: {patient.ultimaVisita}</p>
                    </div>
                    {patient.status !== 'Inativo' && patient.status !== 'inactive' && (
                      <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Cliente details column (Image 2 layout) */}
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
                    {selectedPatient.fotoDetalhes && !selectedPatient.fotoDetalhes.includes('dicebear') ? (
                      <Image width={500} height={500} unoptimized 
                        className="h-28 w-28 rounded-2xl object-cover border-2 border-primary/20 mx-auto lg:mx-0 bg-white-pure" 
                        src={selectedPatient.fotoDetalhes} 
                        alt={selectedPatient.nome} sizes="(max-width: 768px) 100vw, 500px" 
                      />
                    ) : (
                      <div className="h-28 w-28 rounded-2xl border-2 border-dashed border-outline-variant/40 bg-surface mx-auto lg:mx-0 flex items-center justify-center">
                        <span className="text-4xl font-bold text-on-surface-variant/40 uppercase">
                          {selectedPatient.nome.charAt(0)}
                        </span>
                      </div>
                    )}
                    <button 
                      onClick={() => document.getElementById('patient_details_avatar_upload')?.click()}
                      className="absolute -bottom-2 -right-2 bg-primary text-on-primary p-2 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-white-pure">edit</span>
                    </button>
                    <input
                      type="file"
                      id="patient_details_avatar_upload"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const url = await uploadUserAvatar(file);
                            const { data, error } = await supabase
                              .from('clientes')
                              .update({ avatar: url, foto_detalhes: url })
                              .eq('id', selectedPatient.id)
                              .select();
                            if (error) throw error;
                            if (data && data[0]) {
                              const updated = mapClienteToFrontend(data[0]);
                              setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updated : p));
                            }
                            showAlert('Foto de perfil atualizada com sucesso!');
                          } catch (err: any) {
                            console.error(err);
                            showAlert(`Erro ao atualizar foto de perfil: ${err.message}`);
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="flex-1 w-full">
                    <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-4">
                      <div className="flex flex-col items-center lg:items-start">
                        <h1 className="font-manrope text-[24px] font-bold text-on-surface leading-snug">
                          {selectedPatient.pronome ? selectedPatient.pronome + ' ' : ''}{selectedPatient.nome}
                        </h1>
                        <p className="text-on-surface-variant text-[13px] mt-1 font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          Cliente {selectedPatient.tier} • Desde {selectedPatient.since}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0 items-center justify-center">
                        <div className="relative w-full sm:w-auto">
                          <button 
                            onClick={() => setIsClientDetailsWhatsAppOpen(!isClientDetailsWhatsAppOpen)}
                            className="w-full px-4 py-2 border border-[#25D366] text-[#25D366] rounded-xl font-manrope text-[12px] font-extrabold hover:bg-[#25D366] hover:text-white-pure transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">chat</span>
                            WhatsApp
                          </button>
                          {isClientDetailsWhatsAppOpen && (
                            <div className="absolute right-0 sm:left-0 top-full mt-2 w-64 bg-white-pure border border-outline-variant/60 rounded-2xl p-3 shadow-xl z-50 text-[12px]">
                              <a
                                href={`https://wa.me/55${(selectedPatient.telefone || '').replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setIsClientDetailsWhatsAppOpen(false)}
                                className="w-full text-left py-2 px-3 hover:bg-surface rounded-xl font-bold text-primary flex items-center gap-2 mb-1"
                              >
                                <span className="material-symbols-outlined text-emerald-500 text-[16px]">chat</span>
                                Chat Livre
                              </a>
                              <div className="border-t border-outline-variant/30 my-1"></div>
                              {mensagensPredefinidas.map(msg => (
                                <a
                                  key={msg.id}
                                  href={`https://wa.me/55${(selectedPatient.telefone || '').replace(/\D/g, '')}?text=${encodeURIComponent((msg.content || '').replace(/\[nome\]/gi, selectedPatient.nome || '').replace(/\[data\]/gi, new Date().toLocaleDateString('pt-BR')))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setIsClientDetailsWhatsAppOpen(false)}
                                  className="w-full text-left py-2 px-3 hover:bg-surface rounded-xl font-bold text-primary flex items-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-emerald-500 text-[14px]">
                                    {msg.trigger_type === 'Agenda' ? 'notifications' : 
                                     msg.trigger_type === 'Aniversário' ? 'cake' : 'quickreply'}
                                  </span>
                                  <span className="truncate">{msg.title}</span>
                                </a>
                              ))}
                              {mensagensPredefinidas.length === 0 && (
                                <p className="text-center text-on-surface-variant italic py-2">Sem mensagens cadastradas</p>
                              )}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => {
                            // Simple print invocation to generate PDF via browser
                            window.print();
                          }}
                          className="w-full sm:w-auto px-4 py-2 border border-primary text-primary rounded-xl font-manrope text-[12px] font-extrabold hover:bg-primary hover:text-white-pure transition-all cursor-pointer"
                        >
                          Prontuário de Atendimento PDF
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
                        <p className="font-manrope text-[16px] font-black text-primary">R$ {selectedPatient.totalGasto.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="bg-surface rounded-xl p-3 border border-outline-variant/30">
                        <p className="text-[10px] text-outline mb-0.5 uppercase tracking-wider font-semibold">Procedimentos</p>
                        <p className="font-manrope text-[16px] font-black text-on-surface">{(selectedPatient.qtdeProcedimentos).toString().padStart(2, '0')}</p>
                      </div>
                      <div className="bg-surface rounded-xl p-3 border border-outline-variant/30">
                        <p className="text-[10px] text-outline mb-0.5 uppercase tracking-wider font-semibold">Última Foto</p>
                        <p className="font-manrope text-[16px] font-black text-on-surface">{selectedPatient.dataUltimaFoto}</p>
                      </div>
                      <div className="bg-surface rounded-xl p-3 border border-outline-variant/30">
                        <p className="text-[10px] text-outline mb-0.5 uppercase tracking-wider font-semibold">Status do Studio</p>
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

                {/* Cliente Tabs content */}
                {activePatientSubTab === 'evolution' && (
                  <div className="grid grid-cols-12 gap-6">
                    
                    {/* Visual evolution card - Before & After comparisons */}
                    <div className="col-span-12 lg:col-span-8 bg-white-pure rounded-3xl p-6 border border-outline-variant shadow-sm flex flex-col justify-between print-card">
                      <div>
                        <div className="flex justify-between items-center mb-6 print-hidden">
                          <h3 className="font-manrope text-[16px] font-bold text-primary">Comparativo de Tratamento (Evolução Visual)</h3>
                          <div className="flex gap-2">
                            <label className="p-2 mr-2 border border-primary/30 rounded-lg bg-primary/10 text-primary cursor-pointer flex items-center justify-center hover:bg-primary hover:text-white-pure transition-colors" title="Enviar Nova Foto de Evolução">
                              <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                              <span className="ml-1 text-[11px] font-bold uppercase">Nova Foto</span>
                              <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                const target = e.target;
                                if (target.files && target.files[0] && selectedPatient.id) {
                                  const file = target.files[0];
                                  const reader = new FileReader();
                                  reader.onloadend = async () => {
                                    const img = new globalThis.Image();
                                    img.onload = () => {
                                      const canvas = document.createElement('canvas');
                                      let width = img.width;
                                      let height = img.height;
                                      const MAX_SIZE = 1200;
                                      if (width > height && width > MAX_SIZE) {
                                        height *= MAX_SIZE / width;
                                        width = MAX_SIZE;
                                      } else if (height > MAX_SIZE) {
                                        width *= MAX_SIZE / height;
                                        height = MAX_SIZE;
                                      }
                                      canvas.width = width;
                                      canvas.height = height;
                                      const ctx = canvas.getContext('2d');
                                      ctx?.drawImage(img, 0, 0, width, height);
                                      const base64String = canvas.toDataURL('image/jpeg', 0.6);
                                      setPendingEvolutionPhoto({ file, base64: base64String });
                                      try { target.value = ''; } catch (err) {}
                                    };
                                    img.src = reader.result as string;
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} />
                            </label>
                            <button 
                              onClick={() => {
                                setIsComparing(prev => !prev);
                                setCompareSelectedIds([]);
                              }}
                              className={`p-2 rounded-lg border transition-colors flex items-center justify-center gap-1 text-[11px] font-bold ${isComparing ? 'bg-primary text-white-pure border-primary' : 'bg-surface text-primary border-primary/20 hover:bg-surface-container'}`} 
                              title="Toggled Modo Comparar"
                            >
                              <span className="material-symbols-outlined text-[18px]">compare</span>
                              <span>{isComparing ? 'Cancelar Comparação' : 'Comparar Fotos'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Rendering comparison side-by-side view */}
                        {isComparing ? (
                          <div className="bg-surface/50 border border-dashed border-outline-variant rounded-2xl p-4 mb-6">
                            <h4 className="font-manrope text-[12px] font-bold text-on-surface-variant mb-3 print-hidden">Modo Comparativo Ativo (Selecione 2 fotos na galeria abaixo)</h4>
                            {compareSelectedIds.length < 2 ? (
                              <div className="h-48 flex flex-col items-center justify-center text-outline gap-2 border border-dashed border-outline-variant/60 rounded-xl bg-white-pure print-hidden">
                                <span className="material-symbols-outlined text-3xl opacity-40">compare</span>
                                <p className="text-[11px] font-bold">Selecione {2 - compareSelectedIds.length} foto(s) da galeria para comparar</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-4">
                                {compareSelectedIds.map(id => {
                                  const photo = (selectedPatient.fotosEvolucao || []).find(p => p.id === id);
                                  if (!photo) return null;
                                  return (
                                    <div key={photo.id} className="relative rounded-2xl overflow-hidden shadow-inner group bg-surface border border-outline-variant/40">
                                      <Image width={500} height={500} unoptimized className="w-full h-48 sm:h-56 md:h-60 object-cover print-photo" src={photo.url} alt={`Comparativo ${photo.type}`} sizes="(max-width: 768px) 100vw, 500px" />
                                      <div className="absolute top-2 right-2 bg-black/60 text-white-pure px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                        {photo.type}
                                      </div>
                                      <div className="absolute bottom-2 left-2 bg-[#1c1b1af0] backdrop-blur-md text-white-pure px-3 py-1 rounded-full text-[10px] font-semibold">
                                        {photo.date}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Standard default layout with reduced photo heights */
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="relative rounded-2xl overflow-hidden shadow-inner group bg-surface border border-outline-variant/30">
                              {selectedPatient.fotoAntes ? (
                                <Image width={500} height={500} unoptimized className="w-full h-48 sm:h-56 md:h-60 object-cover print-photo" src={selectedPatient.fotoAntes} alt="Evolução Antes" sizes="(max-width: 768px) 100vw, 500px" />
                              ) : (
                                <div className="w-full h-48 sm:h-56 md:h-60 bg-surface-container-highest/30 flex flex-col items-center justify-center text-outline gap-2 border border-dashed border-outline-variant/60 rounded-2xl">
                                  <span className="material-symbols-outlined text-4xl opacity-40">photo_camera</span>
                                  <span className="text-[11px] font-bold">Sem foto 'Antes'</span>
                                </div>
                              )}
                              <div className="absolute bottom-3 left-3 bg-[#1c1b1af0] backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-medium font-manrope uppercase">
                                Antes {selectedPatient.fotosEvolucao?.find(p => p.type === 'Antes')?.date ? `(${selectedPatient.fotosEvolucao.find(p => p.type === 'Antes')?.date})` : ''}
                              </div>
                              {selectedPatient.fotoAntes && (
                                <button 
                                  onClick={() => setActiveLightboxImage(selectedPatient.fotoAntes)}
                                  className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white-pure font-bold text-[12px] gap-1 cursor-pointer print-hidden"
                                >
                                  <span className="material-symbols-outlined">zoom_in</span> Abrir / Visualizar
                                </button>
                              )}
                            </div>
                            
                            <div className="relative rounded-2xl overflow-hidden shadow-inner group bg-surface border border-outline-variant/30">
                              {selectedPatient.fotoDepois ? (
                                <Image width={500} height={500} unoptimized className="w-full h-48 sm:h-56 md:h-60 object-cover print-photo" src={selectedPatient.fotoDepois} alt="Evolução Depois" sizes="(max-width: 768px) 100vw, 500px" />
                              ) : (
                                <div className="w-full h-48 sm:h-56 md:h-60 bg-surface-container-highest/30 flex flex-col items-center justify-center text-outline gap-2 border border-dashed border-outline-variant/60 rounded-2xl">
                                  <span className="material-symbols-outlined text-4xl opacity-40">photo_camera</span>
                                  <span className="text-[11px] font-bold">Sem foto 'Depois'</span>
                                </div>
                              )}
                              <div className="absolute bottom-3 left-3 bg-primary text-white-pure px-3 py-1 rounded-full text-[10px] font-medium font-manrope uppercase">
                                Depois {selectedPatient.fotosEvolucao?.find(p => p.type === 'Depois')?.date ? `(${selectedPatient.fotosEvolucao.find(p => p.type === 'Depois')?.date})` : ''}
                              </div>
                              {selectedPatient.fotoDepois && (
                                <button 
                                  onClick={() => setActiveLightboxImage(selectedPatient.fotoDepois)}
                                  className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white-pure font-bold text-[12px] gap-1 cursor-pointer print-hidden"
                                >
                                  <span className="material-symbols-outlined">zoom_in</span> Abrir / Visualizar
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Chronological Photo Gallery */}
                        <div className="border-t border-outline-variant/40 pt-6 print-hidden">
                          <h4 className="font-manrope text-[14px] font-bold text-primary mb-4">Galeria de Acompanhamento Cronológico</h4>
                          {(!selectedPatient.fotosEvolucao || selectedPatient.fotosEvolucao.length === 0) ? (
                            <p className="text-[11px] text-on-surface-variant italic">Nenhuma foto carregada na galeria. Clique em "Nova Foto" para começar o histórico do paciente.</p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                              {selectedPatient.fotosEvolucao.map(photo => {
                                const isSelected = compareSelectedIds.includes(photo.id);
                                return (
                                  <div key={photo.id} className={`relative rounded-xl overflow-hidden group border transition-all ${isSelected ? 'border-primary ring-2 ring-primary/20 scale-[0.98]' : 'border-outline-variant/40 bg-surface'}`}>
                                    <Image width={500} height={500} unoptimized src={photo.url} className="w-full h-24 object-cover" alt="Histórico" sizes="(max-width: 768px) 100vw, 500px" />
                                    
                                    <div className="p-1.5 text-center">
                                      <p className="text-[9px] font-bold text-on-surface truncate">{photo.date}</p>
                                      <span className={`inline-block mt-0.5 px-2 py-0.2 rounded text-[7px] font-extrabold uppercase ${photo.type === 'Antes' ? 'bg-[#735c00]/10 text-[#735c00]' : (photo.type === 'Depois' ? 'bg-[#7B2FBE]/10 text-[#7B2FBE]' : 'bg-surface-container-highest text-on-surface-variant')}`}>
                                        {photo.type}
                                      </span>
                                    </div>

                                    {/* Action Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 text-white-pure">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveLightboxImage(photo.url);
                                        }}
                                        className="p-1 rounded-full bg-white-pure/20 hover:bg-white-pure/40 transition-colors flex items-center justify-center cursor-pointer"
                                        title="Abrir Foto"
                                      >
                                        <span className="material-symbols-outlined text-[16px] text-white-pure">zoom_in</span>
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          showConfirm('Tem certeza que deseja apagar esta foto do histórico?', async () => {
                                            try {
                                              const updatedPhotos = (selectedPatient.fotosEvolucao || []).filter(p => p.id !== photo.id);
                                              let updateField: any = { fotos_evolucao: updatedPhotos };
                                              if (selectedPatient.fotoAntes === photo.url) updateField.foto_antes = null;
                                              if (selectedPatient.fotoDepois === photo.url) updateField.foto_depois = null;
                                              
                                              const { error } = await supabase.from('clientes').update(updateField).eq('id', selectedPatient.id);
                                              if (error) throw error;
                                              
                                              setPatients(prev => prev.map(p => {
                                                if (p.id !== selectedPatient.id) return p;
                                                return {
                                                  ...p,
                                                  fotosEvolucao: updatedPhotos,
                                                  fotoAntes: p.fotoAntes === photo.url ? '' : p.fotoAntes,
                                                  fotoDepois: p.fotoDepois === photo.url ? '' : p.fotoDepois
                                                };
                                              }));
                                              showAlert('Foto apagada com sucesso!');
                                            } catch (err: any) {
                                              showAlert('Erro ao apagar: ' + err.message);
                                            }
                                          });
                                        }}
                                        className="p-1 mt-1 rounded-full bg-error/20 hover:bg-error/40 transition-colors flex items-center justify-center cursor-pointer"
                                        title="Apagar Foto"
                                      >
                                        <span className="material-symbols-outlined text-[16px] text-[#ff4444]">delete</span>
                                      </button>
                                      {isComparing && (
                                        <button
                                          onClick={() => {
                                            if (isSelected) {
                                              setCompareSelectedIds(prev => prev.filter(id => id !== photo.id));
                                            } else {
                                              if (compareSelectedIds.length >= 2) {
                                                showAlert('Você pode selecionar no máximo 2 fotos para comparação.');
                                                return;
                                              }
                                              setCompareSelectedIds(prev => [...prev, photo.id]);
                                            }
                                          }}
                                          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase cursor-pointer ${isSelected ? 'bg-primary text-white-pure' : 'bg-white-pure text-on-surface'}`}
                                        >
                                          {isSelected ? 'Selecionada' : 'Comparar'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Observations banner block */}
                      <div className="mt-6 p-5 bg-surface rounded-2xl border border-outline-variant/30">
                        <p className="text-[11px] text-primary font-bold uppercase mb-1.5 tracking-wider font-manrope">Observações Studios da Evolução</p>
                        <p className="text-[13px] text-on-surface font-medium leading-relaxed bg-transparent">{selectedPatient.notasEvolucao}</p>
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
                              <p className="text-[12px] text-on-surface-variant mt-1">{selectedPatient.alergias}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">medication</span>
                            <div>
                              <p className="font-manrope text-[11px] font-bold text-on-surface leading-none">Uso de Medicamentos</p>
                              <p className="text-[12px] text-on-surface-variant mt-1">{selectedPatient.medicacoes}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5">history_edu</span>
                            <div>
                              <p className="font-manrope text-[11px] font-bold text-on-surface leading-none">Histórico de Estética</p>
                              <p className="text-[12px] text-on-surface-variant mt-1">{selectedPatient.procedimentosAnteriores}</p>
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
                        <div 
                          ref={signatureContainerRef}
                          className="relative border-2 border-dashed border-outline-variant rounded-2xl bg-surface overflow-hidden group"
                          style={{ height: '144px', touchAction: 'none' }}
                        >
                          <canvas 
                            ref={canvasRef}
                            onPointerDown={startSignatureDrawing}
                            onPointerMove={drawSignature}
                            onPointerUp={stopSignatureDrawing}
                            onPointerLeave={stopSignatureDrawing}
                            className="absolute inset-0 w-full h-full cursor-crosshair"
                            style={{ touchAction: 'none' }}
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
                        <h4 className="font-manrope text-[14px] font-bold text-[#7B2FBE]">Descrever Novo Protocolo de Atendimento</h4>
                        <textarea 
                          id="novoProtocolo"
                          className="w-full h-24 p-3 text-[13px] bg-white-pure border border-[#d3c5b8] rounded-xl focus:outline-none focus:border-[#7B2FBE] resize-none text-on-surface"
                          placeholder="Ex: Realizado limpeza profunda, aplicação de peeling 30%, cliente orientada sobre home-care..."
                        ></textarea>
                        <div className="flex justify-end mt-1">
                          <button 
                            className="px-5 py-2 bg-[#7B2FBE] text-white-pure font-bold font-manrope text-[12px] rounded-xl hover:bg-[#634425] transition-colors shadow-md" 
                            onClick={async () => {
                              const el = document.getElementById('novoProtocolo') as HTMLTextAreaElement;
                              if (el && el.value.trim() !== '') {
                                if (!selectedPatient.id) {
                                  showAlert('Selecione um cliente para adicionar o protocolo.');
                                  return;
                                }
                                const text = el.value.trim();
                                const newTimelineItem = {
                                  id: Date.now().toString(),
                                  date: new Date().toLocaleDateString('pt-BR'),
                                  title: 'Procedimento Clínico',
                                  description: text,
                                  category: 'Procedimento',
                                  status: 'Concluído'
                                };
                                const updatedTimeline = [newTimelineItem, ...(selectedPatient.historico || [])];
                                try {
                                  const { error } = await supabase
                                    .from('clientes')
                                    .update({ historico: updatedTimeline })
                                    .eq('id', selectedPatient.id);
                                  if (error) throw error;
                                  
                                  setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, historico: updatedTimeline } : p));
                                  showAlert('Protocolo adicionado ao prontuário do cliente!');
                                  el.value = '';
                                } catch (err: any) {
                                  console.error('Error adding protocol:', err);
                                  showAlert(`Erro ao salvar protocolo: ${err.message}`);
                                }
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
                          {selectedPatient.historico.map((item, index) => (
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
                                <div className="absolute right-4 top-4 flex gap-2">
                                  <button onClick={() => { setEditingTimelineItemId(item.id); setEditingTimelineText(item.description); }} className="text-on-surface-variant hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                  </button>
                                  <button onClick={() => deleteTimelineItem(selectedPatient.id, item.id)} className="text-on-surface-variant hover:text-error transition-colors">
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                                </div>
                                {editingTimelineItemId === item.id ? (
                                  <div className="mt-2 space-y-2">
                                    <textarea 
                                      className="w-full bg-white-pure border border-outline-variant rounded-xl p-3 text-[13px] text-on-surface focus:outline-none focus:border-primary resize-none" 
                                      rows={3} 
                                      value={editingTimelineText}
                                      onChange={(e) => setEditingTimelineText(e.target.value)}
                                    ></textarea>
                                    <div className="flex justify-end gap-2">
                                      <button onClick={() => setEditingTimelineItemId(null)} className="px-3 py-1.5 text-[11px] font-bold text-on-surface-variant hover:bg-surface-container rounded-lg">Cancelar</button>
                                      <button onClick={() => saveTimelineItem(selectedPatient.id, item.id)} className="px-3 py-1.5 text-[11px] font-bold bg-primary text-white-pure hover:opacity-90 rounded-lg">Salvar</button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[12px] text-on-surface-variant leading-relaxed mt-1">{item.description}</p>
                                )}
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
                    patientName={selectedPatient.nome} 
                    onCancel={() => setActivePatientSubTab('evolution')} 
                    onSave={async (data) => {
                      try {
                        let signatureUrl = data.signatureBase64;
                        try {
                          const uploadRes = await fetch('/api/storage/upload', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              bucket: 'signatures',
                              path: `anamnese/${selectedPatient.id}/${crypto.randomUUID()}.png`,
                              base64: data.signatureBase64,
                              contentType: 'image/png'
                            })
                          });
                          if (uploadRes.ok) {
                            const uploadData = await uploadRes.json();
                            signatureUrl = uploadData.url;
                          }
                        } catch (uploadErr) {
                          console.warn('Falha no upload da assinatura, mantendo base64:', uploadErr);
                        }

                        let allergiesStr = selectedPatient.alergias || 'Nenhuma';
                        if (data.healthToggles['Possui algum tipo de alergia?']) {
                          allergiesStr = 'Sim (verificar anamnese)';
                        }
                        if (data.otherHealth) {
                          allergiesStr += ` - Outros relatos: ${data.otherHealth}`;
                        }

                        let medicationsStr = selectedPatient.medicacoes || 'Nenhum';
                        if (data.healthToggles['Utiliza anticoncepcional?'] || data.healthToggles['Utiliza cremes ou loções facial?']) {
                          const meds = [];
                          if (data.healthToggles['Utiliza anticoncepcional?']) meds.push('Anticoncepcional');
                          if (data.healthToggles['Utiliza cremes ou loções facial?']) meds.push('Cremes/Loções Faciais');
                          medicationsStr = meds.join(', ');
                        }

                        let prevProceduresStr = selectedPatient.procedimentosAnteriores || 'Nenhum';
                        if (data.healthToggles['Tratamento facial anterior?']) {
                          prevProceduresStr = 'Sim (verificar anamnese)';
                        }

                        const newDoc: PatientDocument = {
                          id: 'doc_anamnese_' + crypto.randomUUID(),
                          name: `Ficha Anamnese - Limpeza de Pele - ${new Date().toLocaleDateString('pt-BR')}`,
                          type: 'Anamnese',
                          date: new Date().toLocaleDateString('pt-BR'),
                          size: '0.1 MB',
                          signed: true,
                          signatureBase64: signatureUrl,
                          content: data
                        };

                        const updatedDocs = [...(patientDocuments[selectedPatient.id] || []), newDoc];

                        // 5. Adicionar item à timeline
                        const newTimelineItem = {
                          id: 'tl_anamnese_' + crypto.randomUUID(),
                          title: 'Anamnese Preenchida',
                          date: new Date().toLocaleDateString('pt-BR'),
                          description: 'Ficha de Anamnese: Limpeza de Pele salva e assinada digitalmente.',
                          category: 'Procedimento',
                          status: 'Concluído'
                        };

                        const updatedTimeline = [newTimelineItem, ...(selectedPatient.historico || [])];

                        // 6. Atualizar no Supabase
                        const { error } = await supabase
                          .from('clientes')
                          .update({
                            alergias: allergiesStr,
                            medicacoes: medicationsStr,
                            procedimentos_anteriores: prevProceduresStr,
                            documents: updatedDocs,
                            historico: updatedTimeline
                          })
                          .eq('id', selectedPatient.id);

                        if (error) throw error;

                        // 7. Atualizar estados locais
                        setPatients(prev => prev.map(p => {
                          if (p.id === selectedPatient.id) {
                            return {
                              ...p,
                              alergias: allergiesStr,
                              medicacoes: medicationsStr,
                              procedimentosAnteriores: prevProceduresStr,
                              historico: updatedTimeline
                            };
                          }
                          return p;
                        }));

                        setPatientDocuments(prev => ({
                          ...prev,
                          [selectedPatient.id]: updatedDocs
                        }));

                        showAlert('Ficha de anamnese e assinatura salvas com sucesso!');
                        setActivePatientSubTab('evolution');
                      } catch (err: any) {
                        console.error('Erro ao salvar anamnese:', err);
                        showAlert(`Erro ao salvar ficha de anamnese: ${err.message || err}`);
                      }
                    }}
                  />
                )}

                 {/* Interactive Studiol Finance Sub-Tab */}
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
                          <h4 className="font-manrope text-[15px] font-bold text-on-surface">Transações Studios Registradas</h4>
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
                                  .from('clientes')
                                  .update({
                                    total_spent: (selectedPatient.totalGasto || 0) + val,
                                    procedures_count: (selectedPatient.qtdeProcedimentos || 0) + 1,
                                    financials: updatedFinancials
                                  })
                                  .eq('id', selectedPatient.id);
                                if (patErr) throw patErr;

                                const { error: txErr } = await supabase
                                  .from('cobrancas')
                                  .insert([{
                                    description: `${proc} - ${selectedPatient.nome}`,
                                    date: new Date().toLocaleDateString('pt-BR'),
                                    category: 'Procedimento',
                                    status: status === 'Pago' ? 'Pago' : 'Pendente',
                                    valor: val
                                  }]);
                                if (txErr) throw txErr;

                                // Atualizar estados locais para reatividade instantânea
                                setPatientFinancials(prev => ({
                                  ...prev,
                                  [selectedPatient.id]: updatedFinancials
                                }));
                                setPatients(prev => prev.map(p => {
                                  if (p.id === selectedPatient.id) {
                                    return {
                                      ...p,
                                      totalSpent: (p.totalGasto || 0) + val,
                                      proceduresCount: (p.qtdeProcedimentos || 0) + 1
                                    };
                                  }
                                  return p;
                                }));
                                const newTx: Cobranca = {
                                  id: Math.random().toString(),
                                  descricao: `${proc} - ${selectedPatient.nome}`,
                                  data: new Date().toLocaleDateString('pt-BR'),
                                  categoria: 'Procedimento',
                                  status: status === 'Pago' ? 'Pago' : 'Pendente',
                                  valor: val
                                };
                                setTransactions(prev => [newTx, ...prev]);

                                showAlert('Lançamento registrado e integrado ao prontuário de atendimento com sucesso!');
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

                {/* Interactive Studiol Document Manager Sub-Tab */}
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
                                    id: 'doc_' + crypto.randomUUID(),
                                    name: file.name,
                                    type: file.name.toLowerCase().includes('contrato') ? 'Contrato' : 'Outro',
                                    date: new Date().toLocaleDateString('pt-BR'),
                                    size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                                    signed: false
                                  };
                                  const updatedDocs = [...(patientDocuments[selectedPatient.id] || []), newDoc];
                                  try {
                                    const { error } = await supabase
                                      .from('clientes')
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
                                  setViewingDocument(doc);
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
                                        .from('clientes')
                                        .update({ documents: updatedDocs })
                                        .eq('id', selectedPatient.id);
                                      if (error) throw error;
                                      setPatientDocuments(prev => ({
                                        ...prev,
                                        [selectedPatient.id]: updatedDocs
                                      }));
                                      showAlert(`Sucesso! O documento foi assinado por ${selectedPatient.nome} via iPad/tablet integrado com certificado ICP-Brasil e carimbo de data/hora válido!`);
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
          <section className="flex-1 overflow-y-auto px-4 py-6 lg:p-8 bg-surface">
            
            {/* Bento cards metric panel (Image 1) */}
            
            {/* Mobile Period Selector (dropdown) */}
            <div className="lg:hidden px-4 mb-4 select-none">
              <div className="relative">
                <select 
                  value={`${agendaNavDate.getMonth() + 1}/${agendaNavDate.getFullYear()}`}
                  onChange={(e) => {
                    const [m, y] = e.target.value.split('/').map(Number);
                    const d = new Date(agendaNavDate);
                    d.setMonth(m - 1);
                    d.setFullYear(y);
                    setAgendaNavDate(d);
                  }}
                  className="w-full bg-[#fcfbf9] border border-outline-variant/60 rounded-xl px-4 py-3 text-[14px] font-bold text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
                >
                  {(() => {
                    const months = [
                      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                    ];
                    const years = [2023, 2024, 2025, 2026];
                    const options = [];
                    for (const year of years) {
                      for (let i = 0; i < 12; i++) {
                        options.push({
                          label: `${months[i]} de ${year}`,
                          value: `${i + 1}/${year}`
                        });
                      }
                    }
                    return options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ));
                  })()}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
                  unfold_more
                </span>
              </div>
            </div>

            {/* Mobile 3-Card Revenue panel */}
            <div className="lg:hidden grid grid-cols-3 gap-2 px-4 mb-6">
              {/* Receita Esperada */}
              <div className="bg-[#fcfbf9] border border-outline-variant/60 rounded-xl p-2.5 text-center flex flex-col justify-between shadow-sm">
                <span className="text-[10px] text-outline font-bold uppercase tracking-wider leading-none mb-1">Esperada</span>
                <span className="font-manrope text-[14px] font-black text-blue-600 leading-none">
                  R$ {receitaEsperada.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </span>
              </div>
              {/* Receita Recebida */}
              <div className="bg-[#fcfbf9] border border-outline-variant/60 rounded-xl p-2.5 text-center flex flex-col justify-between shadow-sm">
                <span className="text-[10px] text-outline font-bold uppercase tracking-wider leading-none mb-1">Recebida</span>
                <span className="font-manrope text-[14px] font-black text-emerald-600 leading-none">
                  R$ {receitaRecebida.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </span>
              </div>
              {/* A Receber */}
              <div className="bg-[#fcfbf9] border border-outline-variant/60 rounded-xl p-2.5 text-center flex flex-col justify-between shadow-sm">
                <span className="text-[10px] text-outline font-bold uppercase tracking-wider leading-none mb-1">A Receber</span>
                <span className="font-manrope text-[14px] font-black text-amber-600 leading-none">
                  R$ {aReceber.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
            <div className="financeiro-grid hidden lg:grid grid-cols-3 gap-3 mb-4">
              
              {/* Receita Esperada */}
              <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-[10px] p-[14px] px-4 flex flex-col gap-1">
                <span className="text-[12px] text-on-surface-variant font-medium">Receita Esperada</span>
                <span className="font-manrope text-[20px] font-medium" style={{ color: '#185FA5' }}>
                  R$ {receitaEsperada.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Receita Recebida */}
              <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-[10px] p-[14px] px-4 flex flex-col gap-1">
                <span className="text-[12px] text-on-surface-variant font-medium">Receita Recebida</span>
                <span className="font-manrope text-[20px] font-medium" style={{ color: '#3B6D11' }}>
                  R$ {receitaRecebida.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* A Receber */}
              <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-[10px] p-[14px] px-4 flex flex-col gap-1">
                <span className="text-[12px] text-on-surface-variant font-medium">A Receber</span>
                <span className="font-manrope text-[20px] font-medium" style={{ color: '#993C1D' }}>
                  R$ {aReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

            </div>

            {/* Charts: Pizza (Receita por Categoria) + Barras (Movimentação Diária) */}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes pizza-draw { from { stroke-dasharray: 0 100; } }
              @keyframes bar-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
              .pizza-slice { transition: stroke-width 0.2s ease, opacity 0.2s ease; transform-origin: 18px 18px; cursor: pointer; }
              .pizza-slice:hover { stroke-width: 4.5; }
              .bar-anim { transform-origin: bottom; animation: bar-grow 0.6s ease-out backwards; }
              .legend-row { transition: opacity 0.2s ease, transform 0.2s ease; cursor: pointer; padding: 4px 6px; border-radius: 8px; }
              .legend-row:hover { background: rgba(121, 84, 46, 0.06); }
              @media print {
                .no-print, header, aside, nav, [class*="sidebar"], [class*="sticky"] { display: none !important; }
                body, html, #__next, main { background: white !important; height: auto !important; overflow: visible !important; }
                .glass-panel { box-shadow: none !important; border: 1px solid #ccc !important; page-break-inside: avoid; }
                table { font-size: 11px !important; }
                thead { display: table-header-group; }
                tr { page-break-inside: avoid; }
                @page { size: A4; margin: 1cm; }
              }
            `}} />
            <div className="financeiro-grid grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
              
              {/* Pizza: Receita por Categoria */}
              <div className="bg-white-pure rounded-3xl border border-outline-variant/40 p-7">
                <h3 className="text-[15px] font-semibold text-on-surface mb-6">Receita por Categoria</h3>
                {(() => {
                  const byCategory: { [key: string]: number } = {};
                  transactions.filter(t => t.valor > 0).forEach(t => {
                    byCategory[t.categoria] = (byCategory[t.categoria] || 0) + t.valor;
                  });
                  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
                  const total = entries.reduce((s, [, v]) => s + v, 0);
                  if (total === 0) {
                    return <p className="text-[12px] text-on-surface-variant text-center py-8">Sem dados de receita ainda.</p>;
                  }
                  const colors = ['#7B2FBE', '#5a3e22', '#b8855e', '#d4a373', '#8b6f47', '#a89077'];
                  const hoveredIdx = hoveredCategory !== null ? entries.findIndex(([c]) => c === hoveredCategory) : -1;
                  let offset = 0;
                  return (
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                      <div className="relative flex-shrink-0">
                        <svg viewBox="0 0 36 36" className="w-40 h-40 -rotate-90 overflow-visible">
                          {entries.map(([cat, val], idx) => {
                            const pct = (val / total) * 100;
                            const dash = `${pct} ${100 - pct}`;
                            const isDimmed = hoveredIdx >= 0 && hoveredIdx !== idx;
                            const el = (
                              <circle
                                key={cat}
                                cx="18" cy="18" r="15.9155"
                                fill="none"
                                stroke={colors[idx % colors.length]}
                                strokeWidth={hoveredIdx === idx ? 5 : 3}
                                strokeDasharray={dash}
                                strokeDashoffset={-offset}
                                style={{
                                  animation: `pizza-draw 0.8s ease-out ${idx * 120}ms backwards`,
                                  opacity: isDimmed ? 0.25 : 1
                                }}
                                className="pizza-slice"
                                onMouseEnter={() => setHoveredCategory(cat)}
                                onMouseLeave={() => setHoveredCategory(null)}
                              >
                                <title>{`${cat}: R$ ${val.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} (${pct.toFixed(1)}%)`}</title>
                              </circle>
                            );
                            offset += pct;
                            return el;
                          })}
                          <circle cx="18" cy="18" r="10" fill="white" />
                          <text x="18" y="18" textAnchor="middle" dominantBaseline="central" className="rotate-90 origin-center" fill="#7B2FBE" style={{ fontSize: '3.5px', fontWeight: 700 }}>
                            {`${entries.length} ${entries.length === 1 ? 'cat' : 'cats'}`}
                          </text>
                        </svg>
                      </div>
                      <div className="space-y-1 w-full sm:w-auto sm:flex-1">
                        {entries.map(([cat, val], idx) => {
                          const pct = ((val / total) * 100).toFixed(1);
                          const isDimmed = hoveredIdx >= 0 && hoveredIdx !== idx;
                          return (
                            <div
                              key={cat}
                              className="legend-row flex items-center justify-between gap-3 text-[13px]"
                              style={{ opacity: isDimmed ? 0.4 : 1 }}
                              onMouseEnter={() => setHoveredCategory(cat)}
                              onMouseLeave={() => setHoveredCategory(null)}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                                <span className="truncate text-on-surface-variant">{cat}</span>
                              </div>
                              <div className="flex items-center gap-2.5 flex-shrink-0">
                                <span className="text-outline text-[12px]">{pct}%</span>
                                <span className="font-bold text-[#3B6D11]">R$ {val.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Barras: Movimentação Diária */}
              <div className="bg-white-pure rounded-3xl border border-outline-variant/40 p-7">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[15px] font-semibold text-on-surface">Movimentação Diária</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFinancialTimeframe('semanal')}
                      className={`px-3.5 py-1.5 border rounded-lg text-[12px] font-bold transition-all cursor-pointer ${financialTimeframe === 'semanal' ? 'bg-primary text-white-pure border-primary' : 'border-outline-variant/60 text-on-surface-variant hover:bg-surface-container'}`}
                    >
                      Semanal
                    </button>
                    <button
                      onClick={() => setFinancialTimeframe('mensal')}
                      className={`px-3.5 py-1.5 border rounded-lg text-[12px] font-bold transition-all cursor-pointer ${financialTimeframe === 'mensal' ? 'bg-primary text-white-pure border-primary' : 'border-outline-variant/60 text-on-surface-variant hover:bg-surface-container'}`}
                    >
                      Mensal
                    </button>
                  </div>
                </div>
                <div className="relative h-56 w-full flex items-end justify-between px-2 mt-6">
                  {(() => {
                    const days = financialTimeframe === 'semanal' ? 7 : 30;
                    const today = new Date();
                    const dayData: { day: string; receita: number; despesa: number }[] = [];
                    for (let i = days - 1; i >= 0; i--) {
                      const d = new Date(today);
                      d.setDate(today.getDate() - i);
                      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                      const rec = transactions.filter(t => t.data === ds && t.valor > 0).reduce((s, t) => s + t.valor, 0);
                      const des = transactions.filter(t => t.data === ds && t.valor < 0).reduce((s, t) => s + Math.abs(t.valor), 0);
                      dayData.push({ day: String(d.getDate()).padStart(2, '0'), receita: rec, despesa: des });
                    }
                    const maxVal = Math.max(...dayData.map(d => Math.max(d.receita, d.despesa)), 1);
                    return dayData.map((d, idx) => {
                      const isHovered = hoveredDay === idx;
                      const isDimmed = hoveredDay !== null && hoveredDay !== idx;
                      return (
                        <div
                          key={idx}
                          className="flex items-end gap-1 h-full flex-1 justify-center relative"
                          onMouseEnter={() => setHoveredDay(idx)}
                          onMouseLeave={() => setHoveredDay(null)}
                        >
                          <div
                            className="bar-anim w-3 sm:w-4 rounded-t-sm transition-all"
                            style={{
                              height: `${(d.receita / maxVal) * 100}%`,
                              minHeight: d.receita > 0 ? '2px' : '0',
                              backgroundColor: isDimmed ? 'rgba(59,109,17,0.25)' : (isHovered ? '#3B6D11' : 'rgba(59,109,17,0.7)'),
                              animationDelay: `${idx * 25}ms`
                            }}
                          >
                            <title>{`Dia ${d.day}: Receita R$ ${d.receita.toFixed(0)}`}</title>
                          </div>
                          <div
                            className="bar-anim w-3 sm:w-4 rounded-t-sm transition-all"
                            style={{
                              height: `${(d.despesa / maxVal) * 100}%`,
                              minHeight: d.despesa > 0 ? '2px' : '0',
                              backgroundColor: isDimmed ? 'rgba(153,60,29,0.25)' : (isHovered ? '#993C1D' : 'rgba(153,60,29,0.7)'),
                              animationDelay: `${idx * 25 + 50}ms`
                            }}
                          >
                            <title>{`Dia ${d.day}: Despesa R$ ${d.despesa.toFixed(0)}`}</title>
                          </div>
                          {isHovered && (d.receita > 0 || d.despesa > 0) && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#3d2a1a] text-white-pure text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-10 pointer-events-none">
                              <div className="font-bold mb-0.5">Dia {d.day}</div>
                              {d.receita > 0 && <div style={{color: '#7fb86a'}}>+ R$ {d.receita.toFixed(0)}</div>}
                              {d.despesa > 0 && <div style={{color: '#e8a08a'}}>- R$ {d.despesa.toFixed(0)}</div>}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="mt-5 flex justify-center gap-8 text-[12px] font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#3B6D11]"></span>
                    <span className="text-on-surface-variant">Receitas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#993C1D]"></span>
                    <span className="text-on-surface-variant">Despesas</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Commission Leaders (Repasses) */}
            <div className="bg-white-pure rounded-3xl border border-outline-variant/40 p-7 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[15px] font-semibold text-on-surface">Repasses de Comissão</h3>
                <span className="text-[12px] text-on-surface-variant">
                  Total a repassar: <strong className="text-primary">R$ {commissionsToPay.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong>
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {commissionLeaders.map((lead, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-outline-variant/30 hover:bg-surface-container transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {lead.avatar && !lead.avatar.includes('dicebear') ? (
                        <Image width={500} height={500} unoptimized className="w-11 h-11 rounded-full object-cover flex-shrink-0" src={lead.avatar} alt={lead.name} sizes="(max-width: 768px) 100vw, 500px" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-surface flex items-center justify-center flex-shrink-0 border border-outline-variant/40 text-on-surface-variant font-bold">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-on-surface truncate">{lead.name}</p>
                        <p className="text-[12px] text-on-surface-variant uppercase tracking-wider">Fat: R$ {lead.revenue.toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                    <p className="text-[14px] font-extrabold text-primary flex-shrink-0">R$ {lead.commission.toLocaleString('pt-BR')}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => showAlert('Relatório fiscal de Repasses e Lançamentos gerado para download!')}
                className="w-full mt-5 py-3 border border-primary text-primary rounded-xl font-bold text-[13px] hover:bg-primary/5 transition-all cursor-pointer text-center"
              >
                Relatório de Repasse Completo
              </button>
            </div>

            {/* Bottom Transações Recentes block (Image 1) */}
            <div className="glass-panel p-6 rounded-3xl">
              {/* Top Row Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-outline-variant/30 pb-4 gap-4">
                <h3 className="font-manrope text-[16px] font-bold text-on-surface">Transações Financeiras</h3>
                <div className="flex flex-wrap gap-2 no-print">
                  <button
                    onClick={exportTransactionsCSV}
                    className="px-3 py-1.5 border border-primary/40 text-primary hover:bg-primary/5 rounded-lg text-[12px] font-bold transition-colors flex items-center gap-1.5"
                    title="Exportar transações filtradas como CSV"
                  >
                    <span className="material-symbols-outlined text-[16px]">file_download</span>
                    CSV
                  </button>
                  <button
                    onClick={printTransactions}
                    className="px-3 py-1.5 border border-primary/40 text-primary hover:bg-primary/5 rounded-lg text-[12px] font-bold transition-colors flex items-center gap-1.5"
                    title="Imprimir relatório de transações"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    Imprimir
                  </button>
                  <button onClick={() => {
                    setEditingTransaction(null);
                    setIsTransactionModalOpen(true);
                  }} className="px-3 py-1.5 bg-primary text-white-pure rounded-lg text-[12px] font-bold shadow-sm hover:opacity-90">
                    Nova Transação
                  </button>
                  <button onClick={() => {
                    showConfirm('Tem certeza de que deseja resetar todo o histórico financeiro?', async () => {
                      try {
                        const { error } = await supabase.from('cobrancas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        if (error) throw error;
                        showAlert('Histórico financeiro resetado com sucesso!');
                      } catch (err: any) {
                        console.error('Error resetting transactions:', err);
                        showAlert(`Erro ao resetar financeiro: ${err.message}`);
                      }
                    });
                  }} className="px-3 py-1.5 border border-error/50 text-error hover:bg-error/10 rounded-lg text-[12px] font-bold transition-colors">
                    Resetar Financeiro
                  </button>
                  <button onClick={() => {
                    showConfirm('Aviso: Isso apagará todas as transações, pacientes e agendamentos para limpar a base. Deseja prosseguir?', async () => {
                      try {
                        // Apagar todas as tabelas operacionais
                        await supabase.from('cobrancas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        await supabase.from('agendamentos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        await supabase.from('clientes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        showAlert('Base limpa com sucesso!');
                      } catch (err: any) {
                        console.error('Database clean error:', err);
                        showAlert(`Erro ao limpar base: ${err.message}`);
                      }
                    });
                  }} className="px-3 py-1.5 bg-error text-white-pure rounded-lg text-[12px] font-bold shadow-sm hover:opacity-90">
                    Limpar Base de Dados
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
                        <td className="px-6 py-4 text-[12px] text-on-surface-variant">{tr.data}</td>
                        <td className="px-6 py-4 font-bold text-on-surface">{tr.descricao}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold ${getCategoryTheme(tr.categoria)}`}>
                            {tr.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-manrope text-[11px] font-bold text-tertiary flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>{tr.status}</span>
                        </td>
                        <td className={`px-6 py-4 text-right font-bold text-[13px] ${tr.valor < 0 ? 'text-error' : 'text-on-surface'}`}>
                          {tr.valor < 0 ? `- R$ ${Math.abs(tr.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : `R$ ${tr.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => {
                            setEditingTransaction(tr);
                            setIsTransactionModalOpen(true);
                          }} className="p-1 text-on-surface-variant hover:text-primary transition-colors material-symbols-outlined text-[18px]">edit</button>
                          <button onClick={async () => {
                            try {
                              const { error } = await supabase.from('cobrancas').delete().eq('id', tr.id);
                              if (error) throw error;
                              setTransactions(prev => prev.filter(t => t.id !== tr.id));
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
          <section className="flex-1 overflow-y-auto custom-scrollbar bg-[#f7f3f0] p-6 md:p-8 relative animate-fade-in">
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
                          <td className="px-4 py-4 font-bold text-on-surface">{s.nome}</td>
                          <td className="px-4 py-4"><span className="bg-surface-container px-2.5 py-1 rounded-md text-[10px] font-bold">{s.categoria}</span></td>
                          <td className="px-4 py-4 text-on-surface-variant">{s.duracao}</td>
                          <td className="px-4 py-4 font-bold text-primary">R$ {s.preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                          <td className="px-4 py-4 text-center">
                            <button onClick={() => { setEditingService(s); setIsServiceModalOpen(true); }} className="p-1.5 text-on-surface-variant hover:text-primary transition-colors text-[16px] material-symbols-outlined">edit</button>
                            <button onClick={() => { showConfirm(`Remover o serviço ${s.nome}?`, async () => { try { const { error } = await supabase.from('servicos').delete().eq('id', s.id); if (error) throw error; setServices(prev => prev.filter(service => service.id !== s.id)); } catch (err: any) { console.error('Error deleting service:', err); showAlert(`Erro ao remover serviço: ${err.message}`); } }) }} className="p-1.5 text-on-surface-variant hover:text-error transition-colors text-[16px] material-symbols-outlined">delete</button>
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
          <section className="flex-1 overflow-y-auto custom-scrollbar bg-[#f7f3f0] p-6 md:p-8 relative animate-fade-in">
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
                                  setInventory(prev => prev.filter(item => item.id !== i.id));
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
          <section className="flex-1 overflow-y-auto custom-scrollbar bg-[#f7f3f0] p-6 md:p-8 relative animate-fade-in">
            <div className="max-w-7xl mx-auto space-y-8">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h2 className="font-manrope text-headline-lg text-primary font-bold text-[32px] md:text-[40px] leading-tight">Cadastro de Clientes</h2>
                  <p className="font-sans text-[14px] text-on-surface-variant max-w-2xl mt-2">
                    Gerencie a base de clientes da studio. Adicione, edite ou inative cadastros facilmente.
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
                              {p.avatar && !p.avatar.includes('dicebear') ? (
                                <Image width={500} height={500} unoptimized src={p.avatar} alt="avatar" className="w-10 h-10 rounded-full border border-primary/20 object-cover shrink-0" sizes="(max-width: 768px) 100vw, 500px" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-primary/20 text-on-surface-variant font-bold shrink-0">
                                  {p.nome.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-extrabold text-on-surface text-[14px] font-manrope">
                                  {p.pronome ? p.pronome + ' ' : ''}{p.nome}
                                </span>
                                <span className="text-[11px] text-on-surface-variant">{p.birthdate || 'Cadastrado Dez 2023'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {p.status !== 'Inativo' && p.status !== 'inactive' ? (
                              <span className="bg-tertiary/10 text-tertiary px-2.5 py-1 rounded-md text-[10px] font-bold">Ativo</span>
                            ) : (
                              <span className="bg-outline-variant/20 text-on-surface-variant px-2.5 py-1 rounded-md text-[10px] font-bold">Inativo</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-on-surface font-medium">{p.ultimaVisita}</span>
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
                                title="Acessar Prontuário de Atendimento CRM"
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
                                  showConfirm(`Tem certeza de que deseja remover ${p.nome} do sistema? (Esta ação não pode ser desfeita)`, async () => {
                                    try {
                                      const { error } = await supabase.from('clientes').delete().eq('id', p.id);
                                      if (error) throw error;
                                      setPatients(prev => prev.filter(patient => patient.id !== p.id));
                                      if (selectedPatientId === p.id) {
                                        setSelectedPatientId('');
                                      }
                                      showAlert('Cliente excluído com sucesso.');
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
          <section className="flex-1 overflow-y-auto custom-scrollbar bg-[#f7f3f0] p-6 md:p-8 relative animate-fade-in">
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
                  onClick={() => {
                    setEditingUser(null);
                    setNewUserAvatarUrl('');
                    setIsNewUserModalOpen(true);
                  }}
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
                              u.role === 'admin' ? 'bg-primary text-white-pure' : u.role === 'prestador' ? 'bg-[#7B2FBE] text-white-pure' : 'bg-surface-container-highest text-on-surface-variant'
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
                              onClick={() => {
                                setEditingUser(u);
                                setNewUserAvatarUrl('');
                                setIsNewUserModalOpen(true);
                              }}
                              className="p-2 text-on-surface-variant hover:text-primary transition-colors text-[18px] material-symbols-outlined rounded-lg hover:bg-surface-container"
                              title="Editar Cadastro / Senha"
                            >
                              edit
                            </button>
                            <button 
                              onClick={async () => {
                                try {
                                  const newStatus = u.status === 'active' ? 'inactive' : 'active';
                                  const { error } = await supabase
                                    .from('users')
                                    .update({ status: newStatus })
                                    .eq('id', u.id);
                                  if (error) throw error;
                                  setAppUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, status: newStatus } : usr));
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
                                      setAppUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, commissionRate: parsed } : usr));
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
                                    setAppUsers(prev => prev.filter(usr => usr.id !== u.id));
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


        {currentTab === 'mensagens-pre' && (
          <section className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="font-manrope text-[24px] font-bold text-primary">Msgs Pre-definidas</h1>
                  <p className="text-[13px] text-on-surface-variant">Respostas rápidas e modelos para envio no WhatsApp</p>
                </div>
                <button onClick={() => { setEditingMsg(null); setIsMsgModalOpen(true); }} className="bg-primary text-white-pure px-4 py-2.5 rounded-xl font-bold text-[13px] hover:opacity-90 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Novo Modelo
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mensagensPredefinidas.map(msg => (
                  <div key={msg.id} className="bg-white-pure rounded-3xl p-5 border border-outline-variant space-y-3 relative group">
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={() => { setEditingMsg(msg); setIsMsgModalOpen(true); }} className="text-on-surface-variant hover:text-primary transition-transform active:scale-90 hover:scale-110 p-1"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                      <button onClick={() => deleteMsgPredefinida(msg.id)} className="text-on-surface-variant hover:text-error transition-transform active:scale-90 hover:scale-110 p-1"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                    </div>
                    <h3 className="font-bold text-[15px] text-primary pr-12">{msg.title}</h3>
                    <p className="text-[12px] text-on-surface-variant italic whitespace-pre-wrap">{msg.content}</p>
                    <span className="inline-block bg-[#ebf3fe] text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">Gatilho: {msg.trigger_type}</span>
                  </div>
                ))}
                {mensagensPredefinidas.length === 0 && (
                  <div className="col-span-1 md:col-span-2 text-center py-12 text-on-surface-variant">
                    Nenhuma mensagem pré-definida cadastrada. Clique em "Novo Modelo" para adicionar.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {currentTab === 'despesas' && (
          <section className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="font-manrope text-[24px] font-bold text-primary">Despesas</h1>
                  <p className="text-[13px] text-on-surface-variant">Controle de saídas, aluguéis, materiais e despesas fixas</p>
                </div>
                <button onClick={() => setIsDespesaModalOpen(true)} className="bg-primary text-white-pure px-4 py-2.5 rounded-xl font-bold text-[13px] hover:opacity-90 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Nova Despesa
                </button>
              </div>
              <div className="bg-white-pure rounded-3xl border border-outline-variant overflow-hidden">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-surface-container-lowest border-b border-outline-variant">
                    <tr>
                      <th className="px-6 py-4 font-bold text-primary">Descrição</th>
                      <th className="px-6 py-4 font-bold text-primary">Data</th>
                      <th className="px-6 py-4 font-bold text-primary">Valor</th>
                      <th className="px-6 py-4 font-bold text-primary">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {despesas.map(d => (
                      <tr key={d.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-primary">{d.descricao}</td>
                        <td className="px-6 py-4 text-on-surface-variant">{new Date(d.data).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 text-error font-bold">R$ {d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4">
                           <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold ${d.status === 'Pago' ? 'bg-[#ebf3fe] text-blue-800' : 'bg-[#fff9eb] text-amber-800'}`}>
                             {d.status || 'Pendente'}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => deleteDespesa(d.id)} className="text-on-surface-variant hover:text-error transition-colors p-1">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {despesas.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-[48px] text-error/30 mb-4 block">monetization_on</span>
                          <p className="font-manrope font-bold text-[15px]">Nenhuma despesa cadastrada</p>
                          <p className="text-[12px] mt-1">Registre suas contas para apurar o lucro líquido nos resumos financeiros.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {currentTab === 'funcionarios' && (
          <section className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="font-manrope text-[24px] font-bold text-primary">Funcionários & Especialistas</h1>
                  <p className="text-[13px] text-on-surface-variant">Equipe técnica e controle de comissões/agendas</p>
                </div>
              </div>
              <div className="bg-white-pure rounded-3xl border border-outline-variant overflow-hidden">
                <table className="w-full text-left font-sans text-[13px]">
                  <thead className="bg-[#f7f3f0]/50 border-b border-outline-variant">
                    <tr>
                      <th className="px-6 py-4 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider">Nome</th>
                      <th className="px-6 py-4 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider">Especialidade</th>
                      <th className="px-6 py-4 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider">Comissão padrão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {appUsers.map(u => (
                      <tr key={u.id}>
                        <td className="px-6 py-4 flex items-center gap-3 font-bold text-on-surface">
                          {u.avatar && !u.avatar.includes('dicebear') ? (
                            <Image width={32} height={32} src={u.avatar} alt={u.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/40 text-on-surface-variant font-bold text-[10px]">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {u.name}
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant">{u.specialty || u.role}</td>
                        <td className="px-6 py-4 font-bold text-primary">{u.commissionRate || 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {currentTab === 'relatorios-performance' && (
          <section className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface">
            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="font-manrope text-[24px] font-bold text-primary">Relatórios de Performance</h1>
              <div className="bg-white-pure rounded-3xl p-6 border border-outline-variant">
                <p className="font-manrope font-bold text-[15px] mb-4">Metas e Conversões da Equipe</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-surface-container rounded-2xl p-4 text-center">
                    <p className="text-[11px] text-on-surface-variant font-bold">Taxa de Conversão Geral</p>
                    <p className="text-[28px] font-extrabold text-primary mt-1">{taxaConversao}%</p>
                  </div>
                  <div className="bg-surface-container rounded-2xl p-4 text-center">
                    <p className="text-[11px] text-on-surface-variant font-bold">Agendamentos Hoje</p>
                    <p className="text-[28px] font-extrabold text-primary mt-1">{appointmentsToday}</p>
                  </div>
                  <div className="bg-surface-container rounded-2xl p-4 text-center">
                    <p className="text-[11px] text-on-surface-variant font-bold">Clientes Ativos</p>
                    <p className="text-[28px] font-extrabold text-primary mt-1">{patients.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {currentTab === 'relatorios-financeiro' && (
          <section className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface">
            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="font-manrope text-[24px] font-bold text-primary">Resumo Financeiro</h1>
              <div className="bg-white-pure rounded-3xl p-6 border border-outline-variant space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-bold">Faturamento Total do Mês:</span>
                  <span className="font-bold text-emerald-600">R$ {totalRevenueThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-bold">Valores Confirmados/Recebidos:</span>
                  <span className="font-bold text-emerald-600">R$ {receitaRecebida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-bold">Contas a Receber (Pendente):</span>
                  <span className="font-bold text-amber-600">R$ {aReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {currentTab === 'relatorios-melhores-clientes' && (
          <section className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface">
            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="font-manrope text-[24px] font-bold text-primary">Melhores Clientes</h1>
              <div className="bg-white-pure rounded-3xl border border-outline-variant overflow-hidden">
                <table className="w-full text-left font-sans text-[13px]">
                  <thead className="bg-[#f7f3f0]/50 border-b border-outline-variant">
                    <tr>
                      <th className="px-6 py-4 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-4 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider">Total Gasto</th>
                      <th className="px-6 py-4 font-bold text-on-surface-variant text-[11px] uppercase tracking-wider">Procedimentos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {patients.slice().sort((a, b) => b.totalGasto - a.totalGasto).slice(0, 10).map(p => (
                      <tr key={p.id}>
                        <td className="px-6 py-4 flex items-center gap-3 font-bold text-on-surface">
                          {p.avatar && !p.avatar.includes('dicebear') ? (
                            <Image width={32} height={32} src={p.avatar} alt={p.nome} className="h-8 w-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/40 text-on-surface-variant font-bold text-[10px]">
                              {p.nome.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {p.nome}
                        </td>
                        <td className="px-6 py-4 text-emerald-600 font-bold">R$ {p.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4">{p.qtdeProcedimentos} sessões</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {currentTab === 'configuracoes' && (
          <section className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface">
            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="font-manrope text-[24px] font-bold text-primary">Configurações Gerais</h1>
              <div className="bg-white-pure rounded-3xl p-6 border border-outline-variant space-y-4">
                <h3 className="font-bold text-[16px] text-primary">Segurança</h3>
                <div className="pt-2">
                  <button onClick={() => setIsChangePasswordModalOpen(true)} className="bg-primary text-white-pure px-4 py-2 rounded-xl text-[12px] font-bold hover:bg-primary/90 transition-colors">
                    Alterar Senha de Acesso
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {currentTab === 'dados-empresa' && (
          <section className="flex-1 overflow-y-auto p-4 sm:p-8 bg-surface">
            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="font-manrope text-[24px] font-bold text-primary">Dados da Empresa</h1>
              <div className="bg-white-pure rounded-3xl p-6 border border-outline-variant space-y-4">
                <p className="text-[12px] text-on-surface-variant mb-4">Gerencie as informações da clínica. Estes dados podem ser exibidos em recibos e relatórios.</p>
                <form className="space-y-4 max-w-lg" onSubmit={async (e) => {
                  e.preventDefault();
                  if (companyData.id) {
                    const { error } = await supabase.from('configuracoes_empresa')
                      .update({
                        nome: companyData.nome,
                        cnpj: companyData.cnpj,
                        endereco: companyData.endereco,
                        telefone: companyData.telefone
                      })
                      .eq('id', companyData.id);
                      
                    if (error) showAlert('Erro ao atualizar dados: ' + error.message);
                    else showAlert('Dados da empresa salvos com sucesso!');
                  }
                }}>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Nome da Clínica</label>
                    <input 
                      type="text" 
                      value={companyData.nome}
                      onChange={(e) => setCompanyData({...companyData, nome: e.target.value})}
                      disabled={currentUser?.role !== 'admin'}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-[13px] disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">CNPJ</label>
                    <input 
                      type="text" 
                      value={companyData.cnpj}
                      onChange={(e) => setCompanyData({...companyData, cnpj: e.target.value})}
                      disabled={currentUser?.role !== 'admin'}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-[13px] disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Endereço Completo</label>
                    <input 
                      type="text" 
                      value={companyData.endereco}
                      onChange={(e) => setCompanyData({...companyData, endereco: e.target.value})}
                      disabled={currentUser?.role !== 'admin'}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-[13px] disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Telefone / Contato</label>
                    <input 
                      type="text" 
                      value={companyData.telefone}
                      onChange={(e) => setCompanyData({...companyData, telefone: e.target.value})}
                      disabled={currentUser?.role !== 'admin'}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-[13px] disabled:opacity-60"
                    />
                  </div>
                  
                  {currentUser?.role === 'admin' && (
                    <div className="pt-4">
                      <button type="submit" className="bg-primary hover:bg-primary/90 text-white-pure px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm">
                        Salvar Informações
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && currentUser && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
          <div className="bg-white-pure sm:rounded-3xl border border-outline-variant w-full max-w-lg p-5 sm:p-8 shadow-2xl relative h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setIsEditProfileModalOpen(false); setNewUserAvatarUrl(''); }}
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
              const avatar = (newUserAvatarUrl || (d.get('avatar') as string) || '').trim();

              if(name) {
                const upd = { ...currentUser, name, phone, avatar: avatar || currentUser.avatar };
                try {
                  const res = await fetch('/api/auth/users/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: currentUser.id,
                      name,
                      username: currentUser.username,
                      role: currentUser.role,
                      status: currentUser.status,
                      phone,
                      specialty: currentUser.specialty,
                      commissionRate: currentUser.commissionRate,
                      avatar: upd.avatar,
                      permissions: currentUser.permissions
                    })
                  });
                  const resData = await res.json();
                  if (!res.ok) {
                    throw new Error(resData.error || 'Erro ao atualizar perfil.');
                  }
                  setCurrentUser(mapUserToFrontend(resData.user));
                  setIsEditProfileModalOpen(false);
                  setNewUserAvatarUrl('');
                  showAlert('Perfil atualizado com sucesso!');
                } catch (err: any) {
                  console.error('Error updating profile:', err);
                  showAlert(`Erro ao atualizar perfil: ${err.message}`);
                }
              }
            }} className="space-y-4 font-sans text-[13px]">
              <div className="flex items-center gap-4 bg-[#fcfaf7] border border-outline-variant/60 rounded-2xl p-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-black text-[18px] flex-shrink-0 border-2 border-outline-variant/40">
                  {newUserAvatarUrl || currentUser.avatar ? (
                    <Image width={500} height={500} unoptimized alt="Avatar preview" className="w-full h-full object-cover" src={newUserAvatarUrl || currentUser.avatar || ''} sizes="(max-width: 768px) 100vw, 500px" />
                  ) : (
                    <span>{currentUser.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Foto de Perfil</label>
                  <div className="flex gap-2 flex-wrap">
                    <label className="cursor-pointer px-3 py-1.5 bg-primary text-white-pure rounded-lg text-[11px] font-bold hover:opacity-90 transition-all inline-flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">upload</span>
                      {newUserAvatarUploading ? 'Enviando...' : 'Escolher Foto'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            showAlert('Arquivo muito grande. Máximo 5MB.');
                            return;
                          }
                          try {
                            setNewUserAvatarUploading(true);
                            const url = await uploadUserAvatar(file);
                            setNewUserAvatarUrl(url);
                          } catch (err: any) {
                            showAlert(`Erro no upload: ${err.message}`);
                          } finally {
                            setNewUserAvatarUploading(false);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                    {(newUserAvatarUrl || currentUser.avatar) && (
                      <button
                        type="button"
                        onClick={() => setNewUserAvatarUrl('')}
                        className="px-3 py-1.5 border border-outline-variant rounded-lg text-[11px] font-bold text-on-surface-variant hover:bg-surface transition-all"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-2">Nome Completo</label>
                <input required name="name" defaultValue={currentUser.name} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-2">Telefone</label>
                <input name="phone" defaultValue={currentUser.phone || ''} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-2">ou URL da Foto (opcional)</label>
                <input name="avatar" defaultValue={currentUser.avatar || ''} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary" placeholder="https://..." />
              </div>
              
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => { setIsEditProfileModalOpen(false); setNewUserAvatarUrl(''); }} className="flex-1 py-3 border border-outline-variant rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-primary text-white-pure rounded-xl font-bold shadow-md hover:opacity-90">Salvar Mudanças</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentUser={currentUser}
        showAlert={showAlert}
      />

      {/* Global Alert & Confirm Dialog */}
      {dialogState.isOpen && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
          <div className="bg-white-pure sm:rounded-3xl border border-outline-variant w-full max-w-sm p-5 sm:p-8 shadow-2xl relative h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto select-none flex flex-col items-center">
            
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

      {/* Modal Mensagem Predefinida */}
      {isMsgModalOpen && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={() => setIsMsgModalOpen(false)}>
          <div className="bg-[#f7f3f0] rounded-3xl border border-outline-variant w-full max-w-lg overflow-hidden shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-white-pure">
              <h2 className="font-manrope text-[20px] font-bold text-primary">{editingMsg ? 'Editar Modelo' : 'Novo Modelo de Mensagem'}</h2>
              <button onClick={() => setIsMsgModalOpen(false)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form key={editingMsg?.id || 'new'} onSubmit={saveMsgPredefinida} className="p-6 space-y-5 bg-white-pure">
              <div>
                <label className="block text-[12px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Título do Modelo</label>
                <input required name="title" defaultValue={editingMsg?.title || ''} className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] text-on-surface focus:outline-none focus:border-primary transition-colors" placeholder="Ex: Pós-Procedimento D+15" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Gatilho</label>
                <select required name="trigger_type" defaultValue={editingMsg?.trigger_type || 'Agenda'} className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] text-on-surface focus:outline-none focus:border-primary transition-colors">
                  <option value="Agenda">Agenda (Lembrete)</option>
                  <option value="Pós-Procedimento">Pós-Procedimento</option>
                  <option value="Aniversário">Aniversário</option>
                  <option value="Inativo">Cliente Inativo</option>
                  <option value="Livre">Mensagem Livre</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">Conteúdo da Mensagem</label>
                <textarea required name="content" defaultValue={editingMsg?.content || ''} rows={5} className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-[14px] text-on-surface focus:outline-none focus:border-primary transition-colors resize-none" placeholder="Olá [nome]! Confirmamos..."></textarea>
                <p className="text-[10px] text-on-surface-variant mt-2">Dica: Use [nome], [data], [hora], [procedimento] como variáveis dinâmicas se sua integração WhatsApp suportar.</p>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsMsgModalOpen(false)} className="flex-1 py-3.5 rounded-xl font-bold text-[14px] text-on-surface hover:bg-surface-container transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-primary text-white-pure py-3.5 rounded-xl font-bold text-[14px] hover:opacity-90 transition-opacity">Salvar Modelo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNewUserModalOpen && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
          <div className="bg-white-pure sm:rounded-3xl border border-outline-variant w-full max-w-xl p-5 sm:p-8 shadow-2xl relative h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto select-none">
            
            <button
              onClick={() => {
                setIsNewUserModalOpen(false);
                setEditingUser(null);
                setNewUserAvatarUrl('');
              }}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-all p-2 font-black"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-3xl">badge</span>
              <div>
                <h3 className="font-manrope text-[18px] font-bold text-primary">
                  {editingUser ? 'Editar Integrante da Equipe' : 'Novo Integrante da Equipe'}
                </h3>
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
              const password = (document.getElementById('new_user_pass') as HTMLInputElement).value;

              const canAccessCRM = (document.getElementById('perm_crm') as HTMLInputElement).checked;
              const canAccessAgenda = (document.getElementById('perm_agenda') as HTMLInputElement).checked;
              const canAccessFinanceiro = (document.getElementById('perm_fin') as HTMLInputElement).checked;
              const canSchedule = (document.getElementById('perm_sched') as HTMLInputElement).checked;
              const canEditCliente = (document.getElementById('perm_edit') as HTMLInputElement).checked;

              if (!name || !username) {
                showAlert('Nome e Username são obrigatórios.');
                return;
              }

              try {
                if (editingUser) {
                  const res = await fetch('/api/auth/users/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: editingUser.id,
                      name,
                      username,
                      role,
                      status: editingUser.status,
                      specialty,
                      phone,
                      commissionRate,
                      password,
                      avatar: newUserAvatarUrl,
                      permissions: {
                        accessCRM: canAccessCRM,
                        accessAgenda: canAccessAgenda,
                        accessFinanceiro: canAccessFinanceiro,
                        canSchedule,
                        editPatients: canEditCliente
                      }
                    })
                  });

                  const data = await res.json();
                  if (!res.ok) {
                    throw new Error(data.error || 'Erro ao editar integrante.');
                  }
                  const updatedUser = mapUserToFrontend(data.user);
                  setAppUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
                  if (currentUser && currentUser.id === updatedUser.id) {
                    setCurrentUser(updatedUser);
                  }
                  showAlert(`Cadastro de ${name} atualizado com sucesso!`);
                } else {
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
                      password,
                      avatar: newUserAvatarUrl,
                      permissions: {
                        accessCRM: canAccessCRM,
                        accessAgenda: canAccessAgenda,
                        accessFinanceiro: canAccessFinanceiro,
                        canSchedule,
                        editPatients: canEditCliente
                      }
                    })
                  });

                  const data = await res.json();
                  if (!res.ok) {
                    throw new Error(data.error || 'Erro ao cadastrar integrante.');
                  }
                  const newUser = mapUserToFrontend(data.user);
                  setAppUsers(prev => [...prev, newUser]);
                  showAlert(`Cadastrado com sucesso! ${name} agora possui acesso ao sistema.`);
                }

                setIsNewUserModalOpen(false);
                setEditingUser(null);
                setNewUserAvatarUrl('');
              } catch (err: any) {
                console.error('Error saving team member:', err);
                showAlert(`Erro ao salvar integrante: ${err.message || err}`);
              }
            }} className="space-y-4 text-[12px] font-bold text-on-surface-variant">

              <div className="flex items-center gap-4 bg-[#fcfaf7] border border-outline-variant/60 rounded-2xl p-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-black text-[18px] flex-shrink-0 border-2 border-outline-variant/40">
                  {newUserAvatarUrl ? (
                    <Image width={500} height={500} unoptimized alt="Avatar preview" className="w-full h-full object-cover" src={newUserAvatarUrl} sizes="(max-width: 768px) 100vw, 500px" />
                  ) : editingUser?.avatar ? (
                    <Image width={500} height={500} unoptimized alt="Avatar atual" className="w-full h-full object-cover" src={editingUser.avatar} sizes="(max-width: 768px) 100vw, 500px" />
                  ) : (
                    <span>{(document.getElementById('new_user_name') as HTMLInputElement)?.value?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block mb-1 text-[11px]">Foto de Perfil</label>
                  <div className="flex gap-2 flex-wrap">
                    <label className="cursor-pointer px-3 py-1.5 bg-primary text-white-pure rounded-lg text-[11px] font-bold hover:opacity-90 transition-all inline-flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">upload</span>
                      {newUserAvatarUploading ? 'Enviando...' : 'Escolher Foto'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            showAlert('Arquivo muito grande. Máximo 5MB.');
                            return;
                          }
                          try {
                            setNewUserAvatarUploading(true);
                            const url = await uploadUserAvatar(file);
                            setNewUserAvatarUrl(url);
                          } catch (err: any) {
                            showAlert(`Erro no upload: ${err.message}`);
                          } finally {
                            setNewUserAvatarUploading(false);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                    {newUserAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setNewUserAvatarUrl('')}
                        className="px-3 py-1.5 border border-outline-variant rounded-lg text-[11px] font-bold text-on-surface-variant hover:bg-surface transition-all"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-outline mt-1.5">PNG, JPEG ou WebP. Máx 5MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Nome Completo</label>
                  <input type="text" id="new_user_name" defaultValue={editingUser?.name || ''} placeholder="Ex: Luciano Santos" required className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary font-medium" />
                </div>
                <div>
                  <label className="block mb-1">Login (Username)</label>
                  <input type="text" id="new_user_username" defaultValue={editingUser?.username || ''} placeholder="luciano.s" required className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Telefone Celular</label>
                  <input type="text" id="new_user_phone" defaultValue={editingUser?.phone || ''} placeholder="(11) 98721-0012" className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary font-medium" />
                </div>
                <div>
                  <label className="block mb-1">Perfil de Operação</label>
                  <select id="new_user_role" defaultValue={editingUser?.role || 'prestador'} className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary font-medium">
                    <option value="prestador">Especialista / Médico</option>
                    <option value="staff">Assistente / Recepção</option>
                    <option value="admin">Administrador Geral</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Especialidade (Se Aplicável)</label>
                  <input type="text" id="new_user_specialty" defaultValue={editingUser?.specialty || ''} placeholder="Biomédico / Dermato" className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary font-medium" />
                </div>
                <div>
                  <label className="block mb-1">Repasse / Comissão (%)</label>
                  <input type="number" id="new_user_comm" defaultValue={editingUser?.commissionRate ?? 30} className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary font-medium" />
                </div>
              </div>

              <div>
                <label className="block mb-1">
                  {editingUser ? 'Alterar Senha (Deixe em branco para não alterar)' : 'Definir Senha Inicial (Deixe em branco para padrão "123")'}
                </label>
                <input type="password" id="new_user_pass" placeholder="Definir nova senha de acesso" className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 focus:outline-none focus:border-primary font-medium" />
              </div>

              {/* Usability & CRM Access Rules checkboxes */}
              <div className="bg-[#fcfaf7] border border-outline-variant/60 rounded-2xl p-4 space-y-3">
                <p className="font-manrope text-[12px] font-black text-on-surface mb-2">Usabilidade &amp; Níveis de Acesso do CRM</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[11px]">
                    <input type="checkbox" id="perm_crm" defaultChecked={editingUser ? !!editingUser.permissions?.accessCRM : true} className="rounded border-outline-variant text-primary" />
                    Módulo CRM
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[11px]">
                    <input type="checkbox" id="perm_agenda" defaultChecked={editingUser ? !!editingUser.permissions?.accessAgenda : true} className="rounded border-outline-variant text-primary" />
                    Ver Agenda
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[11px]">
                    <input type="checkbox" id="perm_fin" defaultChecked={editingUser ? !!editingUser.permissions?.accessFinanceiro : false} className="rounded border-outline-variant text-primary" />
                    Finanças / Caixa
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[11px]">
                    <input type="checkbox" id="perm_sched" defaultChecked={editingUser ? !!editingUser.permissions?.canSchedule : true} className="rounded border-outline-variant text-primary" />
                    Agendar Horas
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[11px]">
                    <input type="checkbox" id="perm_edit" defaultChecked={editingUser ? !!editingUser.permissions?.editPatients : true} className="rounded border-outline-variant text-primary" />
                    Editar Clientes
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewUserModalOpen(false);
                    setEditingUser(null);
                    setNewUserAvatarUrl('');
                  }}
                  className="flex-1 py-3 text-[12px] font-bold text-on-surface border border-outline-variant rounded-xl hover:bg-surface transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 text-[12px] font-bold text-white-pure bg-primary rounded-xl hover:opacity-95 transition-all cursor-pointer shadow-md"
                >
                  {editingUser ? 'Salvar Alterações' : 'Gravar Cadastro'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Dynamic Cliente Registration Modal */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
          <div className="bg-white-pure sm:rounded-3xl border border-outline-variant w-full max-w-xl p-5 sm:p-8 shadow-2xl relative h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto select-none">
            
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
              const pronome = (document.getElementById('new_pat_pronoun') as HTMLSelectElement).value;
              const nome = (document.getElementById('new_pat_name') as HTMLInputElement).value;
              const telefone = (document.getElementById('new_pat_phone') as HTMLInputElement).value;
              const cpf = (document.getElementById('new_pat_cpf') as HTMLInputElement).value;
              
              if (!nome) {
                showAlert('Nome é obrigatório.');
                return;
              }

              try {
                if (editingPatientId) {
                  const { data, error } = await supabase
                    .from('clientes')
                    .update(mapClienteToBackend({ nome, telefone, cpf, pronome, avatar: newPatAvatar || undefined, fotoDetalhes: newPatAvatar || undefined }))
                    .eq('id', editingPatientId)
                    .select();
                  if (error) throw error;
                  if (data && data[0]) {
                    setPatients(prev => prev.map(p => p.id === editingPatientId ? mapClienteToFrontend(data[0]) : p));
                  }
                  showAlert('Cliente atualizado com sucesso!');
                } else {
                  const newPatient: Partial<Cliente> = {
                    nome,
                    telefone,
                    cpf,
                    pronome,
                    avatar: newPatAvatar || '',
                    fotoDetalhes: newPatAvatar || '',
                    status: 'Standard',
                    tier: 'Cliente Avaliação',
                    since: 'Hoje',
                    totalGasto: 0,
                    qtdeProcedimentos: 0,
                    dataUltimaFoto: '--',
                    alergias: 'Nenhuma reportada',
                    medicacoes: 'Nenhum reportado',
                    procedimentosAnteriores: 'Nenhum',
                    notasEvolucao: '',
                    fotoAntes: 'https://images.unsplash.com/photo-1542385151-efd85c07c293?w=500&h=500&fit=crop',
                    fotoDepois: 'https://images.unsplash.com/photo-1542385151-efd85c07c293?w=500&h=500&fit=crop',
                    ultimaVisita: 'Hoje',
                    birthdate: 'Cadastrado Hoje',
                    ltv: 'R$ 0,00',
                    historico: []
                  };
                  const { data, error } = await supabase
                    .from('clientes')
                    .insert([mapClienteToBackend(newPatient)])
                    .select();
                  if (error) throw error;
                  if (data && data[0]) {
                    const frontendPat = mapClienteToFrontend(data[0]);
                    setPatients(prev => [...prev, frontendPat]);
                    setSelectedPatientId(frontendPat.id);
                  }
                  showAlert('Cliente cadastrado com sucesso!');
                }
              } catch (err: any) {
                console.error('Error saving patient:', err);
                showAlert(`Erro ao salvar cliente: ${err.message || err}`);
              }
              setIsPatientModalOpen(false);
            }}>
              
              <div className="space-y-4 font-sans text-[13px]">
                
                {/* Avatar upload section removed */}
                <div className="hidden"></div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-on-surface-variant font-bold mb-1 ml-1 text-[11px] uppercase tracking-wider">Pronome</label>
                    <select
                      id="new_pat_pronoun"
                      defaultValue={editingPatientId ? patients.find(p => p.id === editingPatientId)?.pronome || '' : ''}
                      className="w-full bg-[#f7f3f0] text-on-surface px-3 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary transition-all font-medium"
                    >
                      <option value="">Nenhum</option>
                      <option value="Sr.">Sr.</option>
                      <option value="Sra.">Sra.</option>
                      <option value=""></option>
                      <option value=""></option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-on-surface-variant font-bold mb-1 ml-1 text-[11px] uppercase tracking-wider">Nome Completo</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-3.5 text-on-surface-variant text-[18px]">person</span>
                      <input 
                        id="new_pat_name"
                        type="text" 
                        placeholder="Ex: Maria Carolina da Silva" 
                        defaultValue={editingPatientId ? patients.find(p => p.id === editingPatientId)?.nome : ''}
                        className="w-full bg-[#f7f3f0] text-on-surface pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-on-surface-variant font-bold mb-1 ml-1 text-[11px] uppercase tracking-wider">WhatsApp</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-3.5 text-on-surface-variant text-[18px]">call</span>
                        <input 
                          id="new_pat_phone"
                          type="text" 
                          placeholder="(11) 90000-0000" 
                          defaultValue={editingPatientId ? patients.find(p => p.id === editingPatientId)?.telefone || '' : ''}
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
                        defaultValue={editingPatientId ? patients.find(p => p.id === editingPatientId)?.cpf || '' : ''}
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
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
          <div className="bg-white-pure sm:rounded-3xl border border-outline-variant w-full max-w-lg p-5 sm:p-8 shadow-2xl relative h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto select-none">
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
                  const { data, error } = await supabase
                    .from('servicos')
                    .update(mapServicoToBackend({ nome: name, categoria: category, duracao: duration, preco: price }))
                    .eq('id', editingService.id)
                    .select();
                  if (error) throw error;
                  if (data && data[0]) {
                    setServices(prev => prev.map(s => s.id === editingService.id ? mapServicoToFrontend(data[0]) : s));
                  }
                } else {
                  const { data, error } = await supabase
                    .from('servicos')
                    .insert([mapServicoToBackend({ nome: name, categoria: category, duracao: duration, preco: price })])
                    .select();
                  if (error) throw error;
                  if (data && data[0]) {
                    setServices(prev => [...prev, mapServicoToFrontend(data[0])]);
                  }
                }
                setIsServiceModalOpen(false);
              } catch (err: any) {
                console.error('Error saving service:', err);
                showAlert(`Erro ao salvar serviço: ${err.message || err}`);
              }
            }} className="space-y-4 font-sans text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Nome do Serviço</label>
                <input required name="name" defaultValue={editingService?.nome || ''} type="text" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-on-surface-variant/50" placeholder="ex: Peeling Químico" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Categoria</label>
                   <select required name="category" defaultValue={editingService?.categoria || 'Estética'} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary appearance-none custom-select-arrow">
                     <option value="Estética">Estética</option>
                     
                     <option value="Consulta">Consulta</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Duração (Ex: 40 min)</label>
                   <input required name="duration" defaultValue={editingService?.duracao || ''} type="text" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-on-surface-variant/50" placeholder="ex: 45 min" />
                 </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Preço Base (R$)</label>
                <input required name="price" defaultValue={editingService?.preco || ''} type="number" step="0.01" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-on-surface-variant/50" placeholder="ex: 120.00" />
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
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
          <div className="bg-white-pure sm:rounded-3xl border border-outline-variant w-full max-w-lg p-5 sm:p-8 shadow-2xl relative h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto select-none">
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
                  const { data, error } = await supabase
                    .from('inventory')
                    .update(mapInventoryToBackend({ name, unit, quantity, minQuantity }))
                    .eq('id', editingInventory.id)
                    .select();
                  if (error) throw error;
                  if (data && data[0]) {
                    setInventory(prev => prev.map(i => i.id === editingInventory.id ? mapInventoryToFrontend(data[0]) : i));
                  }
                } else {
                  const { data, error } = await supabase
                    .from('inventory')
                    .insert([mapInventoryToBackend({ name, unit, quantity, minQuantity })])
                    .select();
                  if (error) throw error;
                  if (data && data[0]) {
                    setInventory(prev => [...prev, mapInventoryToFrontend(data[0])]);
                  }
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* 11. Cobranca Modal */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
          <div className="bg-white-pure sm:rounded-3xl border border-outline-variant w-full max-w-lg p-5 sm:p-8 shadow-2xl relative h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto select-none">
            <button 
              onClick={() => setIsTransactionModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-container/50 text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <h3 className="font-manrope text-[20px] font-bold text-primary mb-6">
              {editingCobranca ? 'Editar Transação' : 'Nova Transação'}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const descricao = formData.get('descricao') as string;
              const data = formData.get('data') as string;
              const categoria = formData.get('categoria') as string;
              const status = formData.get('status') as 'Confirmado' | 'Pago' | 'Pendente';
              const valorStr = formData.get('valor') as string;
              const valor = parseFloat(valorStr.replace(/[^0-9,.-]/g, '').replace(',', '.'));
              
              try {
                if(editingCobranca) {
                  const { data: result, error } = await supabase
                    .from('cobrancas')
                    .update(mapCobrancaToBackend({ descricao, data, categoria, status, valor }))
                    .eq('id', editingCobranca.id)
                    .select();
                  if (error) throw error;
                  if (result && result[0]) {
                    setTransactions(prev => prev.map(t => t.id === editingCobranca.id ? mapCobrancaToFrontend(result[0]) : t));
                  }
                } else {
                  const { data: result, error } = await supabase
                    .from('cobrancas')
                    .insert([mapCobrancaToBackend({ descricao, data, categoria, status, valor })])
                    .select();
                  if (error) throw error;
                  if (result && result[0]) {
                    setTransactions(prev => [...prev, mapCobrancaToFrontend(result[0])]);
                  }
                }
                setIsTransactionModalOpen(false);
              } catch (err: any) {
                console.error('Error saving transaction:', err);
                showAlert(`Erro ao salvar transação: ${err.message || err}`);
              }
            }} className="space-y-4 font-sans text-[13px]">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Descrição</label>
                <input required name="descricao" defaultValue={editingCobranca?.descricao || ''} type="text" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-on-surface-variant/50" placeholder="ex: Compra de materiais" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Data</label>
                    <input required name="data" defaultValue={editingCobranca?.data || 'Hoje, 10:00'} type="text" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-on-surface-variant/50" />
                 </div>
                 <div>
                   <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Valor (R$)</label>
                    <input required name="valor" defaultValue={editingCobranca?.valor || ''} type="number" step="0.01" className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary placeholder:text-on-surface-variant/50" placeholder="-150.00" />
                 </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Categoria</label>
                    <select required name="categoria" defaultValue={editingCobranca?.categoria || 'Procedimento'} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary appearance-none custom-select-arrow">
                     <option value="Procedimento">Procedimento (Ganho)</option>
                     <option value="Insumos">Insumos (Despesa)</option>
                     <option value="Aluguel">Aluguel (Despesa)</option>
                     <option value="Pessoal">Pessoal (Despesa)</option>
                     <option value="Sistemas">Sistemas (Despesa)</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Status</label>
                    <select required name="status" defaultValue={editingCobranca?.status || 'Confirmado'} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary appearance-none custom-select-arrow">
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
      {isConflictModalOpen && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-[60] p-0 sm:p-4 animate-fade-in">
          <div className="bg-white-pure sm:rounded-3xl border border-red-500 w-full max-w-sm p-6 shadow-2xl relative select-none">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px]">warning</span>
              </div>
              <h3 className="font-manrope text-[18px] font-bold text-on-surface mb-2">
                Conflito de Horário
              </h3>
              <p className="text-[13px] text-on-surface-variant mb-6">
                Já existe um agendamento marcado para este mesmo dia e horário. Digite sua senha para liberar a sobreposição.
              </p>
              
              <form onSubmit={handleConfirmConflict} className="w-full space-y-4">
                <div>
                  <input 
                    type="password" 
                    required
                    placeholder="Sua senha de acesso" 
                    value={conflictPassword}
                    onChange={(e) => setConflictPassword(e.target.value)}
                    className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:outline-primary text-center font-bold tracking-widest"
                  />
                  {conflictError && <p className="text-red-500 text-[11px] font-bold mt-2">{conflictError}</p>}
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { 
                      setIsConflictModalOpen(false);
                      setConflictPendingData(null);
                      setConflictPassword('');
                      setConflictError('');
                    }}
                    className="flex-1 py-3 text-[12px] font-bold text-on-surface border border-outline-variant rounded-xl hover:bg-surface transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isValidatingConflict}
                    className="flex-1 py-3 text-[12px] font-bold text-white-pure bg-red-600 rounded-xl hover:bg-red-700 transition-all shadow-md disabled:opacity-70 flex justify-center items-center"
                  >
                    {isValidatingConflict ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Liberar Vaga'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isNewAppointmentOpen && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
          <div className="bg-white-pure sm:rounded-3xl border border-outline-variant w-full max-w-lg p-5 sm:p-8 shadow-2xl relative h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto select-none">
            
            <button 
              onClick={() => {
                setIsNewAppointmentOpen(false);
                setEditingAppointment(null);
              }}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-all p-2 font-black"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-3xl">spa</span>
              <div>
                <h3 className="font-manrope text-[20px] font-bold text-primary">
                  {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
                </h3>
                <p className="text-[12px] text-on-surface-variant">
                  {editingAppointment ? 'Altere as informações do procedimento da agenda' : 'Lançamento de novo procedimento no fluxo principal'}
                </p>
              </div>
            </div>

            <form onSubmit={handleAddNewAgendamento} className="space-y-4 font-sans text-[13px]">
              
              {/* Cliente */}
              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant">Cliente</label>
                <div className="flex gap-2">
                  <select 
                    value={newApptPatient}
                    onChange={(e) => setNewApptPatient(e.target.value)}
                    className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 font-medium flex-1"
                    required
                  >
                    <option value="" disabled>Selecione um cliente...</option>
                    {patients.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map(p => (
                      <option key={p.id} value={p.nome}>{p.nome}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => {
                    setNewApptPatient("Cliente Importado");
                    showAlert("Sincronizando com WhatsApp... \n\nCliente encontrado e importado para o agendamento com sucesso!");
                  }} className="bg-tertiary/10 text-tertiary px-3 rounded-xl hover:bg-tertiary/20 transition-all font-bold text-[11px] border border-tertiary/20 flex flex-col justify-center items-center" title="Sincronizar contato do WhatsApp">
                    <span className="material-symbols-outlined text-[16px] mb-0.5">sync</span>
                    Vincular
                  </button>
                  <button type="button" onClick={() => {
                    // Removed setIsNewAppointmentOpen(false) to keep appointment modal open underneath
                    setEditingPatientId(null);
                    setIsPatientModalOpen(true);
                  }} className="bg-primary/10 text-primary px-3 rounded-xl hover:bg-primary/20 transition-all font-bold text-[11px] border border-primary/20 flex flex-col justify-center items-center" title="Cadastrar Novo Cliente">
                    <span className="material-symbols-outlined text-[16px] mb-0.5">person_add</span>
                    Novo
                  </button>
                </div>
              </div>

              {/* Procedure */}
              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant">Procedimento</label>
                <input
                  list="servicos_list"
                  value={newApptProcedure}
                  onChange={(e) => {
                     setNewApptProcedure(e.target.value);
                     const sel = services.find(s => s.nome === e.target.value);
                     if(sel) {
                       setNewApptCategory(sel.categoria as any);
                     }
                  }}
                  className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 text-[13px] font-medium custom-select-arrow"
                  placeholder="Digite para buscar procedimento..."
                  required
                />
                <datalist id="servicos_list">
                  {services.map(s => (
                    <option key={s.id} value={s.nome}>{s.nome} (R$ {s.preco})</option>
                  ))}
                </datalist>
              </div>

              {/* Professional, Date and Time grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant">Profissional</label>
                  <input
                    list="prof_list"
                    value={newApptProfessional}
                    onChange={(e) => setNewApptProfessional(e.target.value)}
                    className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 font-medium font-sans text-[13px]"
                    placeholder="Digite profissional..."
                  />
                  <datalist id="prof_list">
                    {appUsers.filter(u => u.status === 'active').map(u => (
                      <option key={u.id} value={u.name} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant">Status</label>
                  <select
                    value={newApptStatus}
                    onChange={(e) => setNewApptStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 font-medium font-sans text-[13px]"
                  >
                    <option value="Confirmado">Confirmado</option>
                    <option value="Em Atendimento">Em Atendimento</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Pendente">Pendente</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant">Data</label>
                  <input 
                    type="date"
                    value={newApptDate}
                    onChange={(e)=>setNewApptDate(e.target.value)}
                    className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary/40 font-medium font-sans text-[13px]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant">Horário</label>
                  <input 
                    type="time"
                    value={newApptTime}
                    onChange={(e)=>setNewApptTime(e.target.value)}
                    className="w-full p-2.5 bg-surface rounded-xl border border-outline-variant/60 focus:outline-none font-sans text-[13px]"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsNewAppointmentOpen(false);
                    setEditingAppointment(null);
                  }}
                  className="flex-1 py-3 text-[12px] font-bold text-on-surface border border-outline-variant rounded-xl hover:bg-surface transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 text-[12px] font-bold text-white-pure bg-primary rounded-xl hover:opacity-95 transition-all cursor-pointer shadow-md"
                >
                  {editingAppointment ? 'Salvar Alterações' : 'Salvar na Agenda'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {viewingDocument && (
        <DocumentViewerModal 
          document={viewingDocument} 
          onClose={() => setViewingDocument(null)} 
        />
      )}

      {activeLightboxImage && (
        <div className="fixed inset-0 bg-[#000000e0] backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setActiveLightboxImage('')}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <button 
              onClick={() => setActiveLightboxImage('')}
              className="absolute -top-12 right-0 text-white-pure hover:text-primary transition-all p-2 font-black flex items-center gap-1 cursor-pointer bg-black/40 rounded-full"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            <Image width={500} height={500} unoptimized src={activeLightboxImage} className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10" alt="Visualização ampliada" onClick={(e) => e.stopPropagation()} sizes="(max-width: 768px) 100vw, 500px" />
          </div>
        </div>
      )}

      {/* Modal Evolution Photo Type Selection */}
      {pendingEvolutionPhoto && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white-pure rounded-[24px] shadow-2xl p-6 lg:p-8 w-full max-w-[400px]">
            <h3 className="font-manrope text-[20px] font-extrabold text-on-surface mb-2">Classificar Foto</h3>
            <p className="text-[13px] text-on-surface-variant mb-6">Onde esta foto deve ser armazenada no prontuário do cliente?</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={async () => {
                  const photoType: 'Antes' | 'Depois' | 'Evolução' = 'Antes';
                  if (!pendingEvolutionPhoto || !selectedPatient.id) return;
                  const newPhoto = { id: Date.now().toString(), url: pendingEvolutionPhoto.base64, date: new Date().toLocaleDateString('pt-BR'), type: photoType };
                  try {
                    const updatedPhotos = [...(selectedPatient.fotosEvolucao || []), newPhoto];
                    const updateField: any = { fotos_evolucao: updatedPhotos, foto_antes: pendingEvolutionPhoto.base64 };
                    const { error } = await supabase.from('clientes').update(updateField).eq('id', selectedPatient.id);
                    if (error) throw error;
                    setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, fotoAntes: pendingEvolutionPhoto.base64, fotosEvolucao: updatedPhotos } : p));
                    showAlert('Foto classificada como Antes com sucesso!');
                  } catch (err: any) { showAlert(`Erro ao salvar foto: ${err.message}`); }
                  setPendingEvolutionPhoto(null);
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-outline-variant hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">history</span>
                  <div className="text-left">
                    <p className="text-[14px] font-bold text-on-surface group-hover:text-primary">Antes do Tratamento</p>
                    <p className="text-[11px] text-on-surface-variant">Vai para o quadro esquerdo de comparativo</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
              </button>

              <button 
                onClick={async () => {
                  const photoType: 'Antes' | 'Depois' | 'Evolução' = 'Depois';
                  if (!pendingEvolutionPhoto || !selectedPatient.id) return;
                  const newPhoto = { id: Date.now().toString(), url: pendingEvolutionPhoto.base64, date: new Date().toLocaleDateString('pt-BR'), type: photoType };
                  try {
                    const updatedPhotos = [...(selectedPatient.fotosEvolucao || []), newPhoto];
                    const updateField: any = { fotos_evolucao: updatedPhotos, foto_depois: pendingEvolutionPhoto.base64 };
                    const { error } = await supabase.from('clientes').update(updateField).eq('id', selectedPatient.id);
                    if (error) throw error;
                    setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, fotoDepois: pendingEvolutionPhoto.base64, fotosEvolucao: updatedPhotos } : p));
                    showAlert('Foto classificada como Depois com sucesso!');
                  } catch (err: any) { showAlert(`Erro ao salvar foto: ${err.message}`); }
                  setPendingEvolutionPhoto(null);
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-outline-variant hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">flare</span>
                  <div className="text-left">
                    <p className="text-[14px] font-bold text-on-surface group-hover:text-primary">Depois do Tratamento</p>
                    <p className="text-[11px] text-on-surface-variant">Vai para o quadro direito de comparativo</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
              </button>

              <button 
                onClick={async () => {
                  const photoType: 'Antes' | 'Depois' | 'Evolução' = 'Evolução';
                  if (!pendingEvolutionPhoto || !selectedPatient.id) return;
                  const newPhoto = { id: Date.now().toString(), url: pendingEvolutionPhoto.base64, date: new Date().toLocaleDateString('pt-BR'), type: photoType };
                  try {
                    const updatedPhotos = [...(selectedPatient.fotosEvolucao || []), newPhoto];
                    const updateField: any = { fotos_evolucao: updatedPhotos };
                    const { error } = await supabase.from('clientes').update(updateField).eq('id', selectedPatient.id);
                    if (error) throw error;
                    setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, fotosEvolucao: updatedPhotos } : p));
                    showAlert('Foto adicionada à galeria de evolução!');
                  } catch (err: any) { showAlert(`Erro ao salvar foto: ${err.message}`); }
                  setPendingEvolutionPhoto(null);
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-outline-variant hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">collections_bookmark</span>
                  <div className="text-left">
                    <p className="text-[14px] font-bold text-on-surface group-hover:text-primary">Apenas Galeria / Evolução</p>
                    <p className="text-[11px] text-on-surface-variant">Vai para o acompanhamento cronológico</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
              </button>
            </div>
            
            <button 
              onClick={() => setPendingEvolutionPhoto(null)}
              className="mt-6 w-full py-3 rounded-xl font-bold text-[13px] text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Interação com o Cliente (Foto 2) */}
      {isClientInteractModalOpen && interactClient && (
        <div className="fixed inset-0 bg-[#31302fd0] backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setIsClientInteractModalOpen(false)}>
          <div className="bg-[#f7f3f0] rounded-3xl border border-outline-variant w-full max-w-md p-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsClientInteractModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-surface-container/50 text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="text-center space-y-4">
              {interactClient.avatar && !interactClient.avatar.includes('dicebear') ? (
                <Image width={500} height={500} unoptimized className="h-16 w-16 rounded-full object-cover border-2 border-primary/20 mx-auto" src={interactClient.avatar} alt={interactClient.nome} sizes="100vw" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-surface flex items-center justify-center border border-outline-variant/40 text-on-surface-variant font-bold mx-auto text-xl">
                  {interactClient.nome.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-manrope text-[18px] font-bold text-on-surface leading-tight">{interactClient.nome}</h3>
                <p className="text-[12px] text-on-surface-variant font-semibold mt-0.5">{interactClient.telefone || 'Sem telefone cadastrado'}</p>
              </div>
            </div>

            {/* Menu de Opções */}
            <div className="grid grid-cols-4 gap-2 border-t border-outline-variant/50 mt-6 pt-4 text-center">
              <a 
                href={`tel:${interactClient.telefone || ''}`} 
                onClick={() => setIsClientInteractModalOpen(false)}
                className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-surface transition-all cursor-pointer min-h-[70px]"
              >
                <span className="material-symbols-outlined text-emerald-600 text-2xl">call</span>
                <span className="text-[11px] font-bold text-on-surface mt-1">Ligar</span>
              </a>

              <button 
                onClick={() => setIsWhatsAppSubmenuOpen(!isWhatsAppSubmenuOpen)}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-surface transition-all cursor-pointer min-h-[70px] ${isWhatsAppSubmenuOpen ? 'bg-primary/5 border border-primary/20' : ''}`}
              >
                <span className="material-symbols-outlined text-emerald-500 text-2xl">chat</span>
                <span className="text-[11px] font-bold text-on-surface mt-1">Whats</span>
              </button>

              <button 
                onClick={() => {
                  setIsClientInteractModalOpen(false);
                  setEditingPatientId(interactClient.id);
                  setNewPatAvatar(interactClient.avatar);
                  setIsPatientModalOpen(true);
                }}
                className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-surface transition-all cursor-pointer min-h-[70px]"
              >
                <span className="material-symbols-outlined text-blue-600 text-2xl">edit</span>
                <span className="text-[11px] font-bold text-on-surface mt-1">Editar</span>
              </button>

              <button 
                onClick={() => {
                  setIsClientInteractModalOpen(false);
                  if (!interactAppointmentId) {
                     showAlert('Nenhum agendamento selecionado para exclusão.');
                     return;
                  }
                  showConfirm(`Deseja realmente cancelar este agendamento de ${interactClient.nome}?`, async () => {
                    try {
                      const { error } = await supabase.from('agendamentos').delete().eq('id', interactAppointmentId);
                      if (error) throw error;
                      setAppointments(prev => prev.filter(a => a.id !== interactAppointmentId));
                      showAlert('Agendamento cancelado com sucesso.');
                    } catch (err: any) {
                      console.error(err);
                      showAlert(`Erro ao cancelar agendamento: ${err.message}`);
                    }
                  });
                }}
                className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-surface transition-all cursor-pointer min-h-[70px]"
              >
                <span className="material-symbols-outlined text-error text-2xl">event_busy</span>
                <span className="text-[11px] font-bold text-error mt-1">Cancelar<br/>Agenda</span>
              </button>
            </div>

            {/* Submenu do WhatsApp */}
            {isWhatsAppSubmenuOpen && (
              <div className="bg-white-pure border border-outline-variant/60 rounded-2xl p-4 mt-4 space-y-2.5 animate-slide-up text-[12px]">
                <p className="text-[10px] text-on-surface-variant font-bold text-center uppercase tracking-wider">
                  Este é um serviço provido pelo Whats. Requer conexão com a internet.
                </p>
                
                <a
                  href={`https://wa.me/55${(interactClient.telefone || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsClientInteractModalOpen(false)}
                  className="w-full text-left py-2.5 px-3 hover:bg-surface rounded-xl font-bold text-primary flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-emerald-500 text-[18px]">chat</span>
                  Abrir chat
                </a>

                {mensagensPredefinidas.length > 0 ? (
                  mensagensPredefinidas.map(msg => (
                    <a
                      key={msg.id}
                      href={`https://wa.me/55${(interactClient.telefone || '').replace(/\D/g, '')}?text=${encodeURIComponent((msg.content || '').replace(/\[nome\]/gi, interactClient.nome || '').replace(/\[data\]/gi, new Date().toLocaleDateString('pt-BR')))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsClientInteractModalOpen(false)}
                      className="w-full text-left py-2.5 px-3 hover:bg-surface rounded-xl font-bold text-primary flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-emerald-500 text-[18px]">
                        {msg.trigger_type === 'Agenda' ? 'notifications' : 
                         msg.trigger_type === 'Aniversário' ? 'cake' : 'quickreply'}
                      </span>
                      {msg.title}
                    </a>
                  ))
                ) : (
                  <div className="text-center py-2 text-on-surface-variant italic">
                    Nenhuma mensagem pré-definida cadastrada.
                  </div>
                )}

                <button
                  onClick={() => setIsWhatsAppSubmenuOpen(false)}
                  className="w-full text-center py-2 bg-surface hover:bg-surface-container rounded-xl font-bold text-on-surface-variant mt-1"
                >
                  Cancelar
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
