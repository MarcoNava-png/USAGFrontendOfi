"use client";

import { useCallback, useEffect, useState } from "react";

import Image from "next/image";
import { useParams } from "next/navigation";

import { CheckCircle2, Loader2, Lock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { EstudioSocioeconomicoForm } from "@/app/(main)/dashboard/applicants/_components/estudio-socioeconomico-form";
import { getEstudioPublico, guardarEstudioPublico } from "@/services/estudio-socioeconomico-service";
import { EstudioPublico, EstudioSocioeconomicoRequest } from "@/types/estudio-socioeconomico";

const NAVY = "#14356F";

function Header() {
  return (
    <header
      className="px-6 py-8 text-center text-white"
      style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1e4a8f 100%)` }}
    >
      <div className="flex justify-center mb-4">
        <Image src="/Logousag.png" alt="Universidad San Andrés de Guanajuato" width={220} height={113} priority />
      </div>
      <h1 className="text-xl md:text-2xl font-bold tracking-tight">Estudio Socioeconómico de Nuevo Ingreso</h1>
      <p className="text-sm md:text-base opacity-90 mt-1">Universidad San Andrés de Guanajuato</p>
    </header>
  );
}

function Footer() {
  return (
    <footer className="text-center text-xs text-gray-500 py-6 px-4">
      <p>Universidad San Andrés de Guanajuato (USAG)</p>
      <p className="mt-1">© {2026} · Todos los derechos reservados</p>
    </footer>
  );
}

export default function EstudioSocioeconomicoPublicoPage() {
  const params = useParams();
  const token = (params?.token as string) ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [data, setData] = useState<EstudioPublico | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getEstudioPublico(token);
      setData(d);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) cargar();
  }, [token, cargar]);

  const handleSubmit = async (req: EstudioSocioeconomicoRequest) => {
    setSubmitting(true);
    try {
      await guardarEstudioPublico(token, req);
      setEnviado(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Error al enviar el estudio. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <Header />

          <div className="p-6 md:p-8">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Cargando formulario...
              </div>
            ) : error || !data ? (
              <div className="text-center py-16">
                <ShieldAlert className="w-14 h-14 text-amber-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-800">Enlace no válido</p>
                <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  Este enlace no es correcto o ya no está disponible. Por favor solicita uno nuevo a tu campus.
                </p>
              </div>
            ) : enviado ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <p className="text-xl font-bold text-gray-800">¡Gracias! Tu estudio fue enviado.</p>
                <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                  La información se registró correctamente. Ya puedes cerrar esta ventana.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-base font-semibold text-gray-900">{data.aspiranteNombre}</p>
                  <p className="text-sm text-gray-600">{[data.carrera, data.campus].filter(Boolean).join(" · ")}</p>
                  {data.yaEnviado && (
                    <p className="text-amber-700 text-sm mt-2">
                      Ya habías enviado este estudio. Puedes revisarlo y actualizarlo si lo necesitas.
                    </p>
                  )}
                </div>

                <div className="mb-6 flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900">
                  <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    La información que proporciones es <strong>confidencial</strong> y se utilizará únicamente con fines
                    socioeconómicos por parte de la Universidad. Por favor responde con honestidad.
                  </span>
                </div>

                <EstudioSocioeconomicoForm
                  catalogos={data.catalogos}
                  initial={data.estudio}
                  submitting={submitting}
                  submitLabel="Enviar estudio"
                  onSubmit={handleSubmit}
                />
              </>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
