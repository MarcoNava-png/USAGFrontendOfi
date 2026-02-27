"use client"

import { useRef, useState } from "react"
import { Loader2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { entregarTarea } from "@/services/docente-portal-service"
import { toast } from "sonner"

interface SubirEntregaDialogProps {
  idTarea: number
  titulo: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SubirEntregaDialog({ idTarea, titulo, open, onOpenChange, onSuccess }: SubirEntregaDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    if (!file) return
    setUploading(true)
    try {
      await entregarTarea(idTarea, file)
      toast.success("Tarea entregada correctamente")
      setFile(null)
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al entregar la tarea"
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Entregar Tarea</DialogTitle>
          <DialogDescription>{titulo}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-300 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {file ? (
              <p className="text-sm font-medium">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>
            ) : (
              <>
                <p className="text-sm font-medium">Selecciona tu archivo</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, JPG, PNG — Max 5MB</p>
              </>
            )}
            <Input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Entregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
