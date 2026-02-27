"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  type TicketResponse,
  PRIORIDAD_CONFIG,
  ESTATUS_CONFIG,
  CATEGORIA_CONFIG,
} from "@/types/ticket-soporte"
import { Clock, Paperclip, MessageSquare, User } from "lucide-react"

interface Props {
  ticket: TicketResponse
  onClick: () => void
}

export function TicketCard({ ticket, onClick }: Props) {
  const prioridad = PRIORIDAD_CONFIG[ticket.prioridad]
  const estatus = ESTATUS_CONFIG[ticket.estatus]
  const categoria = CATEGORIA_CONFIG[ticket.categoria]

  const fecha = new Date(ticket.createdAt).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">
                {ticket.folio}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${estatus.bgColor} ${estatus.color} border-0`}
              >
                {estatus.label}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${prioridad.bgColor} ${prioridad.color} border-0`}
              >
                {prioridad.label}
              </Badge>
            </div>
            <h3 className="font-medium text-sm truncate">{ticket.titulo}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {ticket.descripcion}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {ticket.nombreCreador}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {fecha}
          </span>
          {ticket.categoria !== undefined && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {categoria.label}
            </Badge>
          )}
          {ticket.archivoAdjuntoUrl && (
            <Paperclip className="h-3 w-3" />
          )}
          {ticket.comentarios && ticket.comentarios.length > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {ticket.comentarios.length}
            </span>
          )}
          {ticket.nombreAsignado && (
            <span className="ml-auto text-[10px]">
              Asignado: {ticket.nombreAsignado}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
