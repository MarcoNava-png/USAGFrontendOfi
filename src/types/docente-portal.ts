export interface DocentePerfil {
  idProfesor: number
  noEmpleado: string
  nombreCompleto: string
  nombre?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
  emailInstitucional?: string
  correo?: string
  telefono?: string
  curp?: string
  fechaNacimiento?: string
  campusNombre?: string
  totalGrupos: number
  totalEstudiantes: number
}

export interface DocentePerfilUpdate {
  telefono?: string
  correo?: string
}

export interface GrupoMateriaDocente {
  idGrupoMateria: number
  nombreMateria: string
  claveMateria?: string
  codigoGrupo?: string
  nombreGrupo?: string
  planEstudios?: string
  numeroCuatrimestre?: number
  aula?: string
  totalInscritos: number
  cupo: number
  periodoNombre?: string
  horarios: HorarioItem[]
}

export interface HorarioItem {
  dia: string
  horaInicio: string
  horaFin: string
  aula?: string
}

// ──────────────── ASISTENCIA ────────────────

export interface AsistenciaEstudiante {
  idAsistencia?: number
  idInscripcion: number
  idEstudiante: number
  matricula: string
  nombreCompleto: string
  presente?: boolean
  justificada: boolean
  motivoJustificacion: string
  horaRegistro: string
}

export interface AsistenciaItemRequest {
  idInscripcion: number
  presente: boolean
  justificada: boolean
  motivoJustificacion: string
}

export interface RegistrarAsistenciasRequest {
  idGrupoMateria: number
  fecha: string
  asistencias: AsistenciaItemRequest[]
}

export interface RegistrarAsistenciaResponse {
  mensaje: string
  totalRegistradas: number
  fecha: string
}

// ──────────────── CALIFICACIONES ────────────────

export interface ParcialStatus {
  parcialId: number
  nombre: string
  status: string
  totalActas: number
  calificacionParcialId?: number
}

export interface CalificacionParcialResponse {
  id: number
  nombreParcial: string
  grupoMateriaId: number
  nombreGrupo: string
  parcialId: number
  nombreProfesor: string
  profesorId: number
  statusParcial: string
  fechaApertura: string
  fechaCierre?: string
}

export interface CalificacionParcialCreateRequest {
  grupoMateriaId: number
  parcialId: number
  inscripcionId: number
  profesorId?: number
  fechaApertura?: string
}

export interface CalificacionParcialEstadoRequest {
  grupoMateriaId: number
  id: number
  statusParcial: number // 0=Cerrado, 1=Abierto, 2=Publicado
}

export interface CalificacionDetalleUpsertRequest {
  calificacionParcialId: number
  grupoMateriaId: number
  inscripcionId: number
  tipoEvaluacionEnum: number // 0=Tarea, 1=Examen, 2=Proyecto
  tipoEvaluacionName: string
  nombre: string
  pesoEvaluacion: number
  maxPuntos: number
  puntos: number
  fechaAplicacion?: string
}

export interface CalificacionDetalleItem {
  id: number
  calificacionParcialId: number
  grupoMateriaId: number
  tipoEvaluacionEnum: number
  tipoEvaluacionName: string
  nombre: string
  pesoEvaluacion: number
  maxPuntos: number
  puntos: number
  fechaAplicacion: string
  applicationUserName: string
  fechaCaptura: string
}

export interface ConcentradoGrupo {
  grupoMateriaId: number
  parcialId: number
  calificaciones: { inscripcionId: number; aporteParcial: number }[]
}

export interface DetallesResponse {
  items: CalificacionDetalleItem[]
  totalItems: number
  pageNumber: number
  pageSize: number
}

export interface ValidarPesosResponse {
  esValido: boolean
  sumaPesos: number
  mensaje: string
}

// ──────────────── PLANEACIONES ────────────────

// ──────────────── TAREAS ────────────────

export interface TareaDocente {
  id: number
  idGrupoMateria: number
  nombreMateria: string
  codigoGrupo?: string
  titulo: string
  descripcion?: string
  fechaCreacion: string
  fechaLimite: string
  puntosMaximos: number
  activa: boolean
  totalEntregas: number
  totalPendientes: number
}

export interface EntregaTarea {
  id: number
  idTarea: number
  idEstudiante: number
  nombreAlumno: string
  matricula: string
  nombreArchivo: string
  urlArchivo: string
  tipoArchivo?: string
  tamanoBytes: number
  fechaEntrega: string
  calificacion?: number
  retroalimentacion?: string
  revisada: boolean
}

export interface TareaAlumno {
  id: number
  nombreMateria: string
  codigoGrupo?: string
  titulo: string
  descripcion?: string
  fechaLimite: string
  puntosMaximos: number
  entregada: boolean
  calificacion?: number
  retroalimentacion?: string
  nombreProfesor?: string
}

export interface CrearTareaRequest {
  idGrupoMateria: number
  titulo: string
  descripcion?: string
  fechaLimite: string
  puntosMaximos: number
}

export interface CalificarEntregaRequest {
  calificacion: number
  retroalimentacion?: string
}

export interface PlaneacionDocente {
  id: number
  idGrupoMateria: number
  nombreArchivo: string
  urlArchivo: string
  descripcion?: string
  tipoArchivo?: string
  tamanoBytes: number
  fechaSubida: string
}

export interface ResumenAsistencia {
  idEstudiante: number
  matricula: string
  nombreCompleto: string
  totalClases: number
  asistencias: number
  faltas: number
  faltasJustificadas: number
  faltasInjustificadas: number
  porcentajeAsistencia: number
  alerta: boolean
}
