import { superAdminAxios } from "./super-admin-auth-service";

const BASE = "/admin/tenants/tickets";

export interface TicketAgremiado {
  tenantCodigo: string;
  tenantNombre: string;
  idTicket: number;
  folio: string;
  titulo: string;
  descripcion: string;
  nombreCreador: string;
  prioridadValor: number;
  prioridad: string;
  estatusValor: number;
  estatus: string;
  categoria: string;
  areaDestino?: string | null;
  nombreAsignado?: string | null;
  totalComentarios: number;
  fechaCreacion: string;
  fechaCierre?: string | null;
}

export interface TicketsAgremiadosResumen {
  totalEscuelasConTickets: number;
  totalTickets: number;
  totalAbiertos: number;
  tickets: TicketAgremiado[];
}

export interface TicketComentarioAgremiado {
  idComentario: number;
  nombreUsuario: string;
  contenido: string;
  esAdmin: boolean;
  fechaCreacion: string;
}

export async function getTicketsAgremiados(soloAbiertos = true): Promise<TicketsAgremiadosResumen> {
  const { data } = await superAdminAxios.get<TicketsAgremiadosResumen>(BASE, { params: { soloAbiertos } });
  return data;
}

export async function getComentariosTicket(tenantCodigo: string, idTicket: number): Promise<TicketComentarioAgremiado[]> {
  const { data } = await superAdminAxios.get<TicketComentarioAgremiado[]>(`${BASE}/${tenantCodigo}/${idTicket}/comentarios`);
  return data;
}

export async function responderTicket(tenantCodigo: string, idTicket: number, texto: string): Promise<void> {
  await superAdminAxios.post(`${BASE}/${tenantCodigo}/${idTicket}/responder`, { texto });
}

export async function cambiarEstatusTicket(tenantCodigo: string, idTicket: number, nuevoEstatus: number): Promise<void> {
  await superAdminAxios.post(`${BASE}/${tenantCodigo}/${idTicket}/estatus`, { nuevoEstatus });
}
