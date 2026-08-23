import React from 'react';
import type { AppUser, SystemTab } from '../../lib/types';

interface SidebarProps {
  currentTab: SystemTab;
  setCurrentTab: (tab: SystemTab) => void;
  setSearchQuery: (query: string) => void;
  currentUser: AppUser | null;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  handleLogout: () => void;
  onNewAppointment: () => void;
}

type NavItem = { id: SystemTab; icon: string; label: string };

// Navegacao principal (itens maiores, com destaque ao selecionar)
const mainTabs: NavItem[] = [
  { id: 'agenda', icon: 'calendar_month', label: 'Agenda' },
  { id: 'financeiro', icon: 'payments', label: 'Cobranças' },
  { id: 'mensagens-pre', icon: 'chat_bubble', label: 'Msgs Pre-definidas' },
  { id: 'cadastro-cliente', icon: 'person_add', label: 'Cadastro de Clientes' },
  { id: 'clientes', icon: 'group', label: 'Prontuário (Sistema)' },
  { id: 'servicos', icon: 'medical_services', label: 'Serviços & Pacotes' },
  { id: 'planos-tratamento', icon: 'checklist', label: 'Planos de Tratamento' },
  { id: 'estoque', icon: 'shopping_cart', label: 'Produtos & Estoque' },
  { id: 'venda-skincare', icon: 'local_mall', label: 'Venda Skincare' },
  { id: 'despesas', icon: 'monetization_on', label: 'Despesas' },
  { id: 'funcionarios', icon: 'badge', label: 'Funcionários' },
];

// Relatorios e configuracoes (itens compactos)
const secondaryTabs: NavItem[] = [
  { id: 'relatorios-performance', icon: 'speed', label: 'Performance' },
  { id: 'relatorios-financeiro', icon: 'bar_chart', label: 'Resumo Financeiro' },
  { id: 'relatorios-melhores-clientes', icon: 'person', label: 'Melhores Clientes' },
  { id: 'configuracoes', icon: 'settings', label: 'Configurações' },
  { id: 'dados-empresa', icon: 'business', label: 'Dados da Empresa' },
  { id: 'sobre', icon: 'info', label: 'Sobre (Versão)' },
];

export default function Sidebar({
  currentTab,
  setCurrentTab,
  setSearchQuery,
  currentUser,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  handleLogout,
  onNewAppointment,
}: SidebarProps) {
  const goToTab = (tab: SystemTab) => {
    setCurrentTab(tab);
    setSearchQuery('');
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
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
          {mainTabs.map(tab => (
            <button
              key={tab.id}
              id={`nav-${tab.id}`}
              onClick={() => goToTab(tab.id)}
              className={`flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-300 text-left ${currentTab === tab.id ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: currentTab === tab.id ? "'FILL' 1" : "'FILL' 0"}}>{tab.icon}</span>
              <span className="font-manrope text-[14px] leading-none text-primary">{tab.label}</span>
            </button>
          ))}

          <div className="pt-4 pb-1">
            <span className="text-[10px] uppercase font-bold text-outline tracking-wider px-4">Relatórios</span>
          </div>

          {secondaryTabs.map(tab => (
            <button
              key={tab.id}
              id={`nav-${tab.id}`}
              onClick={() => goToTab(tab.id)}
              className={`flex items-center gap-4 px-4 py-2 rounded-xl transition-all duration-300 text-left ${currentTab === tab.id ? 'text-primary font-bold border-r-4 border-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-primary text-[18px]" style={{fontVariationSettings: currentTab === tab.id ? "'FILL' 1" : "'FILL' 0"}}>{tab.icon}</span>
              <span className="font-manrope text-[13px] leading-none text-primary">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Create appointment trigger from sidebar */}
        <div className="p-4 mx-4 mb-4 bg-surface-container-lowest/40 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <button
            id="sidebar-new-appointment"
            onClick={onNewAppointment}
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
              onClick={() => goToTab('usuarios')}
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
    </>
  );
}
