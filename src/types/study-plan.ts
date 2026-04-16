import { PaginatedResponse } from "./paginated-response";

export interface StudyPlan {
  idPlanEstudios: number;
  clavePlanEstudios: string;
  nombrePlanEstudios: string;
  rvoe: string;
  fechaExpedicionRvoe?: string | null;
  idCarreraSEP?: number | null;
  permiteAdelantar: boolean;
  version: string;
  duracionMeses: number;
  minimaAprobatoriaParcial: number;
  minimaAprobatoriaFinal: number;
  periodicidad: string;
  idPeriodicidad: number;
  idNivelEducativo: number;
  idCampus: number;
  nombreCampus?: string;
  activo: boolean;
  esOficial: boolean;
}

export interface PayloadCreateStudyPlan {
  clavePlanEstudios: string;
  nombrePlanEstudios: string;
  rvoe: string;
  fechaExpedicionRvoe?: string | null;
  idCarreraSEP?: number | null;
  permiteAdelantar: boolean;
  version: string;
  duracionMeses: number;
  minimaAprobatoriaParcial: number;
  minimaAprobatoriaFinal: number;
  idPeriodicidad: number;
  idNivelEducativo: number;
  idCampus: number;
  esOficial: boolean;
}

export interface PayloadUpdateStudyPlan extends PayloadCreateStudyPlan {
  idPlanEstudios: number;
  status: number;
}

export type StudyPlansResponse = PaginatedResponse<StudyPlan>;

export interface PlanDocumentoRequisito {
  idDocumentoRequisito: number;
  clave: string;
  descripcion: string;
  esObligatorio: boolean;
  orden: number;
}

export interface DocumentoRequisitoDisponible {
  idDocumentoRequisito: number;
  clave: string;
  descripcion: string;
  esObligatorio: boolean;
  orden: number;
  activo: boolean;
}
