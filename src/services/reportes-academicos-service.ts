import type { ReporteEstudiantesGrupo } from "@/types/reportes-academicos";

import apiClient from "./api-client";

const BASE = "/reportes-academicos";

// ──────── Datos JSON ────────

export async function getEstudiantesPorGrupo(idGrupo: number): Promise<ReporteEstudiantesGrupo> {
  const { data } = await apiClient.get(`${BASE}/estudiantes-grupo/${idGrupo}`);
  return data;
}

// ──────── PDF Downloads ────────

export async function descargarEstudiantesGrupoPdf(idGrupo: number): Promise<Blob> {
  const { data } = await apiClient.get(`${BASE}/estudiantes-grupo/${idGrupo}/pdf`, {
    responseType: "blob",
  });
  return data;
}

export async function descargarBoletaPdf(idEstudiante: number, idPeriodo: number): Promise<Blob> {
  const { data } = await apiClient.get(`${BASE}/boleta/${idEstudiante}/${idPeriodo}/pdf`, {
    responseType: "blob",
  });
  return data;
}

export async function descargarActaPdf(idGrupoMateria: number, parcialId?: number): Promise<Blob> {
  const params = parcialId ? `?parcialId=${parcialId}` : "";
  const { data } = await apiClient.get(`${BASE}/acta/${idGrupoMateria}/pdf${params}`, {
    responseType: "blob",
  });
  return data;
}

export async function descargarHorarioGrupoPdf(idGrupo: number): Promise<Blob> {
  const { data } = await apiClient.get(`${BASE}/horario-grupo/${idGrupo}/pdf`, {
    responseType: "blob",
  });
  return data;
}

export async function descargarHorarioDocentePdf(idProfesor: number, idPeriodo: number): Promise<Blob> {
  const { data } = await apiClient.get(`${BASE}/horario-docente/${idProfesor}/${idPeriodo}/pdf`, {
    responseType: "blob",
  });
  return data;
}

export async function descargarListaAsistenciaPdf(idGrupoMateria: number): Promise<Blob> {
  const { data } = await apiClient.get(`${BASE}/lista-asistencia/${idGrupoMateria}/pdf`, {
    responseType: "blob",
  });
  return data;
}

// ──────── Reporte de Bajas ────────

function buildBajasParams(idCampus?: number, idPlanEstudios?: number, idPeriodo?: number, mes?: number, anio?: number) {
  const params = new URLSearchParams();
  if (idCampus) params.append("idCampus", idCampus.toString());
  if (idPlanEstudios) params.append("idPlanEstudios", idPlanEstudios.toString());
  if (idPeriodo) params.append("idPeriodo", idPeriodo.toString());
  if (mes) params.append("mes", mes.toString());
  if (anio) params.append("anio", anio.toString());
  return params.toString() ? `?${params.toString()}` : "";
}

export async function getReporteBajas(idCampus?: number, idPlanEstudios?: number, idPeriodo?: number, mes?: number, anio?: number) {
  const { data } = await apiClient.get(`${BASE}/bajas${buildBajasParams(idCampus, idPlanEstudios, idPeriodo, mes, anio)}`);
  return data;
}

export async function descargarReporteBajasPdf(idCampus?: number, idPlanEstudios?: number, idPeriodo?: number, mes?: number, anio?: number): Promise<Blob> {
  const { data } = await apiClient.get(`${BASE}/bajas/pdf${buildBajasParams(idCampus, idPlanEstudios, idPeriodo, mes, anio)}`, { responseType: "blob" });
  return data;
}

export async function descargarReporteBajasExcel(idCampus?: number, idPlanEstudios?: number, idPeriodo?: number, mes?: number, anio?: number): Promise<Blob> {
  const { data } = await apiClient.get(`${BASE}/bajas/excel${buildBajasParams(idCampus, idPlanEstudios, idPeriodo, mes, anio)}`, { responseType: "blob" });
  return data;
}

// ──────── Excel Downloads ────────

export async function descargarEstudiantesGrupoExcel(idGrupo: number): Promise<Blob> {
  const { data } = await apiClient.get(`${BASE}/estudiantes-grupo/${idGrupo}/excel`, {
    responseType: "blob",
  });
  return data;
}

export async function descargarHorarioGrupoExcel(idGrupo: number): Promise<Blob> {
  const { data } = await apiClient.get(`${BASE}/horario-grupo/${idGrupo}/excel`, {
    responseType: "blob",
  });
  return data;
}

export async function descargarHorarioDocenteExcel(idProfesor: number, idPeriodo: number): Promise<Blob> {
  const { data } = await apiClient.get(`${BASE}/horario-docente/${idProfesor}/${idPeriodo}/excel`, {
    responseType: "blob",
  });
  return data;
}

export async function descargarPlanesEstudioExcel(): Promise<Blob> {
  const { data } = await apiClient.get(`${BASE}/planes-estudio/excel`, {
    responseType: "blob",
  });
  return data;
}

// ──────── Auxiliar: catálogos para selectores ────────

export async function getGrupos(idPeriodo?: number) {
  const params = idPeriodo ? `?idPeriodoAcademico=${idPeriodo}` : "";
  const { data } = await apiClient.get(`/grupos${params}`);
  return data;
}

export async function getPeriodosAcademicos() {
  const { data } = await apiClient.get("/PeriodoAcademico");
  return data;
}

export async function getGrupoMaterias(idGrupo: number) {
  const { data } = await apiClient.get(`/grupos/${idGrupo}/materias`);
  return data;
}

export async function getParciales() {
  const { data } = await apiClient.get("/parciales");
  return data;
}

export async function getProfesores() {
  const { data } = await apiClient.get("/Profesor");
  return data;
}

export async function getEstudiantes(page: number = 1, pageSize: number = 1000) {
  const { data } = await apiClient.get(`/estudiantes?page=${page}&pageSize=${pageSize}`);
  return data;
}

// ──────── Helper: descargar blob ────────

export function descargarBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
