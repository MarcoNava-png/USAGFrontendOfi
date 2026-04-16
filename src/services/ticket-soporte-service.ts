import apiClient from "./api-client"
import type { PaginatedResponse } from "@/types/paginated-response"
import type {
  TicketResponse,
  TicketEstadisticas,
  TicketComentario,
  TicketPrioridad,
  TicketEstatus,
  TicketCategoria,
} from "@/types/ticket-soporte"

const BASE_URL = "/tickets"

export interface CrearTicketParams {
  titulo: string
  descripcion: string
  prioridad: TicketPrioridad
  categoria: TicketCategoria
  areaDestino?: string
  archivo?: File
}

export interface TicketFiltroParams {
  page?: number
  pageSize?: number
  estatus?: TicketEstatus
  prioridad?: TicketPrioridad
  categoria?: TicketCategoria
  busqueda?: string
}

export async function crearTicket(
  params: CrearTicketParams
): Promise<TicketResponse> {
  const formData = new FormData()
  formData.append("titulo", params.titulo)
  formData.append("descripcion", params.descripcion)
  formData.append("prioridad", params.prioridad.toString())
  formData.append("categoria", params.categoria.toString())
  if (params.areaDestino) {
    formData.append("areaDestino", params.areaDestino)
  }
  if (params.archivo) {
    formData.append("archivo", params.archivo)
  }
  const res = await apiClient.post<TicketResponse>(BASE_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data
}

export async function listarTickets(
  filtros: TicketFiltroParams = {}
): Promise<PaginatedResponse<TicketResponse>> {
  const params = new URLSearchParams()
  if (filtros.page) params.append("page", filtros.page.toString())
  if (filtros.pageSize) params.append("pageSize", filtros.pageSize.toString())
  if (filtros.estatus !== undefined)
    params.append("estatus", filtros.estatus.toString())
  if (filtros.prioridad !== undefined)
    params.append("prioridad", filtros.prioridad.toString())
  if (filtros.categoria !== undefined)
    params.append("categoria", filtros.categoria.toString())
  if (filtros.busqueda) params.append("busqueda", filtros.busqueda)

  const res = await apiClient.get<PaginatedResponse<TicketResponse>>(
    `${BASE_URL}?${params.toString()}`
  )
  return res.data
}

export async function obtenerTicket(id: number): Promise<TicketResponse> {
  const res = await apiClient.get<TicketResponse>(`${BASE_URL}/${id}`)
  return res.data
}

export async function actualizarTicket(
  id: number,
  data: {
    titulo?: string
    descripcion?: string
    prioridad?: TicketPrioridad
    categoria?: TicketCategoria
  }
): Promise<TicketResponse> {
  const res = await apiClient.put<TicketResponse>(`${BASE_URL}/${id}`, data)
  return res.data
}

export async function agregarComentario(
  id: number,
  contenido: string,
  archivo?: File
): Promise<TicketComentario> {
  const formData = new FormData()
  formData.append("contenido", contenido)
  if (archivo) {
    formData.append("archivo", archivo)
  }
  const res = await apiClient.post<TicketComentario>(
    `${BASE_URL}/${id}/comentarios`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  )
  return res.data
}

export async function cambiarEstatus(
  id: number,
  estatus: TicketEstatus
): Promise<void> {
  await apiClient.put(`${BASE_URL}/${id}/estatus`, { estatus })
}

export async function asignarTicket(
  id: number,
  usuarioAsignadoId: string,
  nombreAsignado: string
): Promise<void> {
  await apiClient.put(`${BASE_URL}/${id}/asignar`, {
    usuarioAsignadoId,
    nombreAsignado,
  })
}

export async function obtenerEstadisticas(): Promise<TicketEstadisticas> {
  const res = await apiClient.get<TicketEstadisticas>(
    `${BASE_URL}/estadisticas`
  )
  return res.data
}
