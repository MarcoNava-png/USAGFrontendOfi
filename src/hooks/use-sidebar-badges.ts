'use client'

import { useCallback, useEffect, useState } from 'react'

import documentosSolicitudesService from '@/services/documentos-solicitudes-service'
import documentacionAspirantesService from '@/services/documentacion-aspirantes-service'
import apiClient from '@/services/api-client'

export interface SidebarBadges {
  solicitudesDocumentos: number
  solicitudesBaja: number
  prorrogasVencidas: number
}

export function useSidebarBadges() {
  const [badges, setBadges] = useState<SidebarBadges>({
    solicitudesDocumentos: 0,
    solicitudesBaja: 0,
    prorrogasVencidas: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchBadges = useCallback(async () => {
    let storedUser: { role?: string } = {}
    try { storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {} } catch { storedUser = {} }
    const skipRoles = ['superadmin', 'docente', 'alumno']
    if (storedUser.role && skipRoles.includes(storedUser.role)) {
      setLoading(false)
      return
    }

    try {
      const [contadorSolicitudes, contadorBajas, resumenDocs] = await Promise.all([
        documentosSolicitudesService.getContadorPendientes().catch(() => 0),
        apiClient.get<{ pendientes: number }>('/solicitudes-baja/pendientes/count').then(r => r.data.pendientes).catch(() => 0),
        documentacionAspirantesService.getResumenDocumentacion({ estatus: 'PRORROGA_VENCIDA' }).catch(() => []),
      ])
      setBadges((prev) => ({
        ...prev,
        solicitudesDocumentos: contadorSolicitudes,
        solicitudesBaja: contadorBajas,
        prorrogasVencidas: resumenDocs.length,
      }))
    } catch (error) {
      console.error('Error fetching sidebar badges:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBadges()

    const interval = setInterval(fetchBadges, 60000)

    return () => clearInterval(interval)
  }, [fetchBadges])

  return { badges, loading, refetch: fetchBadges }
}
