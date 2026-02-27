"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getMisGrupos } from "@/services/docente-portal-service"
import type { GrupoMateriaDocente } from "@/types/docente-portal"

import { GrupoCard } from "./_components/grupo-card"

export default function MisGruposPage() {
  const [grupos, setGrupos] = useState<GrupoMateriaDocente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await getMisGrupos()
        setGrupos(data)
      } catch {
        setError("No se pudieron cargar los grupos")
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
              Mis Grupos
            </h1>
            <p className="text-muted-foreground mt-1">Materias y grupos asignados</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              <Users className="h-3 w-3 mr-1" />
              {grupos.length} {grupos.length === 1 ? "grupo" : "grupos"}
            </Badge>
          </div>
        </div>
        <Separator />
      </div>

      {/* Error state */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!error && grupos.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium">Sin grupos asignados</h3>
          <p className="text-muted-foreground mt-1">No tienes materias asignadas en el periodo actual</p>
        </div>
      )}

      {/* Grid de grupos */}
      {!error && grupos.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {grupos.map((grupo) => (
            <GrupoCard key={grupo.idGrupoMateria} grupo={grupo} />
          ))}
        </div>
      )}
    </div>
  )
}
