'use client'

import { useEffect, useState } from 'react'

import Image from 'next/image'
import { useParams } from 'next/navigation'

import {
  Calendar,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  User,
  XCircle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { VerificacionDocumento } from '@/types/documentos-estudiante'

const NAVY = '#14356F'

function Header() {
  return (
    <header
      className="px-6 py-8 text-center text-white"
      style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1e4a8f 100%)` }}
    >
      <div className="mb-4 flex justify-center">
        <Image src="/Logousag.png" alt="Universidad San Andrés de Guanajuato" width={200} height={103} priority />
      </div>
      <h1 className="text-xl font-bold tracking-tight md:text-2xl">Verificación de Documentos</h1>
      <p className="mt-1 text-sm opacity-90 md:text-base">Universidad San Andrés de Guanajuato</p>
    </header>
  )
}

function Footer() {
  return (
    <footer className="px-4 py-6 text-center text-xs text-gray-500">
      <p>Universidad San Andrés de Guanajuato (USAG)</p>
      <p className="mt-1">© 2026 · Sistema de Verificación de Documentos</p>
    </footer>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <Header />
          <div className="p-6 md:p-8">{children}</div>
        </div>
        <Footer />
      </div>
    </div>
  )
}

export default function VerificarDocumentoPage() {
  const params = useParams()
  const codigo = params.codigo as string

  const [verificacion, setVerificacion] = useState<VerificacionDocumento | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (codigo) {
      verificarDocumento()
    }
  }, [codigo])

  const verificarDocumento = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api'}/documentoestudiante/verificar/${codigo}`
      )

      if (!response.ok) {
        throw new Error('Error al verificar el documento')
      }

      const data = await response.json()
      setVerificacion(data)
    } catch (err) {
      console.error('Error:', err)
      setError('No se pudo verificar el documento. Por favor, intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="mb-4 h-12 w-12 animate-spin" style={{ color: NAVY }} />
          <p className="text-lg text-muted-foreground">Verificando documento...</p>
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-red-600">Error de verificación</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      </Shell>
    )
  }

  if (!verificacion) {
    return null
  }

  const isValid = verificacion.esValido

  return (
    <Shell>
      <div className="flex flex-col items-center text-center">
        <div
          className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
            isValid ? 'bg-green-100' : 'bg-red-100'
          }`}
        >
          {isValid ? (
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          ) : (
            <XCircle className="h-12 w-12 text-red-600" />
          )}
        </div>

        <h2 className={`text-2xl font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
          {isValid ? 'Documento Válido' : 'Documento No Válido'}
        </h2>

        <p className="mt-1 text-base text-muted-foreground">
          {isValid
            ? 'Documento auténtico emitido por la Universidad San Andrés de Guanajuato.'
            : verificacion.mensaje}
        </p>
      </div>

      {isValid && (
        <div className="mt-6 space-y-4">
          {verificacion.tipoDocumento && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
              <FileText className="h-5 w-5" style={{ color: NAVY }} />
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Documento</p>
                <p className="font-medium">{verificacion.tipoDocumento}</p>
              </div>
            </div>
          )}

          {verificacion.nombreEstudiante && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
              <User className="h-5 w-5" style={{ color: NAVY }} />
              <div>
                <p className="text-sm text-muted-foreground">Estudiante</p>
                <p className="font-medium">{verificacion.nombreEstudiante}</p>
                {verificacion.matricula && (
                  <p className="font-mono text-sm text-muted-foreground">Matrícula: {verificacion.matricula}</p>
                )}
              </div>
            </div>
          )}

          {verificacion.carrera && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
              <GraduationCap className="h-5 w-5" style={{ color: NAVY }} />
              <div>
                <p className="text-sm text-muted-foreground">Carrera</p>
                <p className="font-medium">{verificacion.carrera}</p>
              </div>
            </div>
          )}

          {verificacion.fechaEmision && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
              <Calendar className="h-5 w-5" style={{ color: NAVY }} />
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Emisión</p>
                <p className="font-medium">{new Date(verificacion.fechaEmision).toLocaleDateString('es-MX')}</p>
              </div>
            </div>
          )}

          {verificacion.folioDocumento && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
              <span className="text-sm text-muted-foreground">Folio</span>
              <Badge variant="outline" className="font-mono">
                {verificacion.folioDocumento}
              </Badge>
            </div>
          )}

          <div className="mt-4 flex items-center justify-center">
            <Badge className="bg-green-600 px-4 py-2 text-sm hover:bg-green-700">Vigente</Badge>
          </div>
        </div>
      )}
    </Shell>
  )
}
