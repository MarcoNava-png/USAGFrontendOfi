"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { crearTarea } from "@/services/docente-portal-service"
import { toast } from "sonner"

const tareaSchema = z.object({
  titulo: z.string().min(1, "Titulo requerido").max(200),
  descripcion: z.string().max(2000).optional().or(z.literal("")),
  fechaLimite: z.string().min(1, "Fecha limite requerida"),
  puntosMaximos: z.coerce.number().min(1, "Minimo 1 punto"),
})

type TareaFormValues = z.infer<typeof tareaSchema>

interface CrearTareaDialogProps {
  idGrupoMateria: number
  onSuccess: () => void
}

export function CrearTareaDialog({ idGrupoMateria, onSuccess }: CrearTareaDialogProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const form = useForm<TareaFormValues>({
    resolver: zodResolver(tareaSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      fechaLimite: "",
      puntosMaximos: 100,
    },
  })

  const handleSubmit = async (values: TareaFormValues) => {
    setSaving(true)
    try {
      await crearTarea({
        idGrupoMateria,
        titulo: values.titulo,
        descripcion: values.descripcion || undefined,
        fechaLimite: values.fechaLimite,
        puntosMaximos: values.puntosMaximos,
      })
      toast.success("Tarea creada correctamente")
      form.reset()
      setOpen(false)
      onSuccess()
    } catch {
      toast.error("Error al crear la tarea")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Tarea</DialogTitle>
          <DialogDescription>Define los detalles de la nueva tarea</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titulo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Trabajo de investigacion" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripcion (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Instrucciones de la tarea..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fechaLimite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Limite</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="puntosMaximos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puntos Maximos</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving} className="bg-orange-600 hover:bg-orange-700">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Tarea
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
