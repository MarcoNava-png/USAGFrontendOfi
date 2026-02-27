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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const evaluacionSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  tipoEvaluacion: z.string().min(1, "Tipo requerido"),
  pesoEvaluacion: z.coerce.number().min(1, "Minimo 1%").max(100, "Maximo 100%"),
  maxPuntos: z.coerce.number().min(1, "Minimo 1 punto"),
})

type EvaluacionFormValues = z.infer<typeof evaluacionSchema>

const tiposEvaluacion = [
  { value: "0", label: "Tarea" },
  { value: "1", label: "Examen" },
  { value: "2", label: "Proyecto" },
]

interface EvaluacionFormProps {
  onSubmit: (values: EvaluacionFormValues) => Promise<void>
}

export type { EvaluacionFormValues }

export function EvaluacionFormDialog({ onSubmit }: EvaluacionFormProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const form = useForm<EvaluacionFormValues>({
    resolver: zodResolver(evaluacionSchema),
    defaultValues: {
      nombre: "",
      tipoEvaluacion: "",
      pesoEvaluacion: 0,
      maxPuntos: 100,
    },
  })

  const handleSubmit = async (values: EvaluacionFormValues) => {
    setSaving(true)
    try {
      await onSubmit(values)
      form.reset()
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Evaluacion
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Evaluacion</DialogTitle>
          <DialogDescription>
            Define el tipo, nombre, peso y puntos maximos de la evaluacion
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Examen Unidad 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipoEvaluacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiposEvaluacion.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pesoEvaluacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxPuntos"
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
                Agregar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
