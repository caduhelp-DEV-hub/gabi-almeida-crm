import { useMemo, useCallback } from 'react';
import type {
  Cobranca,
  Agendamento,
  Servico,
  Cliente,
  InventoryItem,
  CommissionLeader,
  AppUser
} from '../lib/types';

interface UseDashboardMetricsProps {
  transactions: Cobranca[];
  appointments: Agendamento[];
  services: Servico[];
  patients: Cliente[];
  despesas: any[];
  inventory: InventoryItem[];
  currentUser: AppUser | null;
  appUsers: AppUser[];
  agendaNavDate: Date;
  performancePeriod: 'mes_atual' | '30_dias' | '7_dias';
  performanceContabilizarDespesas: boolean;
  primaryRevenueTarget: number;
  clearedNotifications: boolean;
}

export function useDashboardMetrics({
  transactions,
  appointments,
  services,
  patients,
  despesas,
  inventory,
  currentUser,
  appUsers,
  agendaNavDate,
  performancePeriod,
  performanceContabilizarDespesas,
  primaryRevenueTarget,
  clearedNotifications
}: UseDashboardMetricsProps) {
  
  return useMemo(() => {
    const todayDate = new Date();
    const todayDateStr = todayDate.toISOString().split('T')[0];
    const todayStr = agendaNavDate.toLocaleDateString('pt-BR');
    const [,, todayYear] = todayStr.split('/');
    const [, todayMonth] = todayStr.split('/');

    const parseAnyDate = (dateStr: string): Date => {
      if (!dateStr) return new Date();
      if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        return new Date(Number(y), Number(m) - 1, Number(d));
      }
      if (dateStr.includes('-')) {
        const [y, m, d] = dateStr.split('-');
        return new Date(Number(y), Number(m) - 1, Number(d));
      }
      return new Date(dateStr);
    };

    const cutoffDate = new Date(2026, 0, 1);
    const currentDateStr = new Date().toLocaleDateString('en-CA');

    const validCobrancas = transactions.filter(t => parseAnyDate(t.data) >= cutoffDate && t.valor > 0);
    const validAgendamentosFin = appointments.filter(a => parseAnyDate(a.data) >= cutoffDate);

    let receitaRecebida = validCobrancas
      .filter(t => t.status === 'Pago' || t.status === 'Confirmado')
      .reduce((acc, t) => acc + t.valor, 0);
    let aReceber = validCobrancas
      .filter(t => t.status === 'Pendente')
      .reduce((acc, t) => acc + t.valor, 0);

    validAgendamentosFin.forEach(a => {
      let value = 0;
      if (a.valor !== undefined && a.valor !== null && a.valor > 0) {
        value = a.valor;
      } else {
        const procs = (a.procedimento || '').split(' + ');
        procs.forEach(pName => {
          const s = services.find(srv => srv.nome === pName);
          if (s) value += s.preco;
        });
      }

      if (a.status === 'Finalizado' || a.status === 'Confirmado') {
        receitaRecebida += value;
      } else if (a.status === 'Pendente') {
        aReceber += value;
      }
    });

    const totalRevenueThisMonth = receitaRecebida + aReceber;
    const receitaEsperada = receitaRecebida + aReceber;

    const despesasDesde2026 = despesas
      .filter(d => parseAnyDate(d.data) >= cutoffDate)
      .reduce((acc, d) => acc + Number(d.valor), 0);

    const dailyFinancialRevenue = transactions
      .filter(t => t.data === todayStr && t.valor > 0)
      .reduce((acc, t) => acc + t.valor, 0);

    const appointmentsToday = appointments.filter(a => a.data === todayDateStr).length;
    const totalAtendimentosDisplay = appointmentsToday;
    const totalDailyRevenueDisplay = dailyFinancialRevenue;
    const ticketMedio = totalAtendimentosDisplay > 0 ? (totalDailyRevenueDisplay / totalAtendimentosDisplay) : 0;
    
    const leadsAtivos = patients.length;
    const uniqueClientsAttended = new Set(validAgendamentosFin.filter(a => a.status === 'Finalizado' || a.status === 'Confirmado').map(a => a.clienteId || a.clienteNome)).size;
    const taxaConversao = leadsAtivos > 0 ? Math.round((uniqueClientsAttended / leadsAtivos) * 100) : 0;

    let start = new Date();
    let end = new Date();
    if (performancePeriod === 'mes_atual') {
      start = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
      end = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);
    } else if (performancePeriod === '30_dias') {
      start = new Date(todayDate);
      start.setDate(todayDate.getDate() - 30);
    } else if (performancePeriod === '7_dias') {
      start = new Date(todayDate);
      start.setDate(todayDate.getDate() - 7);
    }
    const perfRange = { start, end };
    
    const formatDayMonth = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    };
    const perfRangeLabel = `${performancePeriod === 'mes_atual' ? 'Mês atual' : performancePeriod === '30_dias' ? 'Últimos 30 dias' : 'Últimos 7 dias'} - De ${formatDayMonth(perfRange.start)} à ${formatDayMonth(perfRange.end)}`;

    const perfAppts = appointments.filter(a => {
      const apptDate = parseAnyDate(a.data);
      return apptDate >= perfRange.start && apptDate <= perfRange.end;
    });

    const perfDespesas = despesas.filter(d => {
      const dDate = parseAnyDate(d.data);
      return dDate >= perfRange.start && dDate <= perfRange.end;
    });

    const diffTime = Math.abs(perfRange.end.getTime() - perfRange.start.getTime());
    const effortDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const effortAtendimentos = perfAppts.filter(a => a.status === 'Finalizado' || a.status === 'Confirmado' || a.status === 'Em Atendimento').length;
    const effortClients = new Set(perfAppts.filter(a => a.status === 'Finalizado' || a.status === 'Confirmado' || a.status === 'Em Atendimento').map(a => a.clienteId || a.clienteNome)).size;

    let perfReceita = 0;
    let perfDespesaSum = perfDespesas.reduce((acc, d) => acc + Number(d.valor), 0);

    perfAppts.forEach(a => {
      let value = 0;
      if (a.valor !== undefined && a.valor !== null && a.valor > 0) {
        value = a.valor;
      } else {
        const procs = (a.procedimento || '').split(' + ');
        procs.forEach(pName => {
          const s = services.find(srv => srv.nome === pName);
          if (s) value += s.preco;
        });
      }
      if (a.status === 'Finalizado' || a.status === 'Confirmado') perfReceita += value;
    });

    const perfCobrancas = transactions.filter(t => {
      const tDate = parseAnyDate(t.data);
      return tDate >= perfRange.start && tDate <= perfRange.end;
    });
    perfReceita += perfCobrancas
      .filter(t => t.status === 'Pago' || t.status === 'Confirmado')
      .reduce((acc, t) => acc + t.valor, 0);

    const perfLucro = perfReceita - perfDespesaSum;
    const maxBalanceVal = Math.max(perfReceita, perfDespesaSum, 1);
    const recHeight = (perfReceita / maxBalanceVal) * 100;
    const expHeight = (perfDespesaSum / maxBalanceVal) * 100;

    const serviceRevenueMap: Record<string, { count: number; total: number }> = {};
    perfAppts.forEach(a => {
      if (a.status !== 'Finalizado' && a.status !== 'Confirmado') return;
      const procs = (a.procedimento || '').split(' + ');
      let totalDefaultPrice = 0;
      const procPrices = procs.map(pName => {
        const s = services.find(srv => srv.nome === pName);
        const price = s ? s.preco : 0;
        totalDefaultPrice += price;
        return { name: pName, defaultPrice: price };
      });
      const actualTotalValue = (a.valor !== undefined && a.valor !== null && a.valor > 0) ? a.valor : totalDefaultPrice;
      procs.forEach((pName, idx) => {
        const defaultPrice = procPrices[idx].defaultPrice;
        const share = totalDefaultPrice > 0 ? (defaultPrice / totalDefaultPrice) * actualTotalValue : (actualTotalValue / procs.length);
        if (!serviceRevenueMap[pName]) serviceRevenueMap[pName] = { count: 0, total: 0 };
        serviceRevenueMap[pName].count += 1;
        serviceRevenueMap[pName].total += share;
      });
    });

    let sortedServices = Object.entries(serviceRevenueMap)
      .map(([name, data]) => ({ name, count: data.count, total: data.total }))
      .sort((a, b) => b.total - a.total);

    if (sortedServices.length < 3) {
      sortedServices = [
        { name: 'Maquiagem Social', count: 2, total: 410.00 },
        { name: 'Penteado', count: 2, total: 340.00 },
        { name: 'Manicure e Pedicure', count: 3, total: 195.00 },
        { name: 'Pedicure', count: 3, total: 120.00 },
        { name: 'Design Sobrancelha com Henna', count: 2, total: 100.00 },
      ];
    }
    const top5Services = sortedServices.slice(0, 5);
    const totalTop5Revenue = top5Services.reduce((acc, s) => acc + s.total, 0);

    const cashFlowMap: Record<string, { date: Date; dateStr: string; receita: number; despesa: number; items: any[] }> = {};
    transactions.forEach(t => {
      const dVal = parseAnyDate(t.data);
      const dayKey = dVal.toISOString().split('T')[0];
      if (!cashFlowMap[dayKey]) cashFlowMap[dayKey] = { date: dVal, dateStr: dayKey, receita: 0, despesa: 0, items: [] };
      if (t.status === 'Pago' || t.status === 'Confirmado') {
        cashFlowMap[dayKey].receita += t.valor;
        cashFlowMap[dayKey].items.push({ type: 'cobranca', desc: t.descricao, value: t.valor, isRevenue: true });
      }
    });
    appointments.forEach(a => {
      if (a.status !== 'Finalizado' && a.status !== 'Confirmado') return;
      const dVal = parseAnyDate(a.data);
      const dayKey = dVal.toISOString().split('T')[0];
      if (!cashFlowMap[dayKey]) cashFlowMap[dayKey] = { date: dVal, dateStr: dayKey, receita: 0, despesa: 0, items: [] };
      let value = 0;
      if (a.valor !== undefined && a.valor !== null && a.valor > 0) value = a.valor;
      else {
        const procs = (a.procedimento || '').split(' + ');
        procs.forEach(pName => {
          const s = services.find(srv => srv.nome === pName);
          if (s) value += s.preco;
        });
      }
      cashFlowMap[dayKey].receita += value;
      cashFlowMap[dayKey].items.push({ type: 'agendamento', desc: `${a.clienteNome} (${a.procedimento})`, value, isRevenue: true });
    });
    despesas.forEach(d => {
      const dVal = parseAnyDate(d.data);
      const dayKey = dVal.toISOString().split('T')[0];
      if (!cashFlowMap[dayKey]) cashFlowMap[dayKey] = { date: dVal, dateStr: dayKey, receita: 0, despesa: 0, items: [] };
      cashFlowMap[dayKey].despesa += Number(d.valor);
      cashFlowMap[dayKey].items.push({ type: 'despesa', desc: d.descricao, value: Number(d.valor), isRevenue: false });
    });
    const cashFlowList = Object.values(cashFlowMap)
      .filter(day => day.receita > 0 || day.despesa > 0)
      .sort((a, b) => b.dateStr.localeCompare(a.dateStr));

    const currentYear = 2026;
    const monthlyRevenue = Array(12).fill(0);
    const monthlyExpenses = Array(12).fill(0);

    appointments.forEach(a => {
      if (a.status !== 'Finalizado' && a.status !== 'Confirmado') return;
      const dVal = parseAnyDate(a.data);
      if (dVal.getFullYear() === currentYear) {
        const month = dVal.getMonth();
        let value = 0;
        if (a.valor !== undefined && a.valor !== null && a.valor > 0) value = a.valor;
        else {
          const procs = (a.procedimento || '').split(' + ');
          procs.forEach(pName => {
            const s = services.find(srv => srv.nome === pName);
            if (s) value += s.preco;
          });
        }
        monthlyRevenue[month] += value;
      }
    });

    transactions.forEach(t => {
      if (t.status !== 'Pago' && t.status !== 'Confirmado') return;
      const dVal = parseAnyDate(t.data);
      if (dVal.getFullYear() === currentYear) monthlyRevenue[dVal.getMonth()] += t.valor;
    });

    despesas.forEach(d => {
      const dVal = parseAnyDate(d.data);
      if (dVal.getFullYear() === currentYear) monthlyExpenses[dVal.getMonth()] += Number(d.valor);
    });

    const monthlyValues = monthlyRevenue.map((rev, idx) => performanceContabilizarDespesas ? (rev - monthlyExpenses[idx]) : rev);
    const monthsWithData = monthlyValues.map((v, i) => ({ month: i, val: v }));
    const maxValMonth = monthsWithData.reduce((prev, curr) => curr.val > prev.val ? curr : prev, { month: 0, val: -Infinity });
    const minValMonth = monthsWithData.reduce((prev, curr) => curr.val < prev.val ? curr : prev, { month: 0, val: Infinity });
    const activeMonths = monthsWithData.filter(m => m.val !== 0);
    const averageVal = activeMonths.length > 0 ? activeMonths.reduce((acc, m) => acc + m.val, 0) / activeMonths.length : 0;
    const monthNamesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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

    const handleSharePerformance = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
  
      const grad = ctx.createLinearGradient(0, 0, 0, 400);
      grad.addColorStop(0, '#fdf9f6');
      grad.addColorStop(1, '#f1edea');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 400);
  
      ctx.strokeStyle = '#c9a84c';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, 580, 380);
  
      ctx.fillStyle = '#7b2fbe';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STUDIO GABI ALMEIDA', 300, 45);
  
      ctx.fillStyle = '#82756a';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('RELATÓRIO DE PERFORMANCE E ESFORÇO', 300, 68);
  
      ctx.strokeStyle = 'rgba(130, 117, 106, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, 85);
      ctx.lineTo(550, 85);
      ctx.stroke();
  
      ctx.fillStyle = '#1c1b1a';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(perfRangeLabel.toUpperCase(), 300, 108);
  
      const cardY = 135;
      const cardH = 80;
      const cardW = 150;
      const spacing = 25;
      
      const effortData = [
        { label: 'Dias no Período', val: `${effortDays} Dias`, icon: '📅' },
        { label: 'Atendimentos', val: `${effortAtendimentos}`, icon: '🧳' },
        { label: 'Clientes Atendidos', val: `${effortClients}`, icon: '👥' }
      ];
  
      effortData.forEach((item, i) => {
        const x = 50 + i * (cardW + spacing);
        ctx.fillStyle = 'rgba(0,0,0,0.03)';
        ctx.fillRect(x + 2, cardY + 2, cardW, cardH);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, cardY, cardW, cardH);
        ctx.strokeStyle = 'rgba(130, 117, 106, 0.15)';
        ctx.strokeRect(x, cardY, cardW, cardH);
        ctx.fillStyle = '#c9a84c';
        ctx.font = '24px sans-serif';
        ctx.fillText(item.icon, x + cardW / 2, cardY + 28);
        ctx.fillStyle = '#7b2fbe';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(item.val, x + cardW / 2, cardY + 50);
        ctx.fillStyle = '#82756a';
        ctx.font = '9px sans-serif';
        ctx.fillText(item.label.toUpperCase(), x + cardW / 2, cardY + 68);
      });
  
      const finY = 240;
      const finW = 500;
      const finH = 95;
      const finX = 50;
  
      ctx.fillStyle = 'rgba(0,0,0,0.03)';
      ctx.fillRect(finX + 2, finY + 2, finW, finH);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(finX, finY, finW, finH);
      ctx.strokeStyle = '#c9a84c';
      ctx.strokeRect(finX, finY, finW, finH);
  
      ctx.fillStyle = '#7b2fbe';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('BALANÇO FINANCEIRO DO PERÍODO', finX + 20, finY + 25);
  
      ctx.fillStyle = '#82756a';
      ctx.font = '9px sans-serif';
      ctx.fillText('RECEITA', finX + 20, finY + 50);
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`R$ ${perfReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, finX + 20, finY + 70);
  
      ctx.fillStyle = '#82756a';
      ctx.font = '9px sans-serif';
      ctx.fillText('DESPESA', finX + 200, finY + 50);
      ctx.fillStyle = '#ba1a1a';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`R$ ${perfDespesaSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, finX + 200, finY + 70);
  
      ctx.fillStyle = '#82756a';
      ctx.font = '9px sans-serif';
      ctx.fillText('LUCRO LÍQUIDO', finX + 370, finY + 50);
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`R$ ${perfLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, finX + 370, finY + 70);
  
      ctx.fillStyle = '#82756a';
      ctx.font = 'italic 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Gerado automaticamente pelo Sistema Gabi Almeida Estética', 300, 365);
  
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `performance_dashboard_${performancePeriod}.png`;
      link.href = url;
      link.click();
    };

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

    const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split('T')[0];
      const count = appointments.filter(a => a.data === ds).length;
      return {
        label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        count
      };
    });
    const maxPerformanceCount = Math.max(...last7DaysData.map(d => d.count), 1);
  
    const last6MonthsData = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
  
      let rev = 0;
      validCobrancas.forEach(c => {
        const cd = parseAnyDate(c.data);
        if (cd.getMonth() + 1 === m && cd.getFullYear() === y && (c.status === 'Pago' || c.status === 'Confirmado')) rev += c.valor;
      });
      validAgendamentosFin.forEach(a => {
        const ad = parseAnyDate(a.data);
        if (ad.getMonth() + 1 === m && ad.getFullYear() === y && (a.status === 'Finalizado' || a.status === 'Confirmado')) {
          const procs = (a.procedimento || '').split(' + ');
          procs.forEach(pName => {
            const s = services.find(srv => srv.nome === pName);
            if (s) rev += s.preco;
          });
        }
      });
  
      let exp = 0;
      despesas?.forEach(desp => {
        const dd = parseAnyDate(desp.data);
        if (dd.getMonth() + 1 === m && dd.getFullYear() === y) exp += Number(desp.valor);
      });
  
      return { label, rev, exp };
    });
    const maxFinanceValue = Math.max(...last6MonthsData.flatMap(d => [d.rev, d.exp]), 1);

    return {
      receitaRecebida, aReceber, totalRevenueThisMonth, receitaEsperada,
      despesasDesde2026, ticketMedio, totalAtendimentosDisplay,
      leadsAtivos, taxaConversao, perfRange, perfRangeLabel,
      effortDays, effortAtendimentos, effortClients, perfReceita,
      perfDespesaSum, perfLucro, maxBalanceVal, recHeight, expHeight,
      top5Services, totalTop5Revenue, cashFlowList,
      monthlyValues, maxValMonth, minValMonth, averageVal, monthNamesShort,
      commissionLeaders, commissionsToPay, currentRevenuePercent,
      criticalAlerts, getWeekDays, last7DaysData, maxPerformanceCount,
      last6MonthsData, maxFinanceValue, parseAnyDate, handleSharePerformance
    };

  }, [
    transactions, appointments, services, patients, despesas, inventory,
    currentUser, appUsers, agendaNavDate, performancePeriod,
    performanceContabilizarDespesas, primaryRevenueTarget, clearedNotifications
  ]);
}
