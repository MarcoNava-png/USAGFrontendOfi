import { EmpresaDto, CrearEmpresaDto, ActualizarEmpresaDto } from "@/types/empresa";
import apiClient from "./api-client";

export async function listarEmpresas(soloActivas?: boolean): Promise<EmpresaDto[]> {
  const params = new URLSearchParams();
  if (soloActivas !== undefined) {
    params.append("soloActivas", soloActivas.toString());
  }
  const { data } = await apiClient.get<EmpresaDto[]>(`/Empresa?${params.toString()}`);
  return data;
}

export async function obtenerEmpresaPorId(id: number): Promise<EmpresaDto> {
  const { data } = await apiClient.get<EmpresaDto>(`/Empresa/${id}`);
  return data;
}

export async function crearEmpresa(dto: CrearEmpresaDto): Promise<EmpresaDto> {
  const { data } = await apiClient.post<EmpresaDto>("/Empresa", dto);
  return data;
}

export async function actualizarEmpresa(id: number, dto: ActualizarEmpresaDto): Promise<EmpresaDto> {
  const { data } = await apiClient.put<EmpresaDto>(`/Empresa/${id}`, dto);
  return data;
}

export async function eliminarEmpresa(id: number): Promise<void> {
  await apiClient.delete(`/Empresa/${id}`);
}

export async function cambiarEstadoEmpresa(id: number, activo: boolean): Promise<void> {
  await apiClient.patch(`/Empresa/${id}/estado`, { Activo: activo });
}
