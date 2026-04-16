import { ReciboDto } from "@/types/applicant";
import {
  TarifaAdmisionDto,
  CrearTarifaAdmisionDto,
  ActualizarTarifaAdmisionDto,
  GenerarRecibosAdmisionRequestV2,
} from "@/types/tarifa-admision";

import apiClient from "./api-client";

export interface GenerarRecibosAdmisionResult {
  recibosAdmision: ReciboDto[];
  recibosMensualidades: ReciboDto[];
  totalRecibos: number;
}

export async function listarTarifasAdmision(soloActivas?: boolean, esConvenioEmpresarial?: boolean): Promise<TarifaAdmisionDto[]> {
  const params = new URLSearchParams();
  if (soloActivas !== undefined) {
    params.append("soloActivas", soloActivas.toString());
  }
  if (esConvenioEmpresarial !== undefined) {
    params.append("esConvenioEmpresarial", esConvenioEmpresarial.toString());
  }
  const { data } = await apiClient.get<TarifaAdmisionDto[]>(`/TarifaAdmision?${params.toString()}`);
  return data;
}

export async function obtenerTarifaAdmisionPorId(id: number): Promise<TarifaAdmisionDto> {
  const { data } = await apiClient.get<TarifaAdmisionDto>(`/TarifaAdmision/${id}`);
  return data;
}

export async function obtenerTarifaAdmisionPorPlan(idPlanEstudios: number): Promise<TarifaAdmisionDto | null> {
  try {
    const { data } = await apiClient.get<TarifaAdmisionDto>(`/TarifaAdmision/plan/${idPlanEstudios}`);
    return data;
  } catch {
    return null;
  }
}

export async function crearTarifaAdmision(dto: CrearTarifaAdmisionDto): Promise<TarifaAdmisionDto> {
  const { data } = await apiClient.post<TarifaAdmisionDto>("/TarifaAdmision", dto);
  return data;
}

export async function actualizarTarifaAdmision(id: number, dto: ActualizarTarifaAdmisionDto): Promise<TarifaAdmisionDto> {
  const { data } = await apiClient.put<TarifaAdmisionDto>(`/TarifaAdmision/${id}`, dto);
  return data;
}

export async function eliminarTarifaAdmision(id: number): Promise<void> {
  await apiClient.delete(`/TarifaAdmision/${id}`);
}

export async function cambiarEstadoTarifaAdmision(id: number, activo: boolean): Promise<void> {
  await apiClient.patch(`/TarifaAdmision/${id}/estado`, { Activo: activo });
}

export async function descargarCotizacionAdmisionPdf(
  idTarifaAdmision: number,
  idAspirante: number
): Promise<Blob> {
  const response = await apiClient.get(
    `/TarifaAdmision/${idTarifaAdmision}/aspirante/${idAspirante}/cotizacion-pdf`,
    { responseType: "blob" }
  );
  return response.data;
}

export async function descargarCotizacionAdmisionPdfV2(
  idTarifaAdmision: number,
  idAspirante: number,
  request: { conceptos: { idConceptoPago: number; idPromocion: number | null }[]; idEmpresa: number | null }
): Promise<Blob> {
  const response = await apiClient.post(
    `/TarifaAdmision/${idTarifaAdmision}/aspirante/${idAspirante}/cotizacion-pdf-v2`,
    {
      Conceptos: request.conceptos.map((c) => ({
        IdConceptoPago: c.idConceptoPago,
        IdPromocion: c.idPromocion,
      })),
      IdEmpresa: request.idEmpresa,
    },
    { responseType: "blob" }
  );
  return response.data;
}

export async function generarRecibosAdmision(
  idTarifaAdmision: number,
  idAspirante: number,
  pagoCompleto: boolean,
  conceptosIncluidos?: number[],
  descuentoPorcentaje?: number
): Promise<GenerarRecibosAdmisionResult> {
  const { data } = await apiClient.post<GenerarRecibosAdmisionResult>(
    `/TarifaAdmision/${idTarifaAdmision}/generar-recibos/${idAspirante}`,
    {
      PagoCompleto: pagoCompleto,
      ConceptosIncluidos: conceptosIncluidos ?? null,
      DescuentoPorcentaje: descuentoPorcentaje ?? 0,
    }
  );
  return data;
}

export async function generarRecibosAdmisionV2(
  idTarifaAdmision: number,
  idAspirante: number,
  request: GenerarRecibosAdmisionRequestV2
): Promise<GenerarRecibosAdmisionResult> {
  const { data } = await apiClient.post<GenerarRecibosAdmisionResult>(
    `/TarifaAdmision/${idTarifaAdmision}/generar-recibos-v2/${idAspirante}`,
    {
      PagoCompleto: request.pagoCompleto,
      IdEmpresa: request.idEmpresa,
      Conceptos: request.conceptos.map((c) => ({
        IdConceptoPago: c.idConceptoPago,
        IdPromocion: c.idPromocion,
      })),
    }
  );
  return data;
}
