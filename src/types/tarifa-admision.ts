export interface TarifaAdmisionDetalleDto {
  idTarifaAdmisionDetalle: number;
  idConceptoPago: number;
  claveConcepto: string;
  nombreConcepto: string;
  tipoConcepto: string;
  monto: number;
  esAplicable: boolean;
  notas?: string | null;
  orden: number;
}

export interface TarifaAdmisionDto {
  idTarifaAdmision: number;
  idPlanEstudios: number;
  nombrePlanEstudios: string;
  clavePlanEstudios: string;
  nombreCampus?: string | null;
  nombre: string;
  aplicaConvenioMensualidad: boolean;
  esConvenioEmpresarial: boolean;
  activo: boolean;
  detalles: TarifaAdmisionDetalleDto[];
}

export interface CrearTarifaAdmisionDetalleDto {
  idConceptoPago: number;
  monto: number;
  esAplicable: boolean;
  notas?: string | null;
  orden: number;
}

export interface CrearTarifaAdmisionDto {
  idPlanEstudios: number;
  nombre: string;
  aplicaConvenioMensualidad: boolean;
  esConvenioEmpresarial: boolean;
  activo: boolean;
  detalles: CrearTarifaAdmisionDetalleDto[];
}

export interface ActualizarTarifaAdmisionDto {
  nombre: string;
  aplicaConvenioMensualidad: boolean;
  esConvenioEmpresarial: boolean;
  activo: boolean;
  detalles: CrearTarifaAdmisionDetalleDto[];
}

export interface ConceptoConPromocionDto {
  idConceptoPago: number;
  idPromocion: number | null;
}

export interface GenerarRecibosAdmisionRequestV2 {
  pagoCompleto: boolean;
  idEmpresa: number | null;
  conceptos: ConceptoConPromocionDto[];
}
