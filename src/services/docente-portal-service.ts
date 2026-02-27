import apiClient from "./api-client"
import type {
  AsistenciaEstudiante,
  CalificacionDetalleItem,
  CalificacionDetalleUpsertRequest,
  CalificacionParcialCreateRequest,
  CalificacionParcialEstadoRequest,
  CalificacionParcialResponse,
  ConcentradoGrupo,
  DetallesResponse,
  DocentePerfil,
  DocentePerfilUpdate,
  CalificarEntregaRequest,
  CrearTareaRequest,
  EntregaTarea,
  GrupoMateriaDocente,
  ParcialStatus,
  PlaneacionDocente,
  TareaAlumno,
  TareaDocente,
  RegistrarAsistenciasRequest,
  RegistrarAsistenciaResponse,
  ResumenAsistencia,
  ValidarPesosResponse,
} from "@/types/docente-portal"

// ──────────────── PERFIL ────────────────

export async function getDocentePerfil(): Promise<DocentePerfil> {
  const { data } = await apiClient.get<DocentePerfil>("/docente-portal/perfil")
  return data
}

export async function updateDocentePerfil(payload: DocentePerfilUpdate): Promise<void> {
  await apiClient.put("/docente-portal/perfil", payload)
}

// ──────────────── MIS GRUPOS ────────────────

export async function getMisGrupos(): Promise<GrupoMateriaDocente[]> {
  const { data } = await apiClient.get<GrupoMateriaDocente[]>("/docente-portal/mis-grupos")
  return data
}

export async function getGrupoDetalle(idGrupoMateria: number): Promise<GrupoMateriaDocente> {
  const { data } = await apiClient.get<GrupoMateriaDocente>(`/docente-portal/mis-grupos/${idGrupoMateria}`)
  return data
}

// ──────────────── ASISTENCIA ────────────────

export async function getAsistenciaPorFecha(
  idGrupoMateria: number,
  fecha: string
): Promise<AsistenciaEstudiante[]> {
  const { data } = await apiClient.get<AsistenciaEstudiante[]>(
    `/docente-portal/asistencia/${idGrupoMateria}/fecha/${fecha}`
  )
  return data
}

export async function registrarAsistencia(
  payload: RegistrarAsistenciasRequest
): Promise<RegistrarAsistenciaResponse> {
  const { data } = await apiClient.post<RegistrarAsistenciaResponse>(
    "/docente-portal/asistencia/registrar",
    payload
  )
  return data
}

export async function getResumenAsistencia(
  idGrupoMateria: number
): Promise<ResumenAsistencia[]> {
  const { data } = await apiClient.get<ResumenAsistencia[]>(
    `/docente-portal/asistencia/${idGrupoMateria}/resumen`
  )
  return data
}

// ──────────────── CALIFICACIONES ────────────────

export async function getParciales(grupoMateriaId: number): Promise<ParcialStatus[]> {
  const { data } = await apiClient.get<ParcialStatus[]>(
    `/docente-portal/calificaciones/${grupoMateriaId}/parciales`
  )
  return data
}

export async function crearParcial(
  payload: CalificacionParcialCreateRequest
): Promise<CalificacionParcialResponse> {
  const { data } = await apiClient.post<CalificacionParcialResponse>(
    "/docente-portal/calificaciones/parciales",
    payload
  )
  return data
}

export async function cambiarEstadoParcial(
  id: number,
  payload: CalificacionParcialEstadoRequest
): Promise<void> {
  await apiClient.patch(`/docente-portal/calificaciones/parciales/${id}/estado`, payload)
}

export async function upsertDetalle(
  payload: CalificacionDetalleUpsertRequest
): Promise<CalificacionDetalleItem> {
  const { data } = await apiClient.post<CalificacionDetalleItem>(
    "/docente-portal/calificaciones/detalle",
    payload
  )
  return data
}

export async function getConcentrado(
  grupoMateriaId: number,
  parcialId: number
): Promise<ConcentradoGrupo> {
  const { data } = await apiClient.get<ConcentradoGrupo>(
    `/docente-portal/calificaciones/concentrado/${grupoMateriaId}/${parcialId}`
  )
  return data
}

export async function getDetalles(
  grupoMateriaId: number,
  parcialId?: number,
  inscripcionId?: number
): Promise<DetallesResponse> {
  const params = new URLSearchParams({ grupoMateriaId: String(grupoMateriaId) })
  if (parcialId) params.set("parcialId", String(parcialId))
  if (inscripcionId) params.set("inscripcionId", String(inscripcionId))
  const { data } = await apiClient.get<DetallesResponse>(
    `/docente-portal/calificaciones/detalles?${params}`
  )
  return data
}

export async function validarPesos(
  calificacionParcialId: number
): Promise<ValidarPesosResponse> {
  const { data } = await apiClient.get<ValidarPesosResponse>(
    `/docente-portal/calificaciones/parciales/${calificacionParcialId}/validar-pesos`
  )
  return data
}

// ──────────────── PLANEACIONES ────────────────

export async function getPlaneaciones(
  idGrupoMateria: number
): Promise<PlaneacionDocente[]> {
  const { data } = await apiClient.get<PlaneacionDocente[]>(
    `/docente-portal/planeaciones/${idGrupoMateria}`
  )
  return data
}

export async function uploadPlaneacion(
  idGrupoMateria: number,
  archivo: File,
  descripcion?: string
): Promise<PlaneacionDocente> {
  const formData = new FormData()
  formData.append("idGrupoMateria", String(idGrupoMateria))
  formData.append("archivo", archivo)
  if (descripcion) formData.append("descripcion", descripcion)
  const { data } = await apiClient.post<PlaneacionDocente>(
    "/docente-portal/planeaciones",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  )
  return data
}

export async function deletePlaneacion(id: number): Promise<void> {
  await apiClient.delete(`/docente-portal/planeaciones/${id}`)
}

// ──────────────── TAREAS (DOCENTE) ────────────────

export async function getTareas(idGrupoMateria: number): Promise<TareaDocente[]> {
  const { data } = await apiClient.get<TareaDocente[]>(
    `/docente-portal/tareas/${idGrupoMateria}`
  )
  return data
}

export async function crearTarea(payload: CrearTareaRequest): Promise<{ id: number; mensaje: string }> {
  const { data } = await apiClient.post<{ id: number; mensaje: string }>(
    "/docente-portal/tareas",
    payload
  )
  return data
}

export async function actualizarTarea(id: number, payload: CrearTareaRequest): Promise<void> {
  await apiClient.put(`/docente-portal/tareas/${id}`, payload)
}

export async function eliminarTarea(id: number): Promise<void> {
  await apiClient.delete(`/docente-portal/tareas/${id}`)
}

export async function getEntregasTarea(idTarea: number): Promise<EntregaTarea[]> {
  const { data } = await apiClient.get<EntregaTarea[]>(
    `/docente-portal/tareas/${idTarea}/entregas`
  )
  return data
}

export async function calificarEntrega(
  idEntrega: number,
  payload: CalificarEntregaRequest
): Promise<void> {
  await apiClient.put(`/docente-portal/tareas/entregas/${idEntrega}/calificar`, payload)
}

// ──────────────── TAREAS (ALUMNO) ────────────────

export async function getTareasAlumno(): Promise<TareaAlumno[]> {
  const { data } = await apiClient.get<TareaAlumno[]>("/alumno-portal/tareas")
  return data
}

export async function entregarTarea(
  idTarea: number,
  archivo: File
): Promise<{ id: number; mensaje: string }> {
  const formData = new FormData()
  formData.append("archivo", archivo)
  const { data } = await apiClient.post<{ id: number; mensaje: string }>(
    `/alumno-portal/tareas/${idTarea}/entregar`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  )
  return data
}
