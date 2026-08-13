import React from 'react';
import type { AppUser } from '../../lib/types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: AppUser | null;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  handleLogout: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  currentUser,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  handleLogout,
}: SidebarProps) {
  const tabs = [
    { id: 'agenda', icon: 'calendar_month', label: 'Agenda' },
    { id: 'clientes', icon: 'group', label: 'Clientes' },
    { id: 'financeiro', icon: 'payments', label: 'Financeiro' },
    { id: 'servicos', icon: 'medical_services', label: 'Serviços' },
    { id: 'estoque', icon: 'shopping_cart', label: 'Estoque' },
    { id: 'venda-skincare', icon: 'local_mall', label: 'Loja Skincare' },
    { id: 'planos-tratamento', icon: 'checklist', label: 'Planos de Tratamento' },
  ];

  const adminTabs = [
    { id: 'usuarios', icon: 'manage_accounts', label: 'Usuários' },
    { id: 'despesas', icon: 'monetization_on', label: 'Despesas' },
    { id: 'funcionarios', icon: 'badge', label: 'Funcionários' },
    { id: 'configuracoes', icon: 'settings', label: 'Configurações' },
    { id: 'dados-empresa', icon: 'business', label: 'Dados da Empresa' },
  ];

  const reportsTabs = [
    { id: 'relatorios-performance', icon: 'speed', label: 'Performance' },
    { id: 'relatorios-financeiro', icon: 'bar_chart', label: 'Financeiro' },
    { id: 'relatorios-melhores-clientes', icon: 'person', label: 'Melhores Clientes' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
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
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setCurrentTab(tab.id); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-300 text-left ${currentTab === tab.id ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 scale-95' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: currentTab === tab.id ? "'FILL' 1" : "'FILL' 0"}}>{tab.icon}</span>
              <span className="font-manrope text-[14px] leading-none text-primary">{tab.label}</span>
            </button>
          ))}

          {reportsTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setCurrentTab(tab.id); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-4 px-4 py-2 rounded-xl transition-all duration-300 text-left ${currentTab === tab.id ? 'text-primary font-bold border-r-4 border-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-primary text-[18px]" style={{fontVariationSettings: currentTab === tab.id ? "'FILL' 1" : "'FILL' 0"}}>{tab.icon}</span>
              <span className="font-manrope text-[13px] leading-none text-primary">{tab.label}</span>
            </button>
          ))}

          {currentUser?.role === 'admin' && adminTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setCurrentTab(tab.id); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-4 px-4 py-2 rounded-xl transition-all duration-300 text-left ${currentTab === tab.id ? 'text-primary font-bold border-r-4 border-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-primary text-[18px]" style={{fontVariationSettings: currentTab === tab.id ? "'FILL' 1" : "'FILL' 0"}}>{tab.icon}</span>
              <span className="font-manrope text-[13px] leading-none text-primary">{tab.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 mx-4 mb-4 bg-surface-container-lowest/40 rounded-2xl border border-outline-variant shadow-sm space-y-4 mt-auto">
          {/* We omitted new appointment button here because it requires its own state context, but we can pass a prop for it if needed */}
        </div>

        <div className="px-4 pb-8 space-y-1">
          <button onClick={() => {
            handleLogout();
            setCurrentTab('dashboard');
          }} className="w-full flex items-center gap-4 px-4 py-2.5 rounded-xl text-error/80 hover:text-error transition-colors text-left text-[14px]">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-manrope">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
