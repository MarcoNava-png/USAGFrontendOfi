import { PaginatedResponse } from "./paginated-response";

export interface AcademicPeriod {
  idPeriodoAcademico: number;
  clave: string;
  nombre: string;
  idPeriodicidad: number;
  periodicidad: string;
  fechaInicio: string;
  fechaFin: string;
  esPeriodoActual: boolean;
  fechaLimiteParcial1?: string | null;
  fechaLimiteParcial2?: string | null;
  fechaLimiteParcial3?: string | null;
}

export interface PayloadCreateAcademicPeriod {
  clave: string;
  nombre: string;
  idPeriodicidad: number;
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteParcial1?: string | null;
  fechaLimiteParcial2?: string | null;
  fechaLimiteParcial3?: string | null;
}

export interface PayloadUpdateAcademicPeriod extends PayloadCreateAcademicPeriod {
  idPeriodoAcademico: number;
  status: number;
}

export type AcademicPeriodsResponse = PaginatedResponse<AcademicPeriod>;
