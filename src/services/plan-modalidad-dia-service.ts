import apiClient from "./api-client";

export interface PlanModalidadDiaDto {
  idPlanModalidadDia: number;
  idPlanEstudios: number;
  nombrePlan: string;
  idModalidad: number;
  nombreModalidad: string;
  grupo: number;
  idDiaSemana: number;
  nombreDia: string;
}

export interface UpsertPlanModalidadDiaRequest {
  idPlanEstudios: number;
  idModalidad: number;
  grupo: number;
  diasIds: number[];
}

export async function getDiasForPlanModalidad(
  idPlanEstudios: number,
  idModalidad: number
): Promise<PlanModalidadDiaDto[]> {
  const { data } = await apiClient.get<PlanModalidadDiaDto[]>(
    `/PlanModalidadDia?idPlanEstudios=${idPlanEstudios}&idModalidad=${idModalidad}`
  );
  return data;
}

export async function getAllPlanModalidadDias(): Promise<PlanModalidadDiaDto[]> {
  const { data } = await apiClient.get<PlanModalidadDiaDto[]>(
    `/PlanModalidadDia/all`
  );
  return data;
}

export async function upsertPlanModalidadDia(
  request: UpsertPlanModalidadDiaRequest
): Promise<{ mensaje: string; grupo: number }> {
  const { data } = await apiClient.post(`/PlanModalidadDia`, request);
  return data;
}

export async function eliminarGrupoDias(
  idPlanEstudios: number,
  idModalidad: number,
  grupo: number
): Promise<void> {
  await apiClient.delete(`/PlanModalidadDia/${idPlanEstudios}/${idModalidad}/${grupo}`);
}
