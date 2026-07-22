export interface TenantBranding {
  codigo: string
  nombre: string
  nombreCorto: string
  logoUrl?: string | null
  colorPrimario: string
  colorSecundario?: string | null
  incluyeReportes?: boolean
  incluyeApi?: boolean
  incluyeFacturacion?: boolean
  incluyeSoporte?: boolean
}

const DEFAULT_BRANDING: TenantBranding = {
  codigo: '',
  nombre: 'SACI',
  nombreCorto: 'SACI',
  logoUrl: null,
  colorPrimario: '#14356F',
  colorSecundario: null,
  incluyeReportes: true,
  incluyeApi: true,
  incluyeFacturacion: true,
  incluyeSoporte: true,
}

let cached: TenantBranding | null = null

export async function getBranding(): Promise<TenantBranding> {
  if (cached) return cached

  try {
    const res = await fetch('/api/branding/current', { cache: 'no-store' })
    if (!res.ok) return DEFAULT_BRANDING

    const data = await res.json()
    cached = {
      codigo: data.codigo ?? '',
      nombre: data.nombre ?? 'SACI',
      nombreCorto: data.nombreCorto ?? data.nombre ?? 'SACI',
      logoUrl: data.logoUrl ?? null,
      colorPrimario: data.colorPrimario ?? '#14356F',
      colorSecundario: data.colorSecundario ?? null,
    }
    return cached
  } catch {
    return DEFAULT_BRANDING
  }
}

export function clearBrandingCache() {
  cached = null
}
