"use client"

import { useRef, useState } from "react"
import { Loader2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { uploadPlaneacion } from "@/services/docente-portal-service"
import { toast } from "sonner"

interface UploadPlaneacionProps {
  idGrupoMateria: number
  onSuccess: () => void
}

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export function UploadPlaneacion({ idGrupoMateria, onSuccess }: UploadPlaneacionProps) {
  const [file, setFile] = useState<File | null>(null)
  const [descripcion, setDescripcion] = useState("")
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error("Tipo de archivo no permitido. Solo PDF, DOC, DOCX, JPG, PNG")
      return
    }
    if (f.size > MAX_SIZE) {
      toast.error("El archivo excede el tamaño maximo de 5MB")
      return
    }
    setFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file) return
    setUploading(true)
    try {
      await uploadPlaneacion(idGrupoMateria, file, descripcion || undefined)
      toast.success("Planeacion subida correctamente")
      setFile(null)
      setDescripcion("")
      if (inputRef.current) inputRef.current.value = ""
      onSuccess()
    } catch {
      toast.error("Error al subir la planeacion")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20"
            : "border-muted-foreground/25 hover:border-orange-300"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        {file ? (
          <p className="text-sm font-medium">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>
        ) : (
          <>
            <p className="text-sm font-medium">Arrastra un archivo aqui o haz clic para seleccionar</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, JPG, PNG — Max 5MB</p>
          </>
        )}
        <Input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />
      </div>

      {file && (
        <>
          <div className="space-y-2">
            <Label>Descripcion (opcional)</Label>
            <Textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Planeacion del primer parcial"
              maxLength={500}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = "" }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={uploading} className="bg-orange-600 hover:bg-orange-700">
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Subir Planeacion
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
