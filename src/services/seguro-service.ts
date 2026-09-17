import apiClient from "./api-client";

export interface SeguroEstudianteDto {
  idSeguroEstudiante: number;
  idEstudiante: number;
  matricula?: string | null;
  aseguradora: string;
  numeroPoliza?: string | null;
  vigenciaDesde?: string | null;
  vigenciaHasta?: string | null;
  pagado: boolean;
  estadoVigencia: string;
  estadoPago: string;
}

export async function obtenerSeguroEstudiante(idEstudiante: number): Promise<SeguroEstudianteDto | null> {
  const { data } = await apiClient.get<SeguroEstudianteDto | null>(`/seguros/estudiante/${idEstudiante}`);
  return data ?? null;
}

export async function obtenerMiSeguro(): Promise<SeguroEstudianteDto | null> {
  const { data } = await apiClient.get<SeguroEstudianteDto | null>(`/portal-alumno/mi-seguro`);
  return data ?? null;
}
