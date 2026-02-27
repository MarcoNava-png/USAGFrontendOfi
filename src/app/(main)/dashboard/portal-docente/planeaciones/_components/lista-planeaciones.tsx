"use client"

import { Download, FileText, Loader2, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { PlaneacionDocente } from "@/types/docente-portal"

interface ListaPlaneacionesProps {
  planeaciones: PlaneacionDocente[]
  onDelete: (id: number) => void
  deleting: number | null
  baseUrl: string
}

export function ListaPlaneaciones({ planeaciones, onDelete, deleting, baseUrl }: ListaPlaneacionesProps) {
  if (planeaciones.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No hay planeaciones subidas para este grupo</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {planeaciones.map((p) => (
        <Card key={p.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{p.nombreArchivo}</p>
              <div className="flex items-center gap-2 mt-1">
                {p.descripcion && (
                  <p className="text-sm text-muted-foreground truncate">{p.descripcion}</p>
                )}
                <Badge variant="secondary" className="text-xs shrink-0">
                  {formatSize(p.tamanoBytes)}
                </Badge>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(p.fechaSubida)}
                </span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={`${baseUrl}${p.urlArchivo}`} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(p.id)}
                disabled={deleting === p.id}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {deleting === p.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}
