import apiClient from "@/services/api-client";

export interface InconsistenciaInscripcion {
  idEstudiante: number;
  matricula: string;
  nombreCompleto: string;
  tipo: string;
  descripcion: string;
  idGrupo?: number | null;
  codigoGrupo?: string | null;
  idGrupoSobrante?: number | null;
  codigoGrupoSobrante?: string | null;
}

export interface RepararInscripcionResult {
  exitoso: boolean;
  mensaje: string;
}

export async function getInconsistencias(idPeriodoAcademico: number): Promise<InconsistenciaInscripcion[]> {
  const { data } = await apiClient.get<InconsistenciaInscripcion[]>(`/diagnostico-inscripcion/${idPeriodoAcademico}`);
  return data;
}

export async function repararInconsistencia(req: {
  idEstudiante: number;
  tipo: string;
  idGrupo?: number | null;
  idGrupoSobrante?: number | null;
}): Promise<RepararInscripcionResult> {
  const { data } = await apiClient.post<RepararInscripcionResult>(`/diagnostico-inscripcion/reparar`, req);
  return data;
}
