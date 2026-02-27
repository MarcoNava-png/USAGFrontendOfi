"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Download, Eye, Loader2, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  calificarEntrega,
  getEntregasTarea,
} from "@/services/docente-portal-service"
import type { EntregaTarea, TareaDocente } from "@/types/docente-portal"
import { toast } from "sonner"

interface EntregasTareaDialogProps {
  tarea: TareaDocente
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function EntregasTareaDialog({ tarea, open, onOpenChange, onUpdate }: EntregasTareaDialogProps) {
  const [entregas, setEntregas] = useState<EntregaTarea[]>([])
  const [loading, setLoading] = useState(false)
  const [calificando, setCalificando] = useState<number | null>(null)
  const [calForm, setCalForm] = useState<{ calificacion: string; retroalimentacion: string }>({
    calificacion: "",
    retroalimentacion: "",
  })

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getEntregasTarea(tarea.id)
      .then(setEntregas)
      .catch(() => toast.error("Error al cargar entregas"))
      .finally(() => setLoading(false))
  }, [open, tarea.id])

  const handleCalificar = async (idEntrega: number) => {
    const cal = Number(calForm.calificacion)
    if (isNaN(cal) || cal < 0 || cal > tarea.puntosMaximos) {
      toast.error(`La calificacion debe ser entre 0 y ${tarea.puntosMaximos}`)
      return
    }
    try {
      await calificarEntrega(idEntrega, {
        calificacion: cal,
        retroalimentacion: calForm.retroalimentacion || undefined,
      })
      toast.success("Entrega calificada")
      setCalificando(null)
      setCalForm({ calificacion: "", retroalimentacion: "" })
      // Reload
      const updated = await getEntregasTarea(tarea.id)
      setEntregas(updated)
      onUpdate()
    } catch {
      toast.error("Error al calificar")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Entregas: {tarea.titulo}</DialogTitle>
          <DialogDescription>
            {entregas.length} {entregas.length === 1 ? "entrega" : "entregas"} recibidas
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          </div>
        ) : entregas.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No hay entregas aun</p>
        ) : (
          <div className="space-y-4">
            {entregas.map((entrega) => (
              <div key={entrega.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{entrega.nombreAlumno}</p>
                    <p className="text-sm text-muted-foreground font-mono">{entrega.matricula}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {entrega.revisada ? (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {entrega.calificacion}/{tarea.puntosMaximos}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        Pendiente
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{entrega.nombreArchivo}</span>
                  <span>&middot;</span>
                  <span>{new Date(entrega.fechaEntrega).toLocaleString("es-MX")}</span>
                </div>

                {entrega.retroalimentacion && (
                  <p className="text-sm bg-muted/50 p-2 rounded">{entrega.retroalimentacion}</p>
                )}

                <div className="flex gap-2">
                  {!entrega.revisada && calificando !== entrega.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCalificando(entrega.id)
                        setCalForm({ calificacion: "", retroalimentacion: "" })
                      }}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Calificar
                    </Button>
                  )}
                </div>

                {calificando === entrega.id && (
                  <div className="space-y-3 border-t pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Calificacion (0-{tarea.puntosMaximos})</Label>
                        <Input
                          type="number"
                          min={0}
                          max={tarea.puntosMaximos}
                          value={calForm.calificacion}
                          onChange={(e) => setCalForm((prev) => ({ ...prev, calificacion: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Retroalimentacion (opcional)</Label>
                      <Textarea
                        rows={2}
                        value={calForm.retroalimentacion}
                        onChange={(e) => setCalForm((prev) => ({ ...prev, retroalimentacion: e.target.value }))}
                        placeholder="Comentarios para el alumno..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                        onClick={() => handleCalificar(entrega.id)}
                      >
                        Guardar Calificacion
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCalificando(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
