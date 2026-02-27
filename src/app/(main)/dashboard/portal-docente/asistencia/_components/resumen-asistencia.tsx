"use client"

import { AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ResumenAsistencia } from "@/types/docente-portal"

interface ResumenAsistenciaTableProps {
  data: ResumenAsistencia[]
}

export function ResumenAsistenciaTable({ data }: ResumenAsistenciaTableProps) {
  if (data.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No hay datos de asistencia registrados</p>
  }

  return (
    <div className="border rounded-lg overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead className="w-32">Matricula</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead className="text-center">Clases</TableHead>
            <TableHead className="text-center">Asist.</TableHead>
            <TableHead className="text-center">Faltas</TableHead>
            <TableHead className="text-center">Justif.</TableHead>
            <TableHead className="text-center w-[160px]">% Asistencia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={row.idEstudiante} className={row.alerta ? "bg-red-50 dark:bg-red-950/20" : ""}>
              <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
              <TableCell className="font-mono text-sm">{row.matricula}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {row.nombreCompleto}
                  {row.alerta && <AlertTriangle className="h-4 w-4 text-red-500" />}
                </div>
              </TableCell>
              <TableCell className="text-center">{row.totalClases}</TableCell>
              <TableCell className="text-center font-medium text-emerald-600">{row.asistencias}</TableCell>
              <TableCell className="text-center font-medium text-red-600">{row.faltas}</TableCell>
              <TableCell className="text-center font-medium text-amber-600">{row.faltasJustificadas}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress
                    value={row.porcentajeAsistencia}
                    className="h-2 flex-1"
                  />
                  <Badge
                    variant={row.porcentajeAsistencia >= 80 ? "outline" : "destructive"}
                    className="min-w-[50px] justify-center text-xs"
                  >
                    {row.porcentajeAsistencia.toFixed(0)}%
                  </Badge>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
