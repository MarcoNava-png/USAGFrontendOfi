export enum TicketPrioridad {
  Baja = 0,
  Media = 1,
  Alta = 2,
  Critica = 3,
}

export enum TicketEstatus {
  Abierto = 0,
  EnProgreso = 1,
  Resuelto = 2,
  Cerrado = 3,
}

export enum TicketCategoria {
  General = 0,
  Admisiones = 1,
  Finanzas = 2,
  ControlEscolar = 3,
  Academico = 4,
  Configuracion = 5,
  Reportes = 6,
  Otro = 7,
}

export interface TicketComentario {
  idComentario: number
  usuarioId: string
  nombreUsuario: string
  contenido: string
  esAdmin: boolean
  archivoAdjuntoUrl?: string
  archivoAdjuntoNombre?: string
  createdAt: string
}

export interface TicketResponse {
  idTicket: number
  folio: string
  titulo: string
  descripcion: string
  prioridad: TicketPrioridad
  prioridadNombre: string
  estatus: TicketEstatus
  estatusNombre: string
  categoria: TicketCategoria
  categoriaNombre: string
  usuarioCreadorId: string
  nombreCreador: string
  usuarioAsignadoId?: string
  nombreAsignado?: string
  archivoAdjuntoUrl?: string
  archivoAdjuntoNombre?: string
  fechaCierre?: string
  createdAt: string
  updatedAt?: string
  comentarios: TicketComentario[]
}

export interface TicketEstadisticas {
  totalAbiertos: number
  totalEnProgreso: number
  totalResueltos: number
  totalCerrados: number
  total: number
}

export const PRIORIDAD_CONFIG: Record<
  TicketPrioridad,
  { label: string; color: string; bgColor: string }
> = {
  [TicketPrioridad.Baja]: {
    label: "Baja",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  [TicketPrioridad.Media]: {
    label: "Media",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  [TicketPrioridad.Alta]: {
    label: "Alta",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
  },
  [TicketPrioridad.Critica]: {
    label: "Crítica",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
}

export const ESTATUS_CONFIG: Record<
  TicketEstatus,
  { label: string; color: string; bgColor: string }
> = {
  [TicketEstatus.Abierto]: {
    label: "Abierto",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  [TicketEstatus.EnProgreso]: {
    label: "En Progreso",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  [TicketEstatus.Resuelto]: {
    label: "Resuelto",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  [TicketEstatus.Cerrado]: {
    label: "Cerrado",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  },
}

export const CATEGORIA_CONFIG: Record<TicketCategoria, { label: string }> = {
  [TicketCategoria.General]: { label: "General" },
  [TicketCategoria.Admisiones]: { label: "Admisiones" },
  [TicketCategoria.Finanzas]: { label: "Finanzas" },
  [TicketCategoria.ControlEscolar]: { label: "Control Escolar" },
  [TicketCategoria.Academico]: { label: "Académico" },
  [TicketCategoria.Configuracion]: { label: "Configuración" },
  [TicketCategoria.Reportes]: { label: "Reportes" },
  [TicketCategoria.Otro]: { label: "Otro" },
}
