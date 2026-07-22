'use client'

import { useState } from 'react'

import { Loader2, Search, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import documentosEstudianteService from '@/services/documentos-estudiante-service'
import { getStudentsList } from '@/services/students-service'
import {
  VARIANTE_LABELS,
  type TipoDocumento,
  type VarianteDocumento,
} from '@/types/documentos-estudiante'
import type { Student } from '@/types/student'

interface CrearSolicitudModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tiposDocumento: TipoDocumento[]
  onSuccess: () => void
}

function BuscarEstudianteStep({
  onSelectStudent,
}: {
  onSelectStudent: (student: Student) => void
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Ingrese un termino de busqueda')
      return
    }

    try {
      setSearching(true)
      const normalizar = (s: string) =>
        s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
      const termino = normalizar(searchTerm)
      const response = await getStudentsList(1, 100000)
      const filtered = response.items?.filter(
        (s: Student) =>
          normalizar(s.matricula ?? '').includes(termino) ||
          normalizar(s.nombreCompleto ?? '').includes(termino)
      )
      setStudents(filtered ?? [])
    } catch (error) {
      console.error('Error al buscar estudiantes:', error)
      toast.error('Error al buscar estudiantes')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Matricula o nombre del estudiante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
        </Button>
      </div>

      {students.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">{students.length} resultado(s)</p>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto rounded-lg border p-2">
            {students.map((student) => (
              <div
                key={student.idEstudiante}
                className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-3 hover:bg-muted"
                onClick={() => onSelectStudent(student)}
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold">{student.nombreCompleto}</p>
                  <div className="flex flex-wrap items-center gap-x-2 text-sm">
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-xs font-medium text-blue-700">
                      {student.matricula}
                    </span>
                    <span className="text-muted-foreground">{student.planEstudios}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    {student.email ? <span>✉ {student.email}</span> : null}
                    {student.telefono ? <span>📞 {student.telefono}</span> : null}
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="flex-shrink-0">
                  <UserCheck className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {students.length === 0 && searchTerm && !searching && (
        <p className="py-8 text-center text-muted-foreground">
          No se encontraron estudiantes
        </p>
      )}
    </div>
  )
}

function CrearSolicitudStep({
  student,
  tiposDocumento,
  onSubmit,
  submitting,
}: {
  student: Student
  tiposDocumento: TipoDocumento[]
  onSubmit: (data: { idTipoDocumento: number; variante: VarianteDocumento; notas?: string }) => void
  submitting: boolean
}) {
  const [idTipoDocumento, setIdTipoDocumento] = useState<number | null>(null)
  const [variante, setVariante] = useState<VarianteDocumento>('COMPLETO')
  const [notas, setNotas] = useState('')

  const selectedTipo = tiposDocumento.find((t) => t.idTipoDocumento === idTipoDocumento)

  const handleSubmit = () => {
    if (!idTipoDocumento) {
      toast.error('Seleccione un tipo de documento')
      return
    }
    onSubmit({ idTipoDocumento, variante, notas: notas || undefined })
  }

  return (
    <div className="space-y-4">
      {/* Estudiante seleccionado */}
      <div className="rounded-lg border bg-muted/40 p-4">
        <div className="flex items-center gap-3">
          <UserCheck className="h-8 w-8 text-primary" />
          <div>
            <p className="font-medium">{student.nombreCompleto}</p>
            <p className="text-sm text-muted-foreground">
              {student.matricula} - {student.planEstudios}
            </p>
          </div>
        </div>
      </div>

      {/* Tipo de documento */}
      <div className="space-y-2">
        <Label>Tipo de Documento</Label>
        <Select
          value={idTipoDocumento?.toString() ?? ''}
          onValueChange={(value) => setIdTipoDocumento(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccione el tipo de documento" />
          </SelectTrigger>
          <SelectContent>
            {tiposDocumento.map((tipo) => (
              <SelectItem key={tipo.idTipoDocumento} value={tipo.idTipoDocumento.toString()}>
                <div className="flex items-center justify-between gap-4">
                  <span>{tipo.nombre}</span>
                  {tipo.requierePago && (
                    <Badge variant="secondary">${tipo.precio.toFixed(2)}</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedTipo?.descripcion && (
          <p className="text-sm text-muted-foreground">{selectedTipo.descripcion}</p>
        )}
      </div>

      {/* Variante */}
      <div className="space-y-2">
        <Label>Variante</Label>
        <Select value={variante} onValueChange={(value) => setVariante(value as VarianteDocumento)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(VARIANTE_LABELS) as VarianteDocumento[]).map((key) => (
              <SelectItem key={key} value={key}>
                {VARIANTE_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label>Notas (opcional)</Label>
        <Textarea
          placeholder="Notas adicionales sobre la solicitud..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
        />
      </div>

      {/* Resumen de costo */}
      {selectedTipo && (
        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Costo del documento:</span>
            <span className="text-xl font-bold">
              {selectedTipo.requierePago ? `$${selectedTipo.precio.toFixed(2)}` : 'Sin costo'}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Vigencia: {selectedTipo.diasVigencia} dias
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={submitting || !idTipoDocumento}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Solicitud
        </Button>
      </div>
    </div>
  )
}

export function CrearSolicitudModal({
  open,
  onOpenChange,
  tiposDocumento,
  onSuccess,
}: CrearSolicitudModalProps) {
  const [step, setStep] = useState<'buscar' | 'crear'>('buscar')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student)
    setStep('crear')
  }

  const handleSubmit = async (data: { idTipoDocumento: number; variante: VarianteDocumento; notas?: string }) => {
    if (!selectedStudent) return

    try {
      setSubmitting(true)
      await documentosEstudianteService.crearSolicitud({
        idEstudiante: selectedStudent.idEstudiante,
        ...data,
      })
      toast.success('Solicitud creada exitosamente')
      onSuccess()
      handleClose()
    } catch (error) {
      console.error('Error al crear solicitud:', error)
      toast.error('Error al crear la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep('buscar')
    setSelectedStudent(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'buscar' ? 'Buscar Estudiante' : 'Crear Solicitud de Documento'}
          </DialogTitle>
          <DialogDescription>
            {step === 'buscar'
              ? 'Busque al estudiante por matricula o nombre'
              : `Crear solicitud para ${selectedStudent?.nombreCompleto}`}
          </DialogDescription>
        </DialogHeader>

        {step === 'buscar' ? (
          <BuscarEstudianteStep onSelectStudent={handleSelectStudent} />
        ) : selectedStudent ? (
          <CrearSolicitudStep
            student={selectedStudent}
            tiposDocumento={tiposDocumento}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        ) : null}

        <DialogFooter>
          {step === 'crear' && (
            <Button variant="outline" onClick={() => setStep('buscar')}>
              Cambiar estudiante
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
