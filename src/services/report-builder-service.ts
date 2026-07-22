import apiClient from "./api-client";

export interface ReporteCampo {
  clave: string;
  etiqueta: string;
  tipo: string;
  filtrable: boolean;
  catalogo?: string | null;
}

export interface ReporteDefinicion {
  idReporteDefinicion: number;
  nombre: string;
  fuente: string;
  columnas: string[];
  filtros: ReporteFiltro[];
  ordenCampo?: string;
  ordenDescendente: boolean;
  agruparPor?: string;
}

export interface ReporteFuente {
  clave: string;
  nombre: string;
  campos: ReporteCampo[];
}

export interface ReporteFiltro {
  campo: string;
  valor?: string;
}

export interface EjecutarReporteRequest {
  fuente: string;
  columnas: string[];
  filtros: ReporteFiltro[];
  ordenCampo?: string;
  ordenDescendente: boolean;
  agruparPor?: string;
}

export interface ReporteSubtotal {
  grupo: string;
  conteo: number;
  sumas: Record<string, number>;
  promedios: Record<string, number>;
}

export interface ReporteResultado {
  columnas: ReporteCampo[];
  filas: Record<string, unknown>[];
  total: number;
  agrupadoPor?: string | null;
  camposNumericos: string[];
  subtotales: ReporteSubtotal[];
  totalGeneral?: ReporteSubtotal | null;
}

export async function getFuentesReporte(): Promise<ReporteFuente[]> {
  const { data } = await apiClient.get<ReporteFuente[]>("/reportes-builder/fuentes");
  return data;
}

export async function ejecutarReporte(request: EjecutarReporteRequest): Promise<ReporteResultado> {
  const { data } = await apiClient.post<ReporteResultado>("/reportes-builder/ejecutar", request);
  return data;
}

export async function getDefinicionesReporte(): Promise<ReporteDefinicion[]> {
  const { data } = await apiClient.get<ReporteDefinicion[]>("/reportes-builder/definiciones");
  return data;
}

export async function guardarDefinicionReporte(def: Omit<ReporteDefinicion, "idReporteDefinicion"> & { idReporteDefinicion?: number }): Promise<ReporteDefinicion> {
  const { data } = await apiClient.post<ReporteDefinicion>("/reportes-builder/definiciones", def);
  return data;
}

export async function eliminarDefinicionReporte(id: number): Promise<void> {
  await apiClient.delete(`/reportes-builder/definiciones/${id}`);
}

export async function exportarReporteExcel(request: EjecutarReporteRequest): Promise<void> {
  const response = await apiClient.post("/reportes-builder/exportar-excel", request, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte_${request.fuente}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function exportarReportePdf(request: EjecutarReporteRequest): Promise<void> {
  const response = await apiClient.post("/reportes-builder/exportar-pdf", request, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte_${request.fuente}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
