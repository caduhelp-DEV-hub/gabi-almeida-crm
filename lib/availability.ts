import type { Agendamento, BloqueioAgenda, Servico } from './types';

/**
 * Fonte unica de verdade da disponibilidade/conflito de agenda. Extraido de
 * app/page.tsx (onde essa logica vivia presa dentro de um Client Component,
 * sem forma de ser reutilizada por nada fora do navegador) para que o modulo
 * de WhatsApp (gabi-almeida-whatsapp-bot) chame exatamente a mesma regra que
 * a tela usa, via app/api/bot/*, em vez de reimplementar por conta propria.
 */

export const checkTimeOverlap = (time1: string, dur1: number, time2: string, dur2: number): boolean => {
  if (!time1 || !time2) return false;
  const t1 = time1.split(':').map(Number);
  const start1 = t1[0] * 60 + t1[1];
  const end1 = start1 + dur1;

  const t2 = time2.split(':').map(Number);
  const start2 = t2[0] * 60 + t2[1];
  const end2 = start2 + dur2;

  return start1 < end2 && start2 < end1;
};

export const getServiceDuration = (services: Servico[], procedureName: string): number => {
  if (!procedureName) return 30;
  const names = procedureName.split(' + ');
  let totalDur = 0;
  names.forEach(name => {
    const s = services.find(srv => srv.nome.trim() === name.trim());
    if (s && s.duracao) {
      const d = s.duracao.toLowerCase().trim();
      if (d.includes('h')) {
        const parts = d.split('h');
        const hours = parseInt(parts[0]) || 0;
        const mins = parseInt(parts[1]) || 0;
        totalDur += (hours * 60) + mins;
      } else {
        totalDur += parseInt(d) || 30;
      }
    } else {
      totalDur += 30;
    }
  });
  return totalDur > 0 ? totalDur : 30;
};

/** Bloqueio que cobre um horario: retorna o bloqueio (para exibir a descricao) ou undefined. */
export const findBlockingBlock = (
  blocks: BloqueioAgenda[],
  date: string,
  timeHHMM: string,
  durMin: number,
  profissional: string
): BloqueioAgenda | undefined => {
  return blocks.find(b => {
    if (b.data !== date) return false;
    if (b.profissional !== profissional) return false;
    const durB = b.diaInteiro
      ? 24 * 60
      : (parseInt(b.horaFim.split(':')[0]) * 60 + parseInt(b.horaFim.split(':')[1]))
        - (parseInt(b.horaInicio.split(':')[0]) * 60 + parseInt(b.horaInicio.split(':')[1]));
    const inicio = b.diaInteiro ? '00:00' : b.horaInicio;
    return checkTimeOverlap(inicio.slice(0, 5), durB, timeHHMM, durMin);
  });
};

/** Um agendamento (de qualquer profissional) ocupa esse horario? */
const hasAppointmentConflict = (
  appointments: Agendamento[],
  date: string,
  timeHHMM: string,
  durMin: number,
  profissional: string,
  services: Servico[],
  excludeId?: string
): boolean => {
  return appointments.some(a => {
    if (a.data !== date) return false;
    if (a.profissional !== profissional) return false;
    if (excludeId && a.id === excludeId) return false;
    const durA = getServiceDuration(services, a.procedimento);
    return checkTimeOverlap(a.hora.slice(0, 5), durA, timeHHMM, durMin);
  });
};

export interface GetAvailableSlotsParams {
  date: string;
  profissional: string;
  durationMin: number;
  appointments: Agendamento[];
  blocks: BloqueioAgenda[];
  services: Servico[];
  startHour?: number;
  endHour?: number;
  slotMinutes?: number;
}

/**
 * Lista os horarios livres de um profissional num dia, na mesma grade de 30
 * minutos (08:00-19:00 por padrao) ja usada na grade da Agenda. Um horario e
 * livre quando nao colide com bloqueio nem com outro agendamento do mesmo
 * profissional, e cabe inteiro dentro do expediente.
 */
export const getAvailableSlots = (params: GetAvailableSlotsParams): string[] => {
  const {
    date,
    profissional,
    durationMin,
    appointments,
    blocks,
    services,
    startHour = 8,
    endHour = 19,
    slotMinutes = 30,
  } = params;

  const slots: string[] = [];
  const totalSlots = ((endHour - startHour) * 60) / slotMinutes;

  for (let i = 0; i < totalSlots; i++) {
    const minutesFromStart = i * slotMinutes;
    const hour = startHour + Math.floor(minutesFromStart / 60);
    const minute = minutesFromStart % 60;
    const label = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    const endMinutesFromStart = minutesFromStart + durationMin;
    if (startHour * 60 + endMinutesFromStart > endHour * 60) continue;

    if (findBlockingBlock(blocks, date, label, durationMin, profissional)) continue;
    if (hasAppointmentConflict(appointments, date, label, durationMin, profissional, services)) continue;

    slots.push(label);
  }

  return slots;
};

export { hasAppointmentConflict };
