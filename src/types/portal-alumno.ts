export interface MiPerfil {
  idEstudiante: number;
  matricula: string;
  nombreCompleto: string;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  email?: string;
  telefono?: string;
  celular?: string;
  curp?: string;
  rfc?: string;
  fechaNacimiento?: string;
  genero?: string;
  estadoCivil?: string;
  nacionalidad?: string;
  fotoUrl?: string;
  direccion?: MiDireccion;
  contactoEmergencia?: MiContactoEmergencia;
  planEstudios?: string;
  clavePlanEstudios?: string;
  campus?: string;
  fechaIngreso?: string;
}

export interface MiDireccion {
  calle?: string;
  numeroExterior?: string;
  numeroInterior?: string;
  colonia?: string;
  codigoPostal?: string;
  municipio?: string;
  estado?: string;
}

export interface MiContactoEmergencia {
  nombre?: string;
  telefono?: string;
  parentesco?: string;
}

export interface ActualizarMiPerfilRequest {
  telefono?: string;
  celular?: string;
  email?: string;
  direccion?: MiDireccion;
  contactoEmergencia?: MiContactoEmergencia;
}

export interface MisDocumentosPendientes {
  totalPendientes: number;
  conProrrogaVigente: number;
  conProrrogaVencida: number;
  sinProrroga: number;
  proximoVencimiento?: string | null;
  documentos: MiDocumentoPendiente[];
}

export interface MiDocumentoPendiente {
  idAspiranteDocumento: number;
  clave: string;
  descripcion: string;
  estatus: string;
  esObligatorio: boolean;
  fechaProrroga?: string | null;
  motivoProrroga?: string | null;
  tieneProrrogaVigente: boolean;
  prorrogaVencida: boolean;
  diasRestantes?: number | null;
}

export interface MisMaterias {
  totalMaterias: number;
  materiasConCalificacionFinal: number;
  materiasEnCurso: number;
  periodoAcademico?: string;
  materias: MiMateriaInscrita[];
}

export interface MiMateriaInscrita {
  idInscripcion: number;
  idGrupoMateria: number;
  idMateria: number;
  claveMateria: string;
  nombreMateria: string;
  creditos: number;
  grupoCodigo: string;
  numeroCuatrimestre?: number;
  aula?: string;
  docente?: string;
  fechaInscripcion: string;
  estado: string;
  calificacionFinal?: number;
  horarios: MiHorarioClase[];
}

export interface MiHorarioClase {
  idHorario: number;
  idDiaSemana: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  aula?: string;
}

export interface MisCalificaciones {
  promedioGeneral?: number;
  materiasAprobadas: number;
  materiasReprobadas: number;
  materiasEnCurso: number;
  materias: MiMateriaCalificacion[];
}

export interface MiMateriaCalificacion {
  idMateria: number;
  claveMateria: string;
  nombreMateria: string;
  nombreDocente?: string;
  grupoCodigo?: string;
  periodoAcademico?: string;
  creditos: number;
  calificacionFinal?: number;
  estatus: string;
  parciales: MiParcial[];
}

export interface MiParcial {
  idParciales: number;
  numeroParcial: number;
  calificacion?: number;
  publicado: boolean;
  fechaPublicacion?: string;
  evaluaciones: MiEvaluacion[];
}

export interface MiEvaluacion {
  idCalificacionDetalle: number;
  descripcion: string;
  tipo?: string;
  peso: number;
  puntajeMaximo: number;
  puntaje?: number;
  fechaAplicacion?: string;
}

export interface MiAsistencia {
  porcentajeGeneral: number;
  totalClases: number;
  asistencias: number;
  faltas: number;
  retardos: number;
  justificadas: number;
  materias: MiAsistenciaMateria[];
}

export interface MiAsistenciaMateria {
  idMateria: number;
  claveMateria: string;
  nombreMateria: string;
  grupoCodigo?: string;
  porcentaje: number;
  totalClases: number;
  asistencias: number;
  faltas: number;
  retardos: number;
  justificadas: number;
  detalles: MiAsistenciaDetalle[];
}

export interface MiAsistenciaDetalle {
  fecha: string;
  estatus: string;
  observacion?: string;
}

export interface MisPagos {
  totalAdeudo: number;
  totalPagado: number;
  saldoPendiente: number;
  recibosPendientes: number;
  recibosVencidos: number;
  recibosPagados: number;
  recibos: MiRecibo[];
}

export interface MiRecibo {
  idRecibo: number;
  folio?: string;
  fechaEmision: string;
  fechaVencimiento: string;
  estatus: string;
  subtotal: number;
  descuento: number;
  recargos: number;
  total: number;
  saldo: number;
  notas?: string;
  vencido: boolean;
  diasVencido: number;
  detalles: MiReciboDetalle[];
  pagos?: MiPagoAplicado[];
}

export interface MiReciboDetalle {
  idReciboDetalle: number;
  idConceptoPago: number;
  concepto?: string;
  descripcion?: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
}

export interface MiPagoAplicado {
  idPago: number;
  folioPago?: string;
  fechaPago: string;
  medioPago?: string;
  montoAplicado: number;
  referencia?: string;
}

export interface MisDocumentosOficiales {
  disponibles: DocumentoOficialDisponible[];
  misSolicitudes: MiSolicitudDocumento[];
}

export interface DocumentoOficialDisponible {
  idTipoDocumento: number;
  clave: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  requierePago: boolean;
  diasVigencia: number;
}

export interface MiSolicitudDocumento {
  idSolicitud: number;
  folioSolicitud?: string;
  idTipoDocumento: number;
  nombreTipoDocumento: string;
  variante: string;
  fechaSolicitud: string;
  fechaGeneracion?: string;
  fechaVencimiento?: string;
  estatus: string;
  requierePago: boolean;
  idRecibo?: number;
  montoRecibo?: number;
  estatusRecibo?: string;
  codigoVerificacion?: string;
}
