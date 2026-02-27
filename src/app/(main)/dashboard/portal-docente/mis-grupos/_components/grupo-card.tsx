"use client"

import { Clock, MapPin, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { GrupoMateriaDocente } from "@/types/docente-portal"

interface GrupoCardProps {
  grupo: GrupoMateriaDocente
}

export function GrupoCard({ grupo }: GrupoCardProps) {
  const ocupacion = grupo.cupo > 0 ? Math.round((grupo.totalInscritos / grupo.cupo) * 100) : 0

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-orange-300 dark:hover:border-orange-700 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base leading-tight">{grupo.nombreMateria}</CardTitle>
            {grupo.claveMateria && (
              <p className="text-xs text-muted-foreground mt-1">{grupo.claveMateria}</p>
            )}
          </div>
          {grupo.codigoGrupo && (
            <Badge variant="outline" className="shrink-0 text-orange-600 border-orange-300">
              {grupo.codigoGrupo}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Grupo y Plan */}
        {(grupo.nombreGrupo || grupo.planEstudios) && (
          <div className="text-sm text-muted-foreground">
            {grupo.nombreGrupo && <span>{grupo.nombreGrupo}</span>}
            {grupo.nombreGrupo && grupo.planEstudios && <span> &middot; </span>}
            {grupo.planEstudios && <span>{grupo.planEstudios}</span>}
          </div>
        )}

        {/* Periodo */}
        {grupo.periodoNombre && (
          <Badge variant="secondary" className="text-xs">
            {grupo.periodoNombre}
          </Badge>
        )}

        {/* Cuatrimestre */}
        {grupo.numeroCuatrimestre && (
          <div className="text-sm text-muted-foreground">
            Cuatrimestre {grupo.numeroCuatrimestre}
          </div>
        )}

        {/* Horarios */}
        {grupo.horarios.length > 0 && (
          <div className="space-y-1">
            {grupo.horarios.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium">{h.dia}</span>
                <span className="text-muted-foreground">
                  {formatTime(h.horaInicio)} - {formatTime(h.horaFin)}
                </span>
                {h.aula && (
                  <>
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
                    <span className="text-muted-foreground">{h.aula}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Aula general si no viene en horarios */}
        {grupo.horarios.length === 0 && grupo.aula && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {grupo.aula}
          </div>
        )}

        {/* Inscritos / Cupo */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Inscritos</span>
            </div>
            <span className="font-medium">
              {grupo.totalInscritos} / {grupo.cupo}
            </span>
          </div>
          <Progress value={ocupacion} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  )
}

function formatTime(time: string): string {
  const parts = time.split(":")
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`
  return time
}
