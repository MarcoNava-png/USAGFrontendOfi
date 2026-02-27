"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  Send,
  Paperclip,
  Download,
  Clock,
  User,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  obtenerTicket,
  agregarComentario,
  cambiarEstatus,
} from "@/services/ticket-soporte-service"
import {
  type TicketResponse,
  TicketEstatus,
  PRIORIDAD_CONFIG,
  ESTATUS_CONFIG,
  CATEGORIA_CONFIG,
} from "@/types/ticket-soporte"

interface Props {
  open: boolean
  onClose: (reload?: boolean) => void
  ticketId: number | null
  isAdmin: boolean
}

export function DetalleTicketModal({
  open,
  onClose,
  ticketId,
  isAdmin,
}: Props) {
  const [ticket, setTicket] = useState<TicketResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [comentario, setComentario] = useState("")
  const [archivoComentario, setArchivoComentario] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [cambiandoEstatus, setCambiandoEstatus] = useState(false)
  const comentariosEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && ticketId) {
      cargarTicket()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticketId])

  useEffect(() => {
    comentariosEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [ticket?.comentarios])

  const cargarTicket = async () => {
    if (!ticketId) return
    setLoading(true)
    try {
      const data = await obtenerTicket(ticketId)
      setTicket(data)
    } catch {
      toast.error("Error al cargar el ticket")
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleEnviarComentario = async () => {
    if (!ticket || !comentario.trim()) return
    setEnviando(true)
    try {
      await agregarComentario(
        ticket.idTicket,
        comentario.trim(),
        archivoComentario ?? undefined
      )
      setComentario("")
      setArchivoComentario(null)
      await cargarTicket()
    } catch {
      toast.error("Error al enviar el comentario")
    } finally {
      setEnviando(false)
    }
  }

  const handleCambiarEstatus = async (nuevoEstatus: string) => {
    if (!ticket) return
    setCambiandoEstatus(true)
    try {
      await cambiarEstatus(ticket.idTicket, Number(nuevoEstatus) as TicketEstatus)
      toast.success("Estatus actualizado")
      await cargarTicket()
      onClose(true)
    } catch {
      toast.error("Error al cambiar el estatus")
    } finally {
      setCambiandoEstatus(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setTicket(null)
      setComentario("")
      setArchivoComentario(null)
      onClose()
    }
  }

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  if (!ticket && !loading) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {loading ? (
              "Cargando..."
            ) : (
              <>
                <span className="font-mono text-sm text-muted-foreground">
                  {ticket?.folio}
                </span>
                <span className="truncate">{ticket?.titulo}</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : ticket ? (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Info del ticket */}
            <div className="flex flex-wrap gap-2">
              <Badge
                className={`${ESTATUS_CONFIG[ticket.estatus].bgColor} ${ESTATUS_CONFIG[ticket.estatus].color} border-0`}
              >
                {ESTATUS_CONFIG[ticket.estatus].label}
              </Badge>
              <Badge
                className={`${PRIORIDAD_CONFIG[ticket.prioridad].bgColor} ${PRIORIDAD_CONFIG[ticket.prioridad].color} border-0`}
              >
                {PRIORIDAD_CONFIG[ticket.prioridad].label}
              </Badge>
              <Badge variant="secondary">
                {CATEGORIA_CONFIG[ticket.categoria].label}
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground flex items-center gap-4">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {ticket.nombreCreador}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatFecha(ticket.createdAt)}
              </span>
              {ticket.nombreAsignado && (
                <span>Asignado a: {ticket.nombreAsignado}</span>
              )}
            </div>

            <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap">
              {ticket.descripcion}
            </div>

            {ticket.archivoAdjuntoUrl && (
              <div className="flex items-center gap-2 text-sm">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <a
                  href={ticket.archivoAdjuntoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {ticket.archivoAdjuntoNombre ?? "Archivo adjunto"}
                  <Download className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* Acciones admin */}
            {isAdmin && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Cambiar estatus:</span>
                  <Select
                    value={ticket.estatus.toString()}
                    onValueChange={handleCambiarEstatus}
                    disabled={cambiandoEstatus}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ESTATUS_CONFIG).map(([key, val]) => (
                        <SelectItem key={key} value={key}>
                          {val.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Comentarios */}
            <Separator />
            <h4 className="font-medium text-sm">
              Comentarios ({ticket.comentarios.length})
            </h4>

            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {ticket.comentarios.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay comentarios aún.
                </p>
              ) : (
                ticket.comentarios.map((c) => (
                  <div
                    key={c.idComentario}
                    className={`rounded-md p-3 text-sm ${
                      c.esAdmin
                        ? "bg-primary/5 border border-primary/20"
                        : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-xs">
                        {c.nombreUsuario}
                      </span>
                      {c.esAdmin && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0"
                        >
                          Admin
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {formatFecha(c.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{c.contenido}</p>
                    {c.archivoAdjuntoUrl && (
                      <a
                        href={c.archivoAdjuntoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-xs flex items-center gap-1 mt-1"
                      >
                        <Paperclip className="h-3 w-3" />
                        {c.archivoAdjuntoNombre ?? "Archivo"}
                      </a>
                    )}
                  </div>
                ))
              )}
              <div ref={comentariosEndRef} />
            </div>

            {/* Formulario de comentario */}
            {ticket.estatus !== TicketEstatus.Cerrado && (
              <div className="space-y-2 pt-2">
                <Textarea
                  placeholder="Escribe un comentario..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={2}
                  maxLength={2000}
                />
                <div className="flex items-center gap-2">
                  {archivoComentario ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-1">
                      <Paperclip className="h-3 w-3" />
                      <span className="truncate">{archivoComentario.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setArchivoComentario(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <label className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        Adjuntar archivo
                        <Input
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            setArchivoComentario(e.target.files?.[0] ?? null)
                          }
                        />
                      </label>
                    </div>
                  )}
                  <Button
                    size="sm"
                    onClick={handleEnviarComentario}
                    disabled={enviando || !comentario.trim()}
                  >
                    {enviando ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="ml-1">Enviar</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
