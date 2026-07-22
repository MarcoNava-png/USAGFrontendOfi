import apiClient from "./api-client";

const BASE = "/ventana-captura";

export interface VentanaCaptura {
  idVentanaCaptura: number;
  idPeriodoAcademico: number;
  numeroParcial: number;
  abierta: boolean;
  fechaApertura?: string | null;
  fechaLimite?: string | null;
  vigente: boolean;
}

export interface EstadoCaptura {
  numeroParcial: number;
  puedeCapturar: boolean;
  ventanaAbierta: boolean;
  fechaLimite?: string | null;
  tieneProrrogaAprobada: boolean;
  fechaLimiteProrroga?: string | null;
  prorrogaPendiente?: string | null;
  mensaje: string;
}

export interface SolicitudProrroga {
  idSolicitudProrroga: number;
  idProfesor: number;
  profesor: string;
  idGrupoMateria: number;
  grupo: string;
  materia: string;
  numeroParcial: number;
  motivo?: string | null;
  fechaSolicitud: string;
  estado: string;
  fechaLimiteProrroga?: string | null;
  fechaResolucion?: string | null;
  notaResolucion?: string | null;
}

export interface AvanceItem {
  idGrupoMateria: number;
  grupo: string;
  materia: string;
  idProfesor?: number | null;
  profesor: string;
  idCampus?: number | null;
  campus?: string | null;
  estado: string;
  ultimaActualizacion?: string | null;
}

export interface AvanceCaptura {
  idPeriodoAcademico: number;
  numeroParcial: number;
  total: number;
  capturados: number;
  pendientes: number;
  items: AvanceItem[];
}

export async function getVentanas(idPeriodoAcademico: number): Promise<VentanaCaptura[]> {
  const { data } = await apiClient.get<VentanaCaptura[]>(`${BASE}?idPeriodoAcademico=${idPeriodoAcademico}`);
  return data;
}

export async function abrirVentana(
  idPeriodoAcademico: number,
  numeroParcial: number,
  fechaLimite?: string | null,
): Promise<VentanaCaptura> {
  const { data } = await apiClient.post<VentanaCaptura>(`${BASE}/abrir`, {
    idPeriodoAcademico,
    numeroParcial,
    fechaLimite: fechaLimite ?? null,
  });
  return data;
}

export async function cerrarVentana(idPeriodoAcademico: number, numeroParcial: number): Promise<VentanaCaptura> {
  const { data } = await apiClient.post<VentanaCaptura>(`${BASE}/cerrar`, { idPeriodoAcademico, numeroParcial });
  return data;
}

export async function getEstadoCaptura(idGrupoMateria: number, numeroParcial: number): Promise<EstadoCaptura> {
  const { data } = await apiClient.get<EstadoCaptura>(
    `${BASE}/estado?idGrupoMateria=${idGrupoMateria}&numeroParcial=${numeroParcial}`,
  );
  return data;
}

export async function solicitarProrroga(
  idGrupoMateria: number,
  numeroParcial: number,
  motivo?: string,
): Promise<SolicitudProrroga> {
  const { data } = await apiClient.post<SolicitudProrroga>(`${BASE}/prorroga`, {
    idGrupoMateria,
    numeroParcial,
    motivo,
  });
  return data;
}

export async function getMisProrrogas(): Promise<SolicitudProrroga[]> {
  const { data } = await apiClient.get<SolicitudProrroga[]>(`${BASE}/mis-prorrogas`);
  return data;
}

export async function getProrrogas(estado?: string): Promise<SolicitudProrroga[]> {
  const qs = estado ? `?estado=${encodeURIComponent(estado)}` : "";
  const { data } = await apiClient.get<SolicitudProrroga[]>(`${BASE}/prorrogas${qs}`);
  return data;
}

export async function resolverProrroga(
  id: number,
  aprobar: boolean,
  fechaLimiteProrroga?: string | null,
  nota?: string,
): Promise<SolicitudProrroga> {
  const { data } = await apiClient.post<SolicitudProrroga>(`${BASE}/prorroga/${id}/resolver`, {
    aprobar,
    fechaLimiteProrroga: fechaLimiteProrroga ?? null,
    nota,
  });
  return data;
}

export async function getAvance(idPeriodoAcademico: number, numeroParcial: number): Promise<AvanceCaptura> {
  const { data } = await apiClient.get<AvanceCaptura>(
    `${BASE}/avance?idPeriodoAcademico=${idPeriodoAcademico}&numeroParcial=${numeroParcial}`,
  );
  return data;
}
