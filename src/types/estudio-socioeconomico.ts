export interface CatalogoItem {
  id: number;
  nombre: string;
}

export interface CatalogosEstudio {
  parentescos: CatalogoItem[];
  serviciosVivienda: CatalogoItem[];
  serviciosMedicos: CatalogoItem[];
  recursosTecnologicos: CatalogoItem[];
}

export interface Analista {
  id: string;
  nombre: string;
}

export interface EstudioSocioeconomico {
  idEstudioSocioeconomico: number;
  idAspirante: number;

  idParentescoVivienda?: number | null;
  conQuienViveOtro?: string | null;
  numeroPersonasHogar?: number | null;
  principalSostenEconomico?: string | null;
  personasAportanIngresos?: number | null;

  trabaja?: boolean | null;
  empresaActividad?: string | null;
  horarioLaboral?: string | null;
  quienCubreGastos?: string | null;
  dificultadesEconomicas?: boolean | null;

  idServicioMedico?: number | null;
  padeceEnfermedad?: boolean | null;
  padeceEnfermedadDetalle?: string | null;
  tieneDiscapacidad?: boolean | null;
  tieneDiscapacidadDetalle?: string | null;

  escuelaProcedencia?: string | null;
  promedioNivelAnterior?: number | null;

  analistaId?: string | null;
  analistaNombre?: string | null;
  fechaLlenado?: string | null;
  llenadoPorAspirante: boolean;
  token?: string | null;

  serviciosViviendaIds: number[];
  recursosTecnologicosIds: number[];
}

export interface EstudioSocioeconomicoRequest {
  idParentescoVivienda?: number | null;
  conQuienViveOtro?: string | null;
  numeroPersonasHogar?: number | null;
  principalSostenEconomico?: string | null;
  personasAportanIngresos?: number | null;

  trabaja?: boolean | null;
  empresaActividad?: string | null;
  horarioLaboral?: string | null;
  quienCubreGastos?: string | null;
  dificultadesEconomicas?: boolean | null;

  idServicioMedico?: number | null;
  padeceEnfermedad?: boolean | null;
  padeceEnfermedadDetalle?: string | null;
  tieneDiscapacidad?: boolean | null;
  tieneDiscapacidadDetalle?: string | null;

  escuelaProcedencia?: string | null;
  promedioNivelAnterior?: number | null;

  analistaId?: string | null;

  serviciosViviendaIds: number[];
  recursosTecnologicosIds: number[];
}

export interface EstudioPublico {
  aspiranteNombre: string;
  carrera?: string | null;
  campus?: string | null;
  yaEnviado: boolean;
  catalogos: CatalogosEstudio;
  estudio: EstudioSocioeconomico;
}
