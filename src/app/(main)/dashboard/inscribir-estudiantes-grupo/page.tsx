'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Search,
  Upload,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import {
  readExcelAsObjects,
} from '@/lib/excel'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCampusList } from '@/services/campus-service'
import {
  getStudyPlans,
  getAcademicPeriods,
} from '@/services/catalogs-service'
import {
  getGroups,
  importarEstudiantesCompleto,
  getEstudiantesDelGrupoDirecto,
  type ImportarEstudiantesGrupoResponse,
  type EstudiantesDelGrupoResponse,
  type EstudianteImportar,
} from '@/services/groups-service'
import type { Campus } from '@/types/campus'
import type { StudyPlan, AcademicPeriod } from '@/types/catalog'

interface EstudianteParaInscribir extends EstudianteImportar {
  seleccionado: boolean
  fila: number
}

type Step = 'select-group' | 'load-students' | 'confirm' | 'results'

const PLANTILLA_COLUMNAS = [
  'Nombre',
  'ApellidoPaterno',
  'ApellidoMaterno',
  'Genero',
  'CURP',
  'Correo',
  'Telefono',
  'Celular',
  'FechaNacimiento',
  'Matricula',
]

const mapearGenero = (generoTexto: string): number | undefined => {
  if (!generoTexto) return undefined
  const texto = generoTexto.toLowerCase().trim()
  if (['m', 'masculino', 'hombre', 'h', 'male', '1'].includes(texto)) return 1
  if (['f', 'femenino', 'mujer', 'female', '2'].includes(texto)) return 2
  return undefined
}

export default function InscribirEstudiantesGrupoPage() {
  const [step, setStep] = useState<Step>('select-group')
  const [loading, setLoading] = useState(false)

  const [campuses, setCampuses] = useState<Campus[]>([])
  const [planes, setPlanes] = useState<StudyPlan[]>([])
  const [periodos, setPeriodos] = useState<AcademicPeriod[]>([])
  const [grupos, setGrupos] = useState<{ idGrupo: number; nombreGrupo: string; codigoGrupo?: string }[]>([])
  const [selectedCampus, setSelectedCampus] = useState<string>('all')
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('')
  const [selectedGrupo, setSelectedGrupo] = useState<string>('')
  const [grupoInfo, setGrupoInfo] = useState<EstudiantesDelGrupoResponse | null>(null)

  const [estudiantes, setEstudiantes] = useState<EstudianteParaInscribir[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const [resultado, setResultado] = useState<ImportarEstudiantesGrupoResponse | null>(null)

  const planesFiltrados = selectedCampus === 'all'
    ? planes
    : planes.filter(p => p.idCampus?.toString() === selectedCampus)

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [campusData, planesData, periodosData] = await Promise.all([
          getCampusList(),
          getStudyPlans(),
          getAcademicPeriods(),
        ])
        setCampuses(campusData.items || [])
        setPlanes(planesData)
        setPeriodos(periodosData)
      } catch (error) {
        console.error('Error cargando datos iniciales:', error)
        toast.error('Error al cargar datos iniciales')
      }
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    if (planesFiltrados.length > 0) {
      const exists = planesFiltrados.some(p => p.idPlanEstudios.toString() === selectedPlan)
      if (!exists) {
        setSelectedPlan(planesFiltrados[0].idPlanEstudios.toString())
      }
    } else {
      setSelectedPlan('')
    }
  }, [selectedCampus, planesFiltrados])

  useEffect(() => {
    const loadGrupos = async () => {
      if (!selectedPlan || !selectedPeriodo) {
        setGrupos([])
        return
      }

      try {
        const response = await getGroups(1, 1000, parseInt(selectedPeriodo))
        const gruposFiltrados = response.items.filter(
          (g) => g.idPlanEstudios === parseInt(selectedPlan)
        )
        setGrupos(gruposFiltrados.map(g => ({
          idGrupo: g.idGrupo,
          nombreGrupo: g.nombreGrupo,
          codigoGrupo: g.codigoGrupo
        })))
      } catch (error) {
        console.error('Error cargando grupos:', error)
      }
    }
    loadGrupos()
  }, [selectedPlan, selectedPeriodo])

  useEffect(() => {
    const loadGrupoInfo = async () => {
      if (!selectedGrupo) {
        setGrupoInfo(null)
        return
      }

      try {
        const info = await getEstudiantesDelGrupoDirecto(parseInt(selectedGrupo))
        setGrupoInfo(info)
      } catch (error) {
        console.error('Error cargando info del grupo:', error)
        const grupoSeleccionado = grupos.find(g => g.idGrupo === parseInt(selectedGrupo))
        if (grupoSeleccionado) {
          setGrupoInfo({
            idGrupo: grupoSeleccionado.idGrupo,
            nombreGrupo: grupoSeleccionado.nombreGrupo,
            codigoGrupo: grupoSeleccionado.codigoGrupo,
            planEstudios: planes.find(p => p.idPlanEstudios === parseInt(selectedPlan))?.nombrePlanEstudios || '',
            periodoAcademico: periodos.find(p => p.idPeriodoAcademico === parseInt(selectedPeriodo))?.nombre || '',
            numeroCuatrimestre: 1,
            totalEstudiantes: 0,
            capacidadMaxima: 40,
            cupoDisponible: 40,
            estudiantes: []
          })
        }
      }
    }
    loadGrupoInfo()
  }, [selectedGrupo, grupos, planes, periodos, selectedPlan, selectedPeriodo])

  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'USAG - Sistema Académico'
    workbook.created = new Date()

    const ws = workbook.addWorksheet('Estudiantes', {
      properties: { defaultRowHeight: 20 },
    })

    // --- Fetch logo ---
    let logoId: number | undefined
    try {
      const res = await fetch('/Logousag.png')
      const buf = await res.arrayBuffer()
      logoId = workbook.addImage({ buffer: buf, extension: 'png' })
    } catch { /* logo optional */ }

    // --- Colors ---
    const BLUE = '14356F'
    const LIGHT_BLUE = '1E4A8F'
    const WHITE = 'FFFFFF'
    const GRAY_BG = 'F0F4FA'
    const BORDER_COLOR = 'B0C4DE'

    const thinBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: BORDER_COLOR } }
    const allBorders: Partial<ExcelJS.Borders> = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }

    // --- Column widths ---
    const colWidths = [18, 18, 18, 14, 22, 28, 15, 15, 18, 15]
    colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w })

    // --- Header band (rows 1-4) with blue background ---
    for (let r = 1; r <= 4; r++) {
      const row = ws.getRow(r)
      row.height = r === 1 ? 10 : r === 2 ? 28 : r === 3 ? 20 : 10
      for (let c = 1; c <= 10; c++) {
        const cell = row.getCell(c)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } }
      }
    }

    // Logo (on blue background - white logo looks great)
    if (logoId !== undefined) {
      ws.addImage(logoId, {
        tl: { col: 0.2, row: 0.3 },
        ext: { width: 140, height: 50 },
      })
    }

    // Title text
    ws.mergeCells('C2:J2')
    const titleCell = ws.getCell('C2')
    titleCell.value = 'PLANTILLA DE IMPORTACIÓN DE ESTUDIANTES'
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: WHITE } }
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } }

    // Subtitle
    ws.mergeCells('C3:J3')
    const subtitleCell = ws.getCell('C3')
    subtitleCell.value = 'Universidad San Andrés de Guanajuato — Sistema de Control Académico Integral'
    subtitleCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'B0C4DE' } }
    subtitleCell.alignment = { horizontal: 'left', vertical: 'middle' }
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE } }

    // --- Row 5: spacer ---
    ws.getRow(5).height = 6

    // --- Row 6: Instructions ---
    ws.mergeCells('A6:J6')
    const instrCell = ws.getCell('A6')
    instrCell.value = 'Instrucciones: Llena los datos a partir de la fila 9. Los campos marcados con (*) son obligatorios. El género acepta M/F. La matrícula se genera automáticamente si se deja vacío.'
    instrCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: '555555' } }
    instrCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
    instrCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8E1' } }
    instrCell.border = allBorders
    ws.getRow(6).height = 30

    // --- Row 7: spacer ---
    ws.getRow(7).height = 6

    // --- Row 8: Column headers ---
    const headerLabels = [
      'Nombre *', 'Apellido Paterno *', 'Apellido Materno',
      'Género (M/F)', 'CURP', 'Correo Electrónico',
      'Teléfono', 'Celular', 'Fecha de Nacimiento', 'Matrícula',
    ]
    const headerRow = ws.getRow(8)
    headerRow.height = 28
    headerLabels.forEach((label, i) => {
      const cell = headerRow.getCell(i + 1)
      cell.value = label
      const isRequired = label.includes('*')
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: WHITE } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isRequired ? BLUE : LIGHT_BLUE } }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.border = allBorders
    })

    // --- Example rows (9-10) ---
    const examples = [
      ['Juan', 'Pérez', 'López', 'M', 'PELJ900101HDFRPN01', 'juan.perez@email.com', '5551234567', '5559876543', '1990-01-15', ''],
      ['María', 'García', 'Ruiz', 'F', 'GARM850220MDFRRC02', 'maria.garcia@email.com', '', '5558765432', '1985-02-20', ''],
    ]
    examples.forEach((rowData, rowIdx) => {
      const row = ws.getRow(9 + rowIdx)
      row.height = 22
      rowData.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 1)
        cell.value = val
        cell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '888888' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowIdx % 2 === 0 ? GRAY_BG : WHITE } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = allBorders
      })
    })

    // --- Empty rows (11-30) with alternating stripes and borders ---
    for (let r = 11; r <= 30; r++) {
      const row = ws.getRow(r)
      row.height = 22
      for (let c = 1; c <= 10; c++) {
        const cell = row.getCell(c)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: (r % 2 === 1) ? GRAY_BG : WHITE } }
        cell.border = allBorders
        cell.font = { name: 'Calibri', size: 10 }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
    }

    // --- Footer ---
    ws.mergeCells('A32:J32')
    const footerCell = ws.getCell('A32')
    footerCell.value = 'Elimina las filas de ejemplo antes de importar. Puedes agregar más filas si es necesario.'
    footerCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: BLUE } }
    footerCell.alignment = { horizontal: 'center', vertical: 'middle' }

    // --- Print setup ---
    ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }

    // --- Generate file ---
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, 'plantilla_importar_estudiantes.xlsx')
    toast.success('Plantilla descargada')
  }

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      processFile(droppedFile)
    }
  }, [])

  const processFile = async (selectedFile: File) => {
    setLoading(true)

    try {
      const jsonData = await readExcelAsObjects(selectedFile)

      if (jsonData.length === 0) {
        toast.error('El archivo no contiene datos')
        return
      }

      const mapped: EstudianteParaInscribir[] = []
      let fila = 1

      for (const row of jsonData) {
        const keys = Object.keys(row)

        const getValue = (possibleNames: string[]): string => {
          for (const name of possibleNames) {
            const key = keys.find(k => k.toLowerCase().replace(/[_\s]/g, '') === name.toLowerCase().replace(/[_\s]/g, ''))
            if (key && row[key] !== undefined && row[key] !== null) {
              return String(row[key]).trim()
            }
          }
          return ''
        }

        const nombre = getValue(['nombre', 'nombres', 'name'])
        const apellidoPaterno = getValue(['apellidopaterno', 'paterno', 'apellido_paterno', 'apellido1'])
        const apellidoMaterno = getValue(['apellidomaterno', 'materno', 'apellido_materno', 'apellido2'])
        const generoTexto = getValue(['genero', 'sexo', 'gender', 'sex'])
        const curp = getValue(['curp'])
        const correo = getValue(['correo', 'email', 'correoelectronico', 'mail'])
        const telefono = getValue(['telefono', 'tel', 'phone'])
        const celular = getValue(['celular', 'movil', 'cel', 'mobile'])
        const fechaNacimiento = getValue(['fechanacimiento', 'fecha_nacimiento', 'nacimiento', 'birthdate'])
        const matricula = getValue(['matricula', 'matricula', 'enrollment'])

        const idGenero = mapearGenero(generoTexto)

        if (!nombre || !apellidoPaterno) {
          console.warn(`Fila ${fila + 1} ignorada: falta nombre o apellido paterno`)
          fila++
          continue
        }

        mapped.push({
          fila: fila++,
          nombre,
          apellidoPaterno,
          apellidoMaterno: apellidoMaterno || undefined,
          idGenero,
          curp: curp || undefined,
          correo: correo || undefined,
          telefono: telefono || undefined,
          celular: celular || undefined,
          fechaNacimiento: fechaNacimiento || undefined,
          matricula: matricula || undefined,
          seleccionado: true,
        })
      }

      if (mapped.length === 0) {
        toast.error('No se encontraron estudiantes válidos. Verifica que tengas las columnas Nombre y ApellidoPaterno.')
        return
      }

      setEstudiantes(mapped)
      toast.success(`Se cargaron ${mapped.length} estudiantes`)
    } catch (error) {
      console.error('Error al procesar archivo:', error)
      toast.error('Error al procesar el archivo Excel')
    } finally {
      setLoading(false)
    }
  }

  const toggleSeleccion = (index: number) => {
    setEstudiantes(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], seleccionado: !updated[index].seleccionado }
      return updated
    })
  }

  const toggleTodos = (seleccionar: boolean) => {
    setEstudiantes(prev => prev.map(e => ({ ...e, seleccionado: seleccionar })))
  }

  const handleImportar = async () => {
    const seleccionados = estudiantes.filter(e => e.seleccionado)

    if (seleccionados.length === 0) {
      toast.error('Selecciona al menos un estudiante')
      return
    }

    setLoading(true)

    try {
      const estudiantesParaImportar: EstudianteImportar[] = seleccionados.map(e => ({
        nombre: e.nombre,
        apellidoPaterno: e.apellidoPaterno,
        apellidoMaterno: e.apellidoMaterno,
        idGenero: e.idGenero,
        curp: e.curp,
        correo: e.correo,
        telefono: e.telefono,
        celular: e.celular,
        fechaNacimiento: e.fechaNacimiento,
        matricula: e.matricula,
      }))

      const result = await importarEstudiantesCompleto(
        parseInt(selectedGrupo),
        estudiantesParaImportar,
        'Importación masiva desde Excel'
      )

      setResultado(result)
      setStep('results')

      if (result.fallidos === 0) {
        toast.success(`Se importaron ${result.exitosos} estudiantes exitosamente`)
      } else {
        toast.warning(
          `Importación completada: ${result.exitosos} exitosos, ${result.fallidos} fallidos`
        )
      }
    } catch (error) {
      console.error('Error al importar:', error)
      toast.error('Error al importar los estudiantes')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep('select-group')
    setEstudiantes([])
    setResultado(null)
    setSelectedGrupo('')
  }

  const estudiantesFiltrados = estudiantes.filter(e =>
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.apellidoPaterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.curp && e.curp.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (e.correo && e.correo.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const seleccionadosCount = estudiantes.filter(e => e.seleccionado).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <div
              className="rounded-lg p-2"
              style={{ background: 'linear-gradient(to bottom right, rgba(20, 53, 111, 0.1), rgba(30, 74, 143, 0.1))' }}
            >
              <UserPlus className="h-8 w-8" style={{ color: '#14356F' }} />
            </div>
            Importar Estudiantes a Grupo
          </h1>
          <p className="mt-1 text-muted-foreground">
            Importa estudiantes nuevos desde Excel: crea persona, estudiante y los inscribe al grupo
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        {['select-group', 'load-students', 'confirm', 'results'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                ['select-group', 'load-students', 'confirm', 'results'].indexOf(step) > i
                  ? 'bg-green-500 text-white'
                  : step !== s
                    ? 'bg-muted text-muted-foreground'
                    : ''
              }`}
              style={step === s ? { background: 'linear-gradient(to right, #14356F, #1e4a8f)', color: 'white' } : undefined}
            >
              {['select-group', 'load-students', 'confirm', 'results'].indexOf(step) > i ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 3 && <div className="mx-2 h-0.5 w-12 bg-muted" />}
          </div>
        ))}
      </div>
      {step === 'select-group' && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="text-white pb-6" style={{ background: 'linear-gradient(135deg, #14356F 0%, #1e4a8f 50%, #2563eb 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Paso 1: Seleccionar Grupo</CardTitle>
                <CardDescription className="text-white/80 mt-0.5">
                  Selecciona el grupo donde inscribiras a los estudiantes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Campus</Label>
                <Select value={selectedCampus} onValueChange={setSelectedCampus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los campus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los campus</SelectItem>
                    {campuses.map((campus) => (
                      <SelectItem key={campus.idCampus} value={campus.idCampus.toString()}>
                        {campus.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Plan de Estudios</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger className="truncate">
                    <SelectValue placeholder="Selecciona un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planesFiltrados.map((plan) => (
                      <SelectItem key={plan.idPlanEstudios} value={plan.idPlanEstudios.toString()}>
                        {plan.nombrePlanEstudios}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Periodo Académico</Label>
                <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((periodo) => (
                      <SelectItem key={periodo.idPeriodoAcademico} value={periodo.idPeriodoAcademico.toString()}>
                        {periodo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Grupo</Label>
                <Select value={selectedGrupo} onValueChange={setSelectedGrupo} disabled={!selectedPlan || !selectedPeriodo}>
                  <SelectTrigger>
                    <SelectValue placeholder={grupos.length === 0 ? 'No hay grupos' : 'Selecciona un grupo'} />
                  </SelectTrigger>
                  <SelectContent>
                    {grupos.map((grupo) => (
                      <SelectItem key={grupo.idGrupo} value={grupo.idGrupo.toString()}>
                        {grupo.nombreGrupo} {grupo.codigoGrupo && `(${grupo.codigoGrupo})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {grupoInfo && (
              <div className="rounded-xl border-2 p-4" style={{ borderColor: 'rgba(20, 53, 111, 0.2)', background: 'linear-gradient(135deg, rgba(20, 53, 111, 0.03), rgba(37, 99, 235, 0.05))' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4" style={{ color: '#14356F' }} />
                  <h4 className="font-semibold text-sm" style={{ color: '#14356F' }}>Informacion del Grupo</h4>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg bg-white p-3 shadow-sm border">
                    <span className="text-xs text-gray-500 block">Grupo</span>
                    <strong className="text-sm" style={{ color: '#14356F' }}>{grupoInfo.nombreGrupo}</strong>
                  </div>
                  <div className="rounded-lg bg-white p-3 shadow-sm border">
                    <span className="text-xs text-gray-500 block">Plan</span>
                    <strong className="text-sm">{grupoInfo.planEstudios}</strong>
                  </div>
                  <div className="rounded-lg bg-white p-3 shadow-sm border">
                    <span className="text-xs text-gray-500 block">Inscritos</span>
                    <strong className="text-sm" style={{ color: '#14356F' }}>{grupoInfo.totalEstudiantes}</strong>
                  </div>
                  <div className="rounded-lg bg-white p-3 shadow-sm border">
                    <span className="text-xs text-gray-500 block">Cupo disponible</span>
                    <strong className="text-sm text-green-600">{grupoInfo.cupoDisponible}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setStep('load-students')}
                disabled={!selectedGrupo}
                className="text-white"
                style={selectedGrupo ? { background: 'linear-gradient(to right, #14356F, #1e4a8f)' } : undefined}
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {step === 'load-students' && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="text-white pb-6" style={{ background: 'linear-gradient(135deg, #14356F 0%, #1e4a8f 50%, #2563eb 100%)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  <FileSpreadsheet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Paso 2: Cargar Estudiantes</CardTitle>
                  <CardDescription className="text-white/80 mt-0.5">
                    Carga un archivo Excel con los datos de los estudiantes a importar
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar Plantilla
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="rounded-xl border-2 p-4" style={{ borderColor: 'rgba(20, 53, 111, 0.15)', background: 'linear-gradient(135deg, rgba(20, 53, 111, 0.03), rgba(37, 99, 235, 0.03))' }}>
              <div className="flex items-center gap-2 mb-3">
                <FileSpreadsheet className="h-4 w-4" style={{ color: '#14356F' }} />
                <h4 className="font-semibold text-sm" style={{ color: '#14356F' }}>Columnas del Excel</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="text-white text-xs px-2.5 py-1" style={{ backgroundColor: '#14356F' }}>Nombre *</Badge>
                <Badge className="text-white text-xs px-2.5 py-1" style={{ backgroundColor: '#14356F' }}>ApellidoPaterno *</Badge>
                <Badge variant="outline" className="text-xs px-2.5 py-1" style={{ borderColor: 'rgba(20, 53, 111, 0.3)', color: '#14356F' }}>ApellidoMaterno</Badge>
                <Badge variant="outline" className="text-xs px-2.5 py-1" style={{ borderColor: 'rgba(20, 53, 111, 0.3)', color: '#14356F' }}>Genero (M/F)</Badge>
                <Badge variant="outline" className="text-xs px-2.5 py-1" style={{ borderColor: 'rgba(20, 53, 111, 0.3)', color: '#14356F' }}>CURP</Badge>
                <Badge variant="outline" className="text-xs px-2.5 py-1" style={{ borderColor: 'rgba(20, 53, 111, 0.3)', color: '#14356F' }}>Correo</Badge>
                <Badge variant="outline" className="text-xs px-2.5 py-1" style={{ borderColor: 'rgba(20, 53, 111, 0.3)', color: '#14356F' }}>Telefono</Badge>
                <Badge variant="outline" className="text-xs px-2.5 py-1" style={{ borderColor: 'rgba(20, 53, 111, 0.3)', color: '#14356F' }}>Celular</Badge>
                <Badge variant="outline" className="text-xs px-2.5 py-1" style={{ borderColor: 'rgba(20, 53, 111, 0.3)', color: '#14356F' }}>FechaNacimiento</Badge>
                <Badge variant="outline" className="text-xs px-2.5 py-1" style={{ borderColor: 'rgba(20, 53, 111, 0.3)', color: '#14356F' }}>Matricula</Badge>
              </div>
              <p className="mt-3 text-xs text-gray-500">* Campos requeridos. Genero: M=Masculino, F=Femenino. La matricula se genera automaticamente si no se proporciona.</p>
            </div>

            {estudiantes.length === 0 ? (
              <div
                className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-300"
                style={{ borderColor: 'rgba(20, 53, 111, 0.25)', background: 'rgba(20, 53, 111, 0.02)' }}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('file-input')?.click()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(20, 53, 111, 0.5)'
                  e.currentTarget.style.background = 'rgba(20, 53, 111, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(20, 53, 111, 0.25)'
                  e.currentTarget.style.background = 'rgba(20, 53, 111, 0.02)'
                }}
              >
                {loading ? (
                  <Loader2 className="h-14 w-14 animate-spin" style={{ color: '#14356F' }} />
                ) : (
                  <>
                    <div className="rounded-2xl p-4 mb-4 transition-transform duration-300 group-hover:scale-110" style={{ background: 'linear-gradient(135deg, rgba(20, 53, 111, 0.1), rgba(37, 99, 235, 0.1))' }}>
                      <Upload className="h-10 w-10" style={{ color: '#14356F' }} />
                    </div>
                    <p className="mb-1 text-lg font-semibold" style={{ color: '#14356F' }}>Arrastra tu archivo Excel aqui</p>
                    <p className="text-sm text-gray-500">o haz clic para seleccionar un archivo .xlsx</p>
                  </>
                )}
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <Badge className="text-white px-3 py-1" style={{ backgroundColor: '#14356F' }}>
                      <Users className="mr-1.5 h-3.5 w-3.5" />
                      {estudiantes.length} cargados
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1" style={{ borderColor: 'rgba(20, 53, 111, 0.3)', color: '#14356F' }}>
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      {seleccionadosCount} seleccionados
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleTodos(true)} className="text-xs">
                      Seleccionar todos
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleTodos(false)} className="text-xs">
                      Deseleccionar todos
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEstudiantes([])} className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                      <X className="mr-1 h-3.5 w-3.5" />
                      Limpiar
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre, CURP o correo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-[400px] overflow-auto rounded-lg border shadow-sm">
                  <Table>
                    <TableHeader className="sticky top-0" style={{ backgroundColor: '#14356F' }}>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12 text-white"></TableHead>
                        <TableHead className="text-white font-semibold">Nombre</TableHead>
                        <TableHead className="text-white font-semibold">Apellidos</TableHead>
                        <TableHead className="text-white font-semibold">CURP</TableHead>
                        <TableHead className="text-white font-semibold">Correo</TableHead>
                        <TableHead className="text-white font-semibold">Telefono</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estudiantesFiltrados.map((est, i) => (
                        <TableRow
                          key={i}
                          className={`transition-colors ${est.seleccionado ? '' : 'opacity-60'}`}
                          style={est.seleccionado ? { backgroundColor: 'rgba(20, 53, 111, 0.04)' } : undefined}
                        >
                          <TableCell>
                            <Checkbox
                              checked={est.seleccionado}
                              onCheckedChange={() => toggleSeleccion(estudiantes.indexOf(est))}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{est.nombre}</TableCell>
                          <TableCell>{est.apellidoPaterno} {est.apellidoMaterno}</TableCell>
                          <TableCell className="font-mono text-xs">{est.curp || '-'}</TableCell>
                          <TableCell className="text-xs">{est.correo || '-'}</TableCell>
                          <TableCell className="text-xs">{est.celular || est.telefono || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('select-group')}>
                Volver
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={seleccionadosCount === 0}
                className="text-white"
                style={{ background: seleccionadosCount > 0 ? 'linear-gradient(to right, #14356F, #1e4a8f)' : undefined }}
              >
                Continuar ({seleccionadosCount} seleccionados)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'confirm' && grupoInfo && (
        <div className="space-y-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="text-white pb-6" style={{ background: 'linear-gradient(135deg, #14356F 0%, #1e4a8f 50%, #2563eb 100%)' }}>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Paso 3: Confirmar Importacion</CardTitle>
                  <CardDescription className="text-white/80 mt-0.5">
                    Revisa los datos antes de importar
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border-2 p-4" style={{ borderColor: 'rgba(20, 53, 111, 0.2)', background: 'linear-gradient(135deg, rgba(20, 53, 111, 0.03), rgba(37, 99, 235, 0.05))' }}>
                  <p className="text-xs text-gray-500 mb-1">Grupo destino</p>
                  <p className="text-lg font-bold" style={{ color: '#14356F' }}>{grupoInfo.nombreGrupo}</p>
                  <p className="text-sm text-gray-600 mt-1">{grupoInfo.planEstudios}</p>
                  <p className="text-sm text-gray-500">{grupoInfo.periodoAcademico}</p>
                </div>

                <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
                  <p className="text-xs text-gray-500 mb-1">Estudiantes a importar</p>
                  <p className="text-3xl font-bold text-green-600">{seleccionadosCount}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Se generaran matriculas automaticamente
                  </p>
                </div>
              </div>

              {seleccionadosCount > grupoInfo.cupoDisponible && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Advertencia</AlertTitle>
                  <AlertDescription>
                    El numero de estudiantes ({seleccionadosCount}) excede el cupo disponible ({grupoInfo.cupoDisponible}).
                    Algunos estudiantes podrian no inscribirse.
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded-xl border-2 p-4" style={{ borderColor: 'rgba(20, 53, 111, 0.15)', background: 'rgba(20, 53, 111, 0.02)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4" style={{ color: '#14356F' }} />
                  <h4 className="font-semibold text-sm" style={{ color: '#14356F' }}>Lo que se creara</h4>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#14356F' }}></span>
                    Registros de <strong>Persona</strong> (datos personales)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#14356F' }}></span>
                    Registros de <strong>Estudiante</strong> (con matricula generada automaticamente)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#14356F' }}></span>
                    Inscripciones al <strong>Grupo</strong> seleccionado
                  </li>
                </ul>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep('load-students')}>
                  Volver
                </Button>
                <Button
                  onClick={handleImportar}
                  disabled={loading}
                  className="text-white"
                  style={{ background: 'linear-gradient(to right, #14356F, #1e4a8f)' }}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Importar {seleccionadosCount} Estudiantes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'results' && resultado && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="h-1" style={{ background: 'linear-gradient(to right, #14356F, #1e4a8f)' }}></div>
              <CardHeader className="pb-2">
                <CardDescription>Grupo</CardDescription>
                <CardTitle className="text-lg" style={{ color: '#14356F' }}>{resultado.nombreGrupo}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md overflow-hidden">
              <div className="h-1 bg-gray-400"></div>
              <CardHeader className="pb-2">
                <CardDescription>Procesados</CardDescription>
                <CardTitle>{resultado.totalProcesados}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md overflow-hidden border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="h-1 bg-green-500"></div>
              <CardHeader className="pb-2">
                <CardDescription>Exitosos</CardDescription>
                <CardTitle className="text-green-600">{resultado.exitosos}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md overflow-hidden border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
              <div className="h-1 bg-red-500"></div>
              <CardHeader className="pb-2">
                <CardDescription>Fallidos</CardDescription>
                <CardTitle className="text-red-600">{resultado.fallidos}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md overflow-hidden" style={{ background: 'linear-gradient(to bottom right, rgba(20, 53, 111, 0.05), rgba(37, 99, 235, 0.05))' }}>
              <div className="h-1" style={{ background: 'linear-gradient(to right, #14356F, #2563eb)' }}></div>
              <CardHeader className="pb-2">
                <CardDescription>Matriculas generadas</CardDescription>
                <CardTitle style={{ color: '#14356F' }}>{resultado.estudiantesCreados}</CardTitle>
              </CardHeader>
            </Card>
          </div>
          {resultado.fallidos === 0 ? (
            <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Importacion Exitosa</AlertTitle>
              <AlertDescription>
                Todos los estudiantes fueron importados e inscritos correctamente.
                Se crearon {resultado.personasCreadas} personas, {resultado.estudiantesCreados} estudiantes y {resultado.inscripcionesCreadas} inscripciones.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Importacion con Errores</AlertTitle>
              <AlertDescription>
                Algunos estudiantes no pudieron ser importados. Revisa el detalle abajo.
              </AlertDescription>
            </Alert>
          )}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="text-white" style={{ background: 'linear-gradient(135deg, #14356F 0%, #1e4a8f 50%, #2563eb 100%)' }}>
              <CardTitle className="text-white">Detalle de Importacion</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs defaultValue={resultado.fallidos > 0 ? 'errores' : 'todos'}>
                <TabsList className="mb-4">
                  <TabsTrigger value="errores">
                    Con Errores ({resultado.fallidos})
                  </TabsTrigger>
                  <TabsTrigger value="exitosos">
                    Exitosos ({resultado.exitosos})
                  </TabsTrigger>
                  <TabsTrigger value="todos">
                    Todos ({resultado.totalProcesados})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="errores">
                  <div className="max-h-[300px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fila</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>CURP</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultado.resultados
                          .filter((r) => !r.exitoso)
                          .map((res, i) => (
                            <TableRow key={i}>
                              <TableCell>{res.fila}</TableCell>
                              <TableCell>{res.nombreCompleto}</TableCell>
                              <TableCell className="font-mono text-xs">{res.curp || '-'}</TableCell>
                              <TableCell className="text-red-600">{res.mensajeError}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="exitosos">
                  <div className="max-h-[300px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fila</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Matrícula</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultado.resultados
                          .filter((r) => r.exitoso)
                          .map((res, i) => (
                            <TableRow key={i}>
                              <TableCell>{res.fila}</TableCell>
                              <TableCell>{res.nombreCompleto}</TableCell>
                              <TableCell className="font-mono font-medium text-blue-600">
                                {res.matriculaGenerada || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className="bg-green-100 text-green-800">
                                  <Check className="mr-1 h-3 w-3" />
                                  Importado
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="todos">
                  <div className="max-h-[300px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fila</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Matrícula</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultado.resultados.map((res, i) => (
                          <TableRow key={i}>
                            <TableCell>{res.fila}</TableCell>
                            <TableCell>{res.nombreCompleto}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {res.matriculaGenerada || '-'}
                            </TableCell>
                            <TableCell>
                              {res.exitoso ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <Check className="mr-1 h-3 w-3" />
                                  Importado
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <X className="mr-1 h-3 w-3" />
                                  Error
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              onClick={handleReset}
              className="text-white"
              style={{ background: 'linear-gradient(to right, #14356F, #1e4a8f)' }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Nueva Importacion
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
