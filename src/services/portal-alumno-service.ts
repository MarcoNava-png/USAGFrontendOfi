import apiClient from "./api-client";
import type {
  MiPerfil,
  ActualizarMiPerfilRequest,
  MisMaterias,
  MisCalificaciones,
  MiAsistencia,
  MisPagos,
  MiRecibo,
  MisDocumentosOficiales,
  MisDocumentosPendientes,
} from "@/types/portal-alumno";

const BASE = "/portal-alumno";

export async function obtenerMiPerfil(): Promise<MiPerfil> {
  const { data } = await apiClient.get<MiPerfil>(`${BASE}/mi-perfil`);
  return data;
}

export async function actualizarMiPerfil(request: ActualizarMiPerfilRequest): Promise<void> {
  await apiClient.patch(`${BASE}/mi-perfil`, request);
}

export async function obtenerMisMaterias(idPeriodoAcademico?: number): Promise<MisMaterias> {
  const params = idPeriodoAcademico ? `?idPeriodoAcademico=${idPeriodoAcademico}` : "";
  const { data } = await apiClient.get<MisMaterias>(`${BASE}/mis-materias${params}`);
  return data;
}

export async function obtenerMisCalificaciones(idPeriodoAcademico?: number): Promise<MisCalificaciones> {
  const params = idPeriodoAcademico ? `?idPeriodoAcademico=${idPeriodoAcademico}` : "";
  const { data } = await apiClient.get<MisCalificaciones>(`${BASE}/mis-calificaciones${params}`);
  return data;
}

export async function obtenerMiAsistencia(idPeriodoAcademico?: number): Promise<MiAsistencia> {
  const params = idPeriodoAcademico ? `?idPeriodoAcademico=${idPeriodoAcademico}` : "";
  const { data } = await apiClient.get<MiAsistencia>(`${BASE}/mi-asistencia${params}`);
  return data;
}

export async function obtenerMisPagos(): Promise<MisPagos> {
  const { data } = await apiClient.get<MisPagos>(`${BASE}/mis-pagos`);
  return data;
}

export async function obtenerMiReciboDetalle(idRecibo: number): Promise<MiRecibo> {
  const { data } = await apiClient.get<MiRecibo>(`${BASE}/mis-pagos/${idRecibo}`);
  return data;
}

export async function obtenerMisDocumentosPendientes(): Promise<MisDocumentosPendientes> {
  const { data } = await apiClient.get<MisDocumentosPendientes>(`${BASE}/mis-documentos-pendientes`);
  return data;
}

export interface AspiranteDocumentoLecturaDto {
  idAspiranteDocumento: number;
  idDocumentoRequisito: number;
  clave: string;
  descripcion: string;
  estatus: number;
  urlArchivo?: string | null;
  notas?: string | null;
  fechaProrroga?: string | null;
  motivoProrroga?: string | null;
}

export async function obtenerMiExpediente(): Promise<AspiranteDocumentoLecturaDto[]> {
  const { data } = await apiClient.get<AspiranteDocumentoLecturaDto[]>(`${BASE}/mi-expediente`);
  return data;
}

export async function obtenerMisDocumentosOficiales(): Promise<MisDocumentosOficiales> {
  const { data } = await apiClient.get<MisDocumentosOficiales>(`${BASE}/mis-documentos-oficiales`);
  return data;
}
