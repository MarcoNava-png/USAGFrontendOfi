"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { GrupoMateriaDocente, ParcialStatus } from "@/types/docente-portal"

interface SelectGrupoParcialProps {
  grupos: GrupoMateriaDocente[]
  parciales: ParcialStatus[]
  selectedGrupo: string
  selectedParcial: string
  onGrupoChange: (value: string) => void
  onParcialChange: (value: string) => void
}

const statusColor: Record<string, string> = {
  "Abierto": "text-emerald-600 border-emerald-300",
  "Cerrado": "text-red-600 border-red-300",
  "Publicado": "text-blue-600 border-blue-300",
  "Sin abrir": "text-gray-500 border-gray-300",
}

export function SelectGrupoParcial({
  grupos,
  parciales,
  selectedGrupo,
  selectedParcial,
  onGrupoChange,
  onParcialChange,
}: SelectGrupoParcialProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Select value={selectedGrupo} onValueChange={onGrupoChange}>
        <SelectTrigger className="w-full sm:w-[350px]">
          <SelectValue placeholder="Selecciona un grupo..." />
        </SelectTrigger>
        <SelectContent>
          {grupos.map((g) => (
            <SelectItem key={g.idGrupoMateria} value={String(g.idGrupoMateria)}>
              {g.nombreMateria} — {g.codigoGrupo || g.nombreGrupo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {parciales.length > 0 && (
        <Select value={selectedParcial} onValueChange={onParcialChange}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Selecciona parcial..." />
          </SelectTrigger>
          <SelectContent>
            {parciales.map((p) => (
              <SelectItem key={p.parcialId} value={String(p.parcialId)}>
                <span className="flex items-center gap-2">
                  {p.nombre}
                  <Badge variant="outline" className={`text-xs ${statusColor[p.status] || ""}`}>
                    {p.status}
                  </Badge>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
