"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import {
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  NotebookPen,
  UserCircle,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getDocentePerfil, getMisGrupos } from "@/services/docente-portal-service"
import type { DocentePerfil, GrupoMateriaDocente } from "@/types/docente-portal"

import { StatCard, StatGrid } from "../_components/shared/stat-card"

const portalSections = [
  {
    title: "Mi Perfil",
    description: "Consulta y actualiza tu informacion personal",
    href: "/dashboard/portal-docente/perfil",
    icon: UserCircle,
    gradient: "from-blue-500 to-blue-600",
  },
  {
    title: "Mis Grupos",
    description: "Materias y grupos asignados este periodo",
    href: "/dashboard/portal-docente/mis-grupos",
    icon: Users,
    gradient: "from-indigo-500 to-indigo-600",
  },
  {
    title: "Asistencia",
    description: "Registra la asistencia de tus alumnos",
    href: "/dashboard/portal-docente/asistencia",
    icon: ClipboardList,
    gradient: "from-amber-500 to-amber-600",
  },
  {
    title: "Calificaciones",
    description: "Captura y administra calificaciones parciales",
    href: "/dashboard/portal-docente/calificaciones",
    icon: GraduationCap,
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    title: "Planeaciones",
    description: "Sube tus planeaciones por materia",
    href: "/dashboard/portal-docente/planeaciones",
    icon: FileText,
    gradient: "from-purple-500 to-purple-600",
  },
  {
    title: "Tareas",
    description: "Crea tareas y revisa entregas de alumnos",
    href: "/dashboard/portal-docente/tareas",
    icon: NotebookPen,
    gradient: "from-rose-500 to-rose-600",
  },
]

export default function PortalDocentePage() {
  const [perfil, setPerfil] = useState<DocentePerfil | null>(null)
  const [grupos, setGrupos] = useState<GrupoMateriaDocente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [perfilData, gruposData] = await Promise.all([
          getDocentePerfil(),
          getMisGrupos(),
        ])
        setPerfil(perfilData)
        setGrupos(gruposData)
      } catch {
        // silently handle - will show empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-orange-800 dark:from-orange-400 dark:to-orange-600 bg-clip-text text-transparent">
              Mi Portal Docente
            </h1>
            <p className="text-muted-foreground mt-1">
              {perfil ? `Bienvenido, ${perfil.nombreCompleto}` : "Gestiona tu actividad academica"}
            </p>
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <BookOpen className="h-3 w-3 mr-1" />
            Docente
          </Badge>
        </div>
        <Separator />
      </div>

      {/* Stats resumen */}
      {perfil && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-orange-600" />
            Resumen
          </h2>
          <StatGrid columns={3}>
            <StatCard
              title="Grupos Asignados"
              value={grupos.length || perfil.totalGrupos}
              description="Este periodo"
              icon={Users}
              gradient="from-indigo-500 to-indigo-600"
              link="/dashboard/portal-docente/mis-grupos"
            />
            <StatCard
              title="Total Estudiantes"
              value={perfil.totalEstudiantes}
              description="En tus grupos"
              icon={GraduationCap}
              gradient="from-emerald-500 to-emerald-600"
            />
            <StatCard
              title="No. Empleado"
              value={perfil.noEmpleado || "—"}
              description={perfil.campusNombre || "Campus"}
              icon={UserCircle}
              gradient="from-blue-500 to-blue-600"
              link="/dashboard/portal-docente/perfil"
            />
          </StatGrid>
        </div>
      )}

      {/* Secciones de acceso rapido */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-orange-600" />
          Secciones
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {portalSections.map((section) => {
            const Icon = section.icon
            return (
              <Link key={section.href} href={section.href}>
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-orange-300 dark:hover:border-orange-700 h-full">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg text-white shadow-md group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br ${section.gradient}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base">{section.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
