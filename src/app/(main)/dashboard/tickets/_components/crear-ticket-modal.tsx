"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2, Paperclip, X } from "lucide-react"
import { toast } from "sonner"
import { crearTicket } from "@/services/ticket-soporte-service"
import {
  TicketPrioridad,
  TicketCategoria,
  PRIORIDAD_CONFIG,
  CATEGORIA_CONFIG,
} from "@/types/ticket-soporte"

interface Props {
  open: boolean
  onClose: (reload?: boolean) => void
}

export function CrearTicketModal({ open, onClose }: Props) {
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [prioridad, setPrioridad] = useState<TicketPrioridad>(
    TicketPrioridad.Baja
  )
  const [categoria, setCategoria] = useState<TicketCategoria>(
    TicketCategoria.General
  )
  const [areaDestino, setAreaDestino] = useState("")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setTitulo("")
    setDescripcion("")
    setPrioridad(TicketPrioridad.Baja)
    setCategoria(TicketCategoria.General)
    setAreaDestino("")
    setArchivo(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!titulo.trim()) {
      toast.error("El título es obligatorio")
      return
    }
    if (!descripcion.trim()) {
      toast.error("La descripción es obligatoria")
      return
    }

    setLoading(true)
    try {
      await crearTicket({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        prioridad,
        categoria,
        areaDestino: areaDestino || undefined,
        archivo: archivo ?? undefined,
      })
      toast.success("Ticket creado exitosamente")
      resetForm()
      onClose(true)
    } catch {
      toast.error("Error al crear el ticket")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm()
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Ticket de Soporte</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              placeholder="Describe brevemente el problema"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              placeholder="Detalla el problema, pasos para reproducirlo, etc."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select
                value={prioridad.toString()}
                onValueChange={(v) => setPrioridad(Number(v) as TicketPrioridad)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORIDAD_CONFIG).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoría (Módulo)</Label>
              <Select
                value={categoria.toString()}
                onValueChange={(v) => setCategoria(Number(v) as TicketCategoria)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIA_CONFIG).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Área destino</Label>
            <Select value={areaDestino} onValueChange={setAreaDestino}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar área (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administración</SelectItem>
                <SelectItem value="controlescolar">Control Escolar</SelectItem>
                <SelectItem value="finanzas">Finanzas</SelectItem>
                <SelectItem value="academico">Académico</SelectItem>
                <SelectItem value="coordinador">Coordinación</SelectItem>
                <SelectItem value="director">Dirección</SelectItem>
                <SelectItem value="admisiones">Admisiones</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Archivo adjunto (opcional)</Label>
            {archivo ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{archivo.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setArchivo(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Input
                type="file"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                accept=".png,.jpg,.jpeg,.gif,.pdf,.doc,.docx,.xlsx,.txt,.zip"
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
