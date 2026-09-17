import apiClient from "./api-client";

export interface ConfiguracionMatricula {
  idNivelEducativo: number;
  nivelEducativo: string;
  prefijo?: string | null;
  digitos: number;
  activo: boolean;
  descripcion?: string | null;
  tieneRegla: boolean;
  totalEstudiantes: number;
  ejemploMatricula?: string | null;
}

export interface GuardarConfiguracionMatriculaRequest {
  idNivelEducativo: number;
  prefijo?: string | null;
  digitos: number;
  activo: boolean;
  descripcion?: string | null;
}

export async function getConfiguracionMatriculas(): Promise<ConfiguracionMatricula[]> {
  const { data } = await apiClient.get<ConfiguracionMatricula[]>("/configuracion-matricula");
  return data;
}

export async function guardarConfiguracionMatricula(
  request: GuardarConfiguracionMatriculaRequest,
): Promise<ConfiguracionMatricula> {
  const { data } = await apiClient.post<ConfiguracionMatricula>("/configuracion-matricula", request);
  return data;
}
