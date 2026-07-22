import apiClient from "./api-client";

export interface ConfiguracionCalificaciones {
  idConfiguracionCalificaciones: number;
  escalaMaxima: number;
  calificacionMinimaAprobatoria: number;
  decimales: number;
  redondearAlEntero: boolean;
}

export interface Parcial {
  id: number;
  name: string;
  orden: number;
}

export async function getConfiguracionCalificaciones(): Promise<ConfiguracionCalificaciones> {
  const { data } = await apiClient.get<ConfiguracionCalificaciones>("/configuracion-calificaciones");
  return data;
}

export async function guardarConfiguracionCalificaciones(
  config: ConfiguracionCalificaciones,
): Promise<ConfiguracionCalificaciones> {
  const { data } = await apiClient.put<ConfiguracionCalificaciones>("/configuracion-calificaciones", config);
  return data;
}

export async function getParciales(): Promise<Parcial[]> {
  const { data } = await apiClient.get<Parcial[]>("/configuracion-calificaciones/parciales");
  return data;
}

export async function guardarParcial(parcial: Parcial): Promise<Parcial> {
  if (parcial.id > 0) {
    const { data } = await apiClient.put<Parcial>("/configuracion-calificaciones/parciales", parcial);
    return data;
  }
  const { data } = await apiClient.post<Parcial>("/configuracion-calificaciones/parciales", parcial);
  return data;
}

export async function eliminarParcial(id: number): Promise<void> {
  await apiClient.delete(`/configuracion-calificaciones/parciales/${id}`);
}
