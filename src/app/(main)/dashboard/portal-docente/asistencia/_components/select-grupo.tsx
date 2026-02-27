"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { GrupoMateriaDocente } from "@/types/docente-portal"

interface SelectGrupoProps {
  grupos: GrupoMateriaDocente[]
  value?: string
  onValueChange: (value: string) => void
}

export function SelectGrupo({ grupos, value, onValueChange }: SelectGrupoProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
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
  )
}
