import apiClient from "./api-client";

export interface PreInscripcionDto {
  idPreInscripcion: number;
  idEstudiante: number;
  matricula: string;
  nombreCompleto: string;
  idPlanEstudios: number;
  clavePlan: string;
  planEstudios: string;
  idPeriodoAcademicoDestino: number;
  periodoClave: string;
  periodoNombre: string;
  numeroCuatrimestreObjetivo: number;
  estado: string;
  nota?: string;
  fechaApartado: string;
}

export interface ApartarParaPeriodoRequest {
  idEstudiante: number;
  idPlanEstudios: number;
  idPeriodoAcademicoDestino: number;
  numeroCuatrimestreObjetivo: number;
  nota?: string;
}

export async function apartarParaPeriodo(req: ApartarParaPeriodoRequest): Promise<PreInscripcionDto> {
  const { data } = await apiClient.post<PreInscripcionDto>(`/preinscripciones`, req);
  return data;
}

export async function getPendientes(
  idPlanEstudios?: number,
  idPeriodoAcademico?: number
): Promise<PreInscripcionDto[]> {
  const params = new URLSearchParams();
  if (idPlanEstudios) params.append("idPlanEstudios", idPlanEstudios.toString());
  if (idPeriodoAcademico) params.append("idPeriodoAcademico", idPeriodoAcademico.toString());
  const qs = params.toString();
  const { data } = await apiClient.get<PreInscripcionDto[]>(`/preinscripciones/pendientes${qs ? `?${qs}` : ""}`);
  return data;
}

export async function asignarGrupoPreinscripcion(
  idPreInscripcion: number,
  idGrupo: number
): Promise<void> {
  await apiClient.post(`/preinscripciones/${idPreInscripcion}/asignar-grupo`, { idGrupo });
}

export async function cancelarPreinscripcion(idPreInscripcion: number): Promise<void> {
  await apiClient.post(`/preinscripciones/${idPreInscripcion}/cancelar`);
}
