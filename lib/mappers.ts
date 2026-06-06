import type { AppUser, Patient, Appointment, InventoryItem } from './types';

export const mapUserToFrontend = (u: any): AppUser => ({
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

export const mapUserToBackend = (u: Partial<AppUser>): Record<string, unknown> => {
  const res: Record<string, unknown> = {};
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

export const mapPatientToFrontend = (p: any): Patient => ({
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
  evolutionPhotos: p.evolution_photos || [],
  timeline: p.timeline || [],
  phone: p.phone,
  cpf: p.cpf,
  pronoun: p.pronoun
});

export const mapPatientToBackend = (p: Partial<Patient>): Record<string, unknown> => {
  const res: Record<string, unknown> = {};
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
  if (p.evolutionPhotos !== undefined) res.evolution_photos = p.evolutionPhotos;
  if (p.timeline !== undefined) res.timeline = p.timeline;
  if (p.phone !== undefined) res.phone = p.phone;
  if (p.cpf !== undefined) res.cpf = p.cpf;
  if (p.pronoun !== undefined) res.pronoun = p.pronoun;
  return res;
};

export const mapAppointmentToFrontend = (a: any): Appointment => ({
  id: a.id,
  patientId: a.patient_id,
  time: a.time,
  patientName: a.patients?.name || a.patient_name,
  patientAvatar: a.patients?.avatar || a.patient_avatar,
  procedure: a.procedure,
  status: a.status,
  professional: a.professional,
  category: a.category,
  notes: a.notes,
  date: a.date || new Date().toISOString().split('T')[0]
});

export const mapAppointmentToBackend = (a: Partial<Appointment>): Record<string, unknown> => {
  const res: Record<string, unknown> = {};
  if (a.id !== undefined) res.id = a.id;
  if (a.patientId !== undefined) res.patient_id = a.patientId;
  if (a.time !== undefined) res.time = a.time;
  if (a.patientName !== undefined) res.patient_name = a.patientName;
  if (a.patientAvatar !== undefined) res.patient_avatar = a.patientAvatar;
  if (a.procedure !== undefined) res.procedure = a.procedure;
  if (a.status !== undefined) res.status = a.status;
  if (a.professional !== undefined) res.professional = a.professional;
  if (a.category !== undefined) res.category = a.category;
  if (a.notes !== undefined) res.notes = a.notes;
  if (a.date !== undefined) res.date = a.date;
  return res;
};

export const mapInventoryToFrontend = (i: any): InventoryItem => ({
  id: i.id,
  name: i.name,
  quantity: Number(i.quantity || 0),
  minQuantity: Number(i.min_quantity || 0),
  unit: i.unit
});

export const mapInventoryToBackend = (i: Partial<InventoryItem>): Record<string, unknown> => {
  const res: Record<string, unknown> = {};
  if (i.id !== undefined) res.id = i.id;
  if (i.name !== undefined) res.name = i.name;
  if (i.quantity !== undefined) res.quantity = i.quantity;
  if (i.minQuantity !== undefined) res.min_quantity = i.minQuantity;
  if (i.unit !== undefined) res.unit = i.unit;
  return res;
};

export const getAppointmentColorClass = (status: string): string => {
  switch (status) {
    case 'Finalizado':
      return 'bg-emerald-50/90 border-emerald-500 text-emerald-800 hover:bg-emerald-100/90';
    case 'Em Atendimento':
      return 'bg-cyan-50/90 border-cyan-500 text-cyan-800 hover:bg-cyan-100/90';
    case 'Confirmado':
      return 'bg-amber-50/90 border-amber-500 text-amber-800 hover:bg-amber-100/90';
    case 'Pendente':
    default:
      return 'bg-slate-50/90 border-slate-400 text-slate-700 hover:bg-slate-100/90';
  }
};
