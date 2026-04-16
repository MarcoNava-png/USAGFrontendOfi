"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Search, TicketIcon, Filter, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import {
  listarTickets,
  obtenerEstadisticas,
} from "@/services/ticket-soporte-service"
import type { TicketResponse, TicketEstadisticas } from "@/types/ticket-soporte"
import {
  TicketEstatus,
  TicketPrioridad,
  ESTATUS_CONFIG,
  PRIORIDAD_CONFIG,
} from "@/types/ticket-soporte"
import { TicketCard } from "./_components/ticket-card"
import { CrearTicketModal } from "./_components/crear-ticket-modal"
import { DetalleTicketModal } from "./_components/detalle-ticket-modal"

export default function TicketsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const isAdmin =
    user?.role === "admin" || user?.role === "superadmin"
  const lastOpenedTicketId = useRef<string | null>(null)

  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [stats, setStats] = useState<TicketEstadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [pageSize] = useState(20)

  // Filtros
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstatus, setFiltroEstatus] = useState<string>("all")
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("all")

  // Modales
  const [crearModalOpen, setCrearModalOpen] = useState(false)
  const [detalleTicketId, setDetalleTicketId] = useState<number | null>(null)
  const [detalleModalOpen, setDetalleModalOpen] = useState(false)

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        listarTickets({
          page,
          pageSize,
          estatus:
            filtroEstatus !== "all"
              ? (Number(filtroEstatus) as TicketEstatus)
              : undefined,
          prioridad:
            filtroPrioridad !== "all"
              ? (Number(filtroPrioridad) as TicketPrioridad)
              : undefined,
          busqueda: busqueda || undefined,
        }),
        obtenerEstadisticas(),
      ])
      setTickets(ticketsRes.items)
      setTotalItems(ticketsRes.totalItems)
      setStats(statsRes)
    } catch {
      toast.error("Error al cargar los tickets")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filtroEstatus, filtroPrioridad, busqueda])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  useEffect(() => {
    const ticketId = searchParams.get("ticketId")
    if (ticketId && ticketId !== lastOpenedTicketId.current) {
      lastOpenedTicketId.current = ticketId
      setDetalleTicketId(Number(ticketId))
      setDetalleModalOpen(true)
    }
  }, [searchParams])

  const handleCrearClose = (reload?: boolean) => {
    setCrearModalOpen(false)
    if (reload) cargarDatos()
  }

  const handleDetalleClose = (reload?: boolean) => {
    setDetalleModalOpen(false)
    setDetalleTicketId(null)
    lastOpenedTicketId.current = null
    if (searchParams.get("ticketId")) {
      router.replace("/dashboard/tickets")
    }
    if (reload) cargarDatos()
  }

  const handleTicketClick = (ticket: TicketResponse) => {
    setDetalleTicketId(ticket.idTicket)
    setDetalleModalOpen(true)
  }

  const limpiarFiltros = () => {
    setBusqueda("")
    setFiltroEstatus("all")
    setFiltroPrioridad("all")
    setPage(1)
  }

  const totalPages = Math.ceil(totalItems / pageSize)
  const hayFiltrosActivos =
    busqueda || filtroEstatus !== "all" || filtroPrioridad !== "all"

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TicketIcon className="h-6 w-6" />
            Tickets de Soporte
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin
              ? "Gestiona todos los tickets de soporte"
              : "Reporta problemas y da seguimiento a tus tickets"}
          </p>
        </div>
        <Button onClick={() => setCrearModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Ticket
        </Button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card
            className={`cursor-pointer transition-colors ${filtroEstatus === "all" ? "border-primary" : ""}`}
            onClick={() => {
              setFiltroEstatus("all")
              setPage(1)
            }}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-colors ${filtroEstatus === "0" ? "border-primary" : ""}`}
            onClick={() => {
              setFiltroEstatus("0")
              setPage(1)
            }}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalAbiertos}
              </p>
              <p className="text-xs text-muted-foreground">Abiertos</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-colors ${filtroEstatus === "1" ? "border-primary" : ""}`}
            onClick={() => {
              setFiltroEstatus("1")
              setPage(1)
            }}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.totalEnProgreso}
              </p>
              <p className="text-xs text-muted-foreground">En Progreso</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-colors ${filtroEstatus === "2" ? "border-primary" : ""}`}
            onClick={() => {
              setFiltroEstatus("2")
              setPage(1)
            }}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {stats.totalResueltos}
              </p>
              <p className="text-xs text-muted-foreground">Resueltos</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-colors ${filtroEstatus === "4" ? "border-primary" : ""}`}
            onClick={() => {
              setFiltroEstatus("4")
              setPage(1)
            }}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalEnValidacion}
              </p>
              <p className="text-xs text-muted-foreground">En Validación</p>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-colors ${filtroEstatus === "3" ? "border-primary" : ""}`}
            onClick={() => {
              setFiltroEstatus("3")
              setPage(1)
            }}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-600">
                {stats.totalCerrados}
              </p>
              <p className="text-xs text-muted-foreground">Cerrados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {hayFiltrosActivos && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={limpiarFiltros}
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por folio, título o creador..."
                className="pl-8"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Select
              value={filtroEstatus}
              onValueChange={(v) => {
                setFiltroEstatus(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(ESTATUS_CONFIG).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filtroPrioridad}
              onValueChange={(v) => {
                setFiltroPrioridad(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(PRIORIDAD_CONFIG).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de tickets */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TicketIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {hayFiltrosActivos
                ? "No se encontraron tickets con los filtros aplicados."
                : "No hay tickets aún. Crea uno nuevo para empezar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.idTicket}
              ticket={ticket}
              onClick={() => handleTicketClick(ticket)}
            />
          ))}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {(page - 1) * pageSize + 1} -{" "}
                {Math.min(page * pageSize, totalItems)} de {totalItems}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      <CrearTicketModal open={crearModalOpen} onClose={handleCrearClose} />
      <DetalleTicketModal
        open={detalleModalOpen}
        onClose={handleDetalleClose}
        ticketId={detalleTicketId}
        isAdmin={isAdmin}
      />
    </div>
  )
}
