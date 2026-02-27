"use client"

import { useEffect, useState } from "react"

import {
  ArrowLeft,
  BookOpen,
  Building2,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  UserCircle,
  Users,
} from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { getDocentePerfil } from "@/services/docente-portal-service"
import type { DocentePerfil } from "@/types/docente-portal"

import { PerfilForm } from "./_components/perfil-form"

export default function PerfilDocentePage() {
  const [perfil, setPerfil] = useState<DocentePerfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPerfil = async () => {
    try {
      setLoading(true)
      const data = await getDocentePerfil()
      setPerfil(data)
      setError(null)
    } catch {
      setError("No se pudo cargar la informacion del perfil")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPerfil()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (error || !perfil) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/portal-docente">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error || "No se encontro informacion del perfil"}</p>
            <Button variant="outline" className="mt-4" onClick={loadPerfil}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/portal-docente">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-orange-800 dark:from-orange-400 dark:to-orange-600 bg-clip-text text-transparent">
              Mi Perfil
            </h1>
            <p className="text-muted-foreground mt-1">Consulta y actualiza tu informacion</p>
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <BookOpen className="h-3 w-3 mr-1" />
            Docente
          </Badge>
        </div>
        <Separator />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informacion personal (solo lectura) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <UserCircle className="h-5 w-5" />
                </div>
                Datos Personales
              </CardTitle>
              <CardDescription>Informacion registrada en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoField label="Nombre Completo" value={perfil.nombreCompleto} />
                <InfoField label="No. Empleado" value={perfil.noEmpleado} />
                <InfoField label="CURP" value={perfil.curp} />
                <InfoField label="Fecha de Nacimiento" value={perfil.fechaNacimiento ? formatDate(perfil.fechaNacimiento) : undefined} />
                <InfoField label="Email Institucional" value={perfil.emailInstitucional} icon={<Mail className="h-4 w-4 text-muted-foreground" />} />
                <InfoField label="Campus" value={perfil.campusNombre} icon={<Building2 className="h-4 w-4 text-muted-foreground" />} />
              </div>
            </CardContent>
          </Card>

          {/* Formulario editable */}
          <Card className="border-2 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <Phone className="h-5 w-5" />
                </div>
                Datos de Contacto
              </CardTitle>
              <CardDescription>Puedes actualizar tu telefono y correo personal</CardDescription>
            </CardHeader>
            <CardContent>
              <PerfilForm
                defaultValues={{
                  telefono: perfil.telefono || "",
                  correo: perfil.correo || "",
                }}
                onSuccess={loadPerfil}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar resumen */}
        <div className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="h-5 w-5 text-orange-600" />
                Resumen Academico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Grupos</span>
                </div>
                <span className="text-lg font-bold">{perfil.totalGrupos}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Estudiantes</span>
                </div>
                <span className="text-lg font-bold">{perfil.totalEstudiantes}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-medium">{value || "—"}</p>
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}
