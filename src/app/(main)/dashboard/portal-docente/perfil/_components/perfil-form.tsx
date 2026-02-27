"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { updateDocentePerfil } from "@/services/docente-portal-service"
import { toast } from "sonner"

const perfilSchema = z.object({
  telefono: z
    .string()
    .max(20, "Maximo 20 caracteres")
    .optional()
    .or(z.literal("")),
  correo: z
    .string()
    .email("Correo no valido")
    .max(100, "Maximo 100 caracteres")
    .optional()
    .or(z.literal("")),
})

type PerfilFormValues = z.infer<typeof perfilSchema>

interface PerfilFormProps {
  defaultValues: PerfilFormValues
  onSuccess?: () => void
}

export function PerfilForm({ defaultValues, onSuccess }: PerfilFormProps) {
  const [saving, setSaving] = useState(false)

  const form = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues,
  })

  const onSubmit = async (values: PerfilFormValues) => {
    try {
      setSaving(true)
      await updateDocentePerfil({
        telefono: values.telefono || undefined,
        correo: values.correo || undefined,
      })
      toast.success("Datos actualizados correctamente")
      onSuccess?.()
    } catch {
      toast.error("Error al actualizar los datos")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefono</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. 55 1234 5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="correo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo Personal</FormLabel>
                <FormControl>
                  <Input placeholder="correo@ejemplo.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="bg-orange-600 hover:bg-orange-700">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Form>
  )
}
