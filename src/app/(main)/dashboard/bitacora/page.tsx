'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ScrollText,
  Search,
  User,
  X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { getBitacora } from '@/services/bitacora-service'
import { MODULOS_BITACORA, MODULO_COLORS, type BitacoraAccion, type BitacoraFiltros } from '@/types/bitacora'

function formatDate(dateStr: string): string {
  const utcStr = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  const d = new Date(utcStr)
  return d.toLocaleDateString('es-MX', {
    timeZone: 'America/Mexico_City',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const ACCION_LABELS: Record<string, string> = {
  CREAR_SOLICITUD: 'Crear solicitud',
  CANCELAR_SOLICITUD: 'Cancelar solicitud',
  REGISTRAR_PAGO: 'Registrar pago',
  VALIDAR_DOCUMENTO: 'Validar documento',
  RECHAZAR_DOCUMENTO: 'Rechazar documento',
  CREAR: 'Crear',
  ACTUALIZAR: 'Actualizar',
  ELIMINAR: 'Eliminar',
  CONSULTAR: 'Consultar',
}

function formatAccion(accion: string): string {
  return ACCION_LABELS[accion] ?? accion.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
}

export default function BitacoraPage() {
  const [items, setItems] = useState<BitacoraAccion[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [filtros, setFiltros] = useState<BitacoraFiltros>({
    page: 1,
    pageSize: 20,
  })

  const [busqueda, setBusqueda] = useState('')
  const [modulo, setModulo] = useState('todos')
  const [usuario, setUsuario] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getBitacora(filtros)
      setItems(result.items)
      setTotalItems(result.totalItems)
      setTotalPages(result.totalPages)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [filtros])

  useEffect(() => {
    cargar()
  }, [cargar])

  const aplicarFiltros = () => {
    setFiltros({
      ...filtros,
      modulo: modulo !== 'todos' ? modulo : undefined,
      usuario: usuario || undefined,
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined,
      busqueda: busqueda || undefined,
      page: 1,
    })
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setModulo('todos')
    setUsuario('')
    setFechaDesde('')
    setFechaHasta('')
    setFiltros({ page: 1, pageSize: 20 })
  }

  const tieneFilros = modulo !== 'todos' || usuario || fechaDesde || fechaHasta || busqueda

  const irPagina = (p: number) => {
    setFiltros({ ...filtros, page: p })
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <ScrollText className="h-6 w-6" />
          Bitacora de Acciones
        </h1>
        <p className="text-muted-foreground text-sm">
          Registro de todas las acciones realizadas por los usuarios en el sistema
        </p>
      </div>

      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <label className="text-xs font-medium">Modulo</label>
              <Select value={modulo} onValueChange={(v) => setModulo(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {MODULOS_BITACORA.map((m) => (
                    <SelectItem key={m.value || 'todos'} value={m.value || 'todos'}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Usuario</label>
              <div className="relative">
                <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Nombre de usuario..."
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Desde</label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-8"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Hasta</label>
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-8"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Busqueda general</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
                />
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={aplicarFiltros}>
              <Search className="mr-1 h-3.5 w-3.5" />
              Buscar
            </Button>
            {tieneFilros && (
              <Button size="sm" variant="ghost" onClick={limpiarFiltros}>
                <X className="mr-1 h-3.5 w-3.5" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Registros</CardTitle>
              <CardDescription>{totalItems} registros encontrados</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ScrollText className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm font-medium">No se encontraron registros</p>
              <p className="text-xs mt-1">Las acciones de los usuarios se registran automaticamente</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px] text-xs">Fecha</TableHead>
                      <TableHead className="text-xs">Usuario</TableHead>
                      <TableHead className="text-xs">Modulo</TableHead>
                      <TableHead className="text-xs">Accion</TableHead>
                      <TableHead className="text-xs">Entidad</TableHead>
                      <TableHead className="max-w-[250px] text-xs">Descripcion</TableHead>
                      <TableHead className="w-[90px] text-xs">IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.idBitacora}>
                        <TableCell className="py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(item.fechaUtc)}
                        </TableCell>
                        <TableCell className="py-2 text-xs sm:text-sm font-medium">{item.nombreUsuario}</TableCell>
                        <TableCell className="py-2">
                          <Badge
                            variant="secondary"
                            className={MODULO_COLORS[item.modulo] ?? 'bg-gray-100 text-gray-800'}
                          >
                            {item.modulo}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 text-xs sm:text-sm">
                          {formatAccion(item.accion)}
                        </TableCell>
                        <TableCell className="py-2 text-xs sm:text-sm">
                          {item.entidad}
                          {item.entidadId && (
                            <span className="text-muted-foreground ml-1">#{item.entidadId}</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 max-w-[250px] truncate text-xs sm:text-sm text-muted-foreground">
                          {item.descripcion}
                        </TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground font-mono">
                          {item.ipAddress}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Pagina {filtros.page} de {totalPages} ({totalItems} registros)
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={(filtros.page ?? 1) <= 1}
                      onClick={() => irPagina((filtros.page ?? 1) - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={(filtros.page ?? 1) >= totalPages}
                      onClick={() => irPagina((filtros.page ?? 1) + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
