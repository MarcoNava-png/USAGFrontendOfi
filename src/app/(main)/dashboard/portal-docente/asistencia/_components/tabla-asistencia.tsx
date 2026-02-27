"use client"

import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AsistenciaEstudiante } from "@/types/docente-portal"

type EstadoAsistencia = "presente" | "ausente" | "justificada"

interface AsistenciaRow {
  idInscripcion: number
  idEstudiante: number
  matricula: string
  nombreCompleto: string
  estado: EstadoAsistencia
}

interface TablaAsistenciaProps {
  rows: AsistenciaRow[]
  onChange: (idInscripcion: number, estado: EstadoAsistencia) => void
  readOnly?: boolean
}

export type { AsistenciaRow, EstadoAsistencia }

export function buildRowsFromApi(data: AsistenciaEstudiante[]): AsistenciaRow[] {
  return data.map((e) => {
    let estado: EstadoAsistencia = "ausente"
    if (e.presente === true) estado = "presente"
    else if (e.justificada) estado = "justificada"
    return {
      idInscripcion: e.idInscripcion,
      idEstudiante: e.idEstudiante,
      matricula: e.matricula,
      nombreCompleto: e.nombreCompleto,
      estado,
    }
  })
}

export function TablaAsistencia({ rows, onChange, readOnly }: TablaAsistenciaProps) {
  const totalPresentes = rows.filter((r) => r.estado === "presente").length
  const totalAusentes = rows.filter((r) => r.estado === "ausente").length
  const totalJustificadas = rows.filter((r) => r.estado === "justificada").length

  return (
    <div className="space-y-3">
      <div className="flex gap-3 flex-wrap">
        <Badge variant="outline" className="text-emerald-600 border-emerald-300">
          Presentes: {totalPresentes}
        </Badge>
        <Badge variant="outline" className="text-red-600 border-red-300">
          Ausentes: {totalAusentes}
        </Badge>
        <Badge variant="outline" className="text-amber-600 border-amber-300">
          Justificadas: {totalJustificadas}
        </Badge>
        <Badge variant="secondary">Total: {rows.length}</Badge>
      </div>

      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead className="w-32">Matricula</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-center w-[300px]">Asistencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={row.idInscripcion}>
                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="font-mono text-sm">{row.matricula}</TableCell>
                <TableCell>{row.nombreCompleto}</TableCell>
                <TableCell>
                  <RadioGroup
                    value={row.estado}
                    onValueChange={(val) => onChange(row.idInscripcion, val as EstadoAsistencia)}
                    className="flex items-center justify-center gap-4"
                    disabled={readOnly}
                  >
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="presente" id={`p-${row.idInscripcion}`} />
                      <Label htmlFor={`p-${row.idInscripcion}`} className="text-xs cursor-pointer text-emerald-700">
                        Presente
                      </Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="ausente" id={`a-${row.idInscripcion}`} />
                      <Label htmlFor={`a-${row.idInscripcion}`} className="text-xs cursor-pointer text-red-700">
                        Ausente
                      </Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="justificada" id={`j-${row.idInscripcion}`} />
                      <Label htmlFor={`j-${row.idInscripcion}`} className="text-xs cursor-pointer text-amber-700">
                        Justificada
                      </Label>
                    </div>
                  </RadioGroup>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
