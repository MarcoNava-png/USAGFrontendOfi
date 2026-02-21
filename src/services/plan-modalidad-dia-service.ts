import apiClient from "./api-client";

export interface PlanModalidadDiaDto {
  idPlanModalidadDia: number;
  idPlanEstudios: number;
  nombrePlan: string;
  idModalidad: number;
  nombreModalidad: string;
  idDiaSemana: number;
  nombreDia: string;
}

export interface UpsertPlanModalidadDiaRequest {
  idPlanEstudios: number;
  idModalidad: number;
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
): Promise<void> {
  await apiClient.post(`/PlanModalidadDia`, request);
}
