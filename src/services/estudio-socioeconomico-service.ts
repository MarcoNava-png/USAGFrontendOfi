import apiClient from "@/services/api-client";
import {
  Analista,
  CatalogosEstudio,
  EstudioPublico,
  EstudioSocioeconomico,
  EstudioSocioeconomicoRequest,
} from "@/types/estudio-socioeconomico";

const BASE = "/estudio-socioeconomico";

export async function getCatalogosEstudio(): Promise<CatalogosEstudio> {
  const { data } = await apiClient.get<CatalogosEstudio>(`${BASE}/catalogos`);
  return data;
}

export async function getAnalistas(): Promise<Analista[]> {
  const { data } = await apiClient.get<Analista[]>(`${BASE}/analistas`);
  return data;
}

export async function getEstudioPorAspirante(idAspirante: number): Promise<EstudioSocioeconomico | null> {
  const { data } = await apiClient.get<EstudioSocioeconomico | null>(`${BASE}/aspirante/${idAspirante}`);
  return data;
}

export async function guardarEstudioAspirante(
  idAspirante: number,
  req: EstudioSocioeconomicoRequest,
): Promise<EstudioSocioeconomico> {
  const { data } = await apiClient.put<EstudioSocioeconomico>(`${BASE}/aspirante/${idAspirante}`, req);
  return data;
}

export async function generarTokenEstudio(idAspirante: number): Promise<{ token: string; url: string }> {
  const { data } = await apiClient.post<{ token: string; url: string }>(`${BASE}/aspirante/${idAspirante}/token`, {});
  return data;
}

export async function getEstudioPublico(token: string): Promise<EstudioPublico> {
  const { data } = await apiClient.get<EstudioPublico>(`${BASE}/publico/${token}`);
  return data;
}

export async function guardarEstudioPublico(
  token: string,
  req: EstudioSocioeconomicoRequest,
): Promise<EstudioSocioeconomico> {
  const { data } = await apiClient.put<EstudioSocioeconomico>(`${BASE}/publico/${token}`, req);
  return data;
}
