import apiClient from "./api-client";
import type {
  AccesosLista,
  CrearAccesoRequest,
  ResetearPasswordRequest,
  ResetearPasswordResponse,
} from "@/types/acceso-alumno-docente";

const BASE = "/accesos-alumnos-docentes";

export async function listarAccesos(params: {
  tipo: "alumno" | "docente";
  busqueda?: string;
  pagina?: number;
  tamanoPagina?: number;
}): Promise<AccesosLista> {
  const query = new URLSearchParams();
  query.set("tipo", params.tipo);
  if (params.busqueda) query.set("busqueda", params.busqueda);
  query.set("pagina", String(params.pagina ?? 1));
  query.set("tamanoPagina", String(params.tamanoPagina ?? 20));
  const { data } = await apiClient.get<AccesosLista>(`${BASE}?${query.toString()}`);
  return data;
}

export async function resetearPassword(request: ResetearPasswordRequest): Promise<ResetearPasswordResponse> {
  const { data } = await apiClient.post<ResetearPasswordResponse>(`${BASE}/resetear-password`, request);
  return data;
}

export async function desbloquearCuenta(userId: string): Promise<void> {
  await apiClient.post(`${BASE}/${userId}/desbloquear`);
}

export async function crearAcceso(request: CrearAccesoRequest): Promise<ResetearPasswordResponse> {
  const { data } = await apiClient.post<ResetearPasswordResponse>(`${BASE}/crear-acceso`, request);
  return data;
}
