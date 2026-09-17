import type {
  CalificacionParcial,
  CalificacionParcialCreateRequest,
  CalificacionParcialEstadoRequest,
  CalificacionDetalle,
  CalificacionDetalleUpsertRequest,
  ConcentradoAlumno,
  ConcentradoGrupoParcial,
  ValidacionPesos,
  Parcial,
  ParcialesRequest,
} from "@/types/calificaciones";
import type { PaginatedResponse } from "@/types/paginated-response";

import apiClient from "./api-client";

export async function getParciales(page = 1, pageSize = 100): Promise<PaginatedResponse<Parcial>> {
  const { data } = await apiClient.get<PaginatedResponse<Parcial>>(`/Parciales?page=${page}&pageSize=${pageSize}`);
  return data;
}

export interface ConcentradoCelda {
  idGrupoMateria: number
  idInscripcion: number
  calificacionFinal: number | null
  estado: string | null
}

export interface ConcentradoMateria {
  idGrupoMateria: number
  clave: string
  nombre: string
  profesor: string | null
}

export interface ConcentradoAlumnoFinal {
  idEstudiante: number
  matricula: string
  nombreCompleto: string
  esBaja?: boolean
  calificaciones: ConcentradoCelda[]
}

export interface ConcentradoFinalGrupo {
  idGrupo: number
  nombreGrupo: string
  periodo: string
  planEstudios: string
  campus: string
  numeroCuatrimestre: number | null
  minimaAprobatoria: number
  escalaMaxima: number
  materias: ConcentradoMateria[]
  alumnos: ConcentradoAlumnoFinal[]
}

export interface FinalDirectoItem {
  inscripcionId: number
  idEstudiante: number
  calificacionFinal: number
}

export interface FinalDirectoRequest {
  grupoMateriaId: number
  items: FinalDirectoItem[]
}

export interface FinalDirectoResultado {
  guardadas: number
  omitidas: number
  errores: string[]
}

export interface GrupoCapturaHistorial {
  idGrupo: number
  nombreGrupo: string
  codigoGrupo: string | null
  planEstudios: string
  periodo: string
  periodoClave: string
  campus: string
  numeroCuatrimestre: number | null
  totalAlumnos: number
  totalMaterias: number
  celdasTotales: number
  celdasCapturadas: number
  porcentaje: number
}

export async function getGruposParaCaptura(filtros: {
  idPeriodo?: number
  idPlan?: number
  idCampus?: number
}): Promise<GrupoCapturaHistorial[]> {
  const params = new URLSearchParams()
  if (filtros.idPeriodo) params.set("idPeriodo", String(filtros.idPeriodo))
  if (filtros.idPlan) params.set("idPlan", String(filtros.idPlan))
  if (filtros.idCampus) params.set("idCampus", String(filtros.idCampus))
  const { data } = await apiClient.get<GrupoCapturaHistorial[]>(`/Calificaciones/grupos-captura?${params.toString()}`)
  return data
}

export interface GeneracionCaptura {
  etiqueta: string
  campus: string
  planEstudios: string
  avance: number
  totalGrupos: number
  cuatrimestresPendientes: number
  grupos: GrupoCapturaHistorial[]
}

export async function getGeneracionesParaCaptura(filtros: {
  idPlan?: number
  idCampus?: number
}): Promise<GeneracionCaptura[]> {
  const params = new URLSearchParams()
  if (filtros.idPlan) params.set("idPlan", String(filtros.idPlan))
  if (filtros.idCampus) params.set("idCampus", String(filtros.idCampus))
  const { data } = await apiClient.get<GeneracionCaptura[]>(`/Calificaciones/generaciones-captura?${params.toString()}`)
  return data
}

export async function getConcentradoFinalGrupo(idGrupo: number): Promise<ConcentradoFinalGrupo> {
  const { data } = await apiClient.get<ConcentradoFinalGrupo>(`/Calificaciones/concentrado-final/grupo/${idGrupo}`);
  return data;
}

export interface CuatrimestreHistorial {
  numeroCuatrimestre: number
  idGrupo: number
  nombreGrupo: string
  periodo: string
  periodoClave: string
  materias: ConcentradoMateria[]
  alumnos: ConcentradoAlumnoFinal[]
}

export interface HistorialCohorte {
  idGrupoEntrada: number
  nombreGrupo: string
  planEstudios: string
  campus: string
  minimaAprobatoria: number
  escalaMaxima: number
  cuatrimestres: CuatrimestreHistorial[]
}

export async function getHistorialCohorte(idGrupo: number): Promise<HistorialCohorte> {
  const { data } = await apiClient.get<HistorialCohorte>(`/Calificaciones/historial-cohorte/grupo/${idGrupo}`);
  return data;
}

export async function guardarFinalDirecto(request: FinalDirectoRequest): Promise<FinalDirectoResultado> {
  const { data } = await apiClient.post<FinalDirectoResultado>(`/Calificaciones/final-directo`, request);
  return data;
}

export async function createParcial(request: ParcialesRequest): Promise<Parcial> {
  const { data } = await apiClient.post<Parcial>("/Parciales", request);
  return data;
}

export async function updateParcial(parcial: Parcial): Promise<Parcial> {
  const { data } = await apiClient.put<Parcial>("/Parciales", parcial);
  return data;
}

export async function getCalificacionesPorGrupo(
  grupoMateriaId: number,
  parcialId: number
): Promise<CalificacionParcial[]> {
  const { data } = await apiClient.get<CalificacionParcial[]>(
    `/Calificaciones/${grupoMateriaId}/${parcialId}`
  );
  return data;
}

export async function abrirParcial(request: CalificacionParcialCreateRequest): Promise<CalificacionParcial> {
  const { data } = await apiClient.post<CalificacionParcial>("/Calificaciones/parciales", request);
  return data;
}

export async function getParcialById(id: number): Promise<CalificacionParcial> {
  const { data } = await apiClient.get<CalificacionParcial>(`/Calificaciones/parciales/${id}`);
  return data;
}

export async function cambiarEstadoParcial(
  id: number,
  request: CalificacionParcialEstadoRequest
): Promise<void> {
  await apiClient.patch(`/Calificaciones/parciales/${id}/estado`, request);
}

export async function upsertCalificacion(request: CalificacionDetalleUpsertRequest): Promise<CalificacionDetalle> {
  const { data } = await apiClient.post<CalificacionDetalle>("/Calificaciones/detalle", request);
  return data;
}

export async function getDetallesCalificaciones(filters: {
  grupoMateriaId?: number;
  parcialId?: number;
  inscripcionId?: number;
  tipoEvaluacionEnum?: number;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<CalificacionDetalle>> {
  const params = new URLSearchParams();
  if (filters.grupoMateriaId) params.append("grupoMateriaId", filters.grupoMateriaId.toString());
  if (filters.parcialId) params.append("parcialId", filters.parcialId.toString());
  if (filters.inscripcionId) params.append("inscripcionId", filters.inscripcionId.toString());
  if (filters.tipoEvaluacionEnum !== undefined) params.append("tipoEvaluacionEnum", filters.tipoEvaluacionEnum.toString());
  params.append("page", (filters.page || 1).toString());
  params.append("pageSize", (filters.pageSize || 20).toString());

  const { data } = await apiClient.get<PaginatedResponse<CalificacionDetalle>>(
    `/Calificaciones/detalles?${params.toString()}`
  );
  return data;
}

export async function getConcentradoAlumno(inscripcionId: number): Promise<ConcentradoAlumno> {
  const { data } = await apiClient.get<ConcentradoAlumno>(`/Calificaciones/concentrado/alumno/${inscripcionId}`);
  return data;
}

export async function getConcentradoGrupoParcial(
  grupoMateriaId: number,
  parcialId: number
): Promise<ConcentradoGrupoParcial> {
  const { data } = await apiClient.get<ConcentradoGrupoParcial>(
    `/Calificaciones/concentrado/grupo/${grupoMateriaId}/parcial/${parcialId}`
  );
  return data;
}

export async function validarPesosEvaluacion(calificacionParcialId: number): Promise<ValidacionPesos> {
  const { data } = await apiClient.get<ValidacionPesos>(
    `/Calificaciones/parciales/${calificacionParcialId}/validar-pesos`
  );
  return data;
}
