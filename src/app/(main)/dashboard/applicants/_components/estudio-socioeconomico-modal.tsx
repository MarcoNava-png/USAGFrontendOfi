"use client";

import { useCallback, useEffect, useState } from "react";

import { Check, Copy, HeartHandshake, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  generarTokenEstudio,
  getAnalistas,
  getCatalogosEstudio,
  getEstudioPorAspirante,
  guardarEstudioAspirante,
} from "@/services/estudio-socioeconomico-service";
import { Applicant } from "@/types/applicant";
import {
  Analista,
  CatalogosEstudio,
  EstudioSocioeconomico,
  EstudioSocioeconomicoRequest,
} from "@/types/estudio-socioeconomico";

import { EstudioSocioeconomicoForm } from "./estudio-socioeconomico-form";

interface Props {
  open: boolean;
  applicant: Applicant | null;
  onClose: () => void;
}

export function EstudioSocioeconomicoModal({ open, applicant, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [catalogos, setCatalogos] = useState<CatalogosEstudio | null>(null);
  const [analistas, setAnalistas] = useState<Analista[]>([]);
  const [estudio, setEstudio] = useState<EstudioSocioeconomico | null>(null);

  const cargar = useCallback(async () => {
    if (!applicant) return;
    setLoading(true);
    try {
      const [cat, ana, est] = await Promise.all([
        getCatalogosEstudio(),
        getAnalistas(),
        getEstudioPorAspirante(applicant.idAspirante),
      ]);
      setCatalogos(cat);
      setAnalistas(ana);
      setEstudio(est);
      setLinkUrl(null);
      setCopiado(false);
    } catch {
      toast.error("Error al cargar el estudio socioeconómico");
    } finally {
      setLoading(false);
    }
  }, [applicant]);

  useEffect(() => {
    if (open && applicant) cargar();
  }, [open, applicant, cargar]);

  const handleSubmit = async (req: EstudioSocioeconomicoRequest) => {
    if (!applicant) return;
    setSubmitting(true);
    try {
      const guardado = await guardarEstudioAspirante(applicant.idAspirante, req);
      setEstudio(guardado);
      toast.success("Estudio socioeconómico guardado");
    } catch {
      toast.error("Error al guardar el estudio");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerarLink = async () => {
    if (!applicant) return;
    setGenerando(true);
    try {
      const { url } = await generarTokenEstudio(applicant.idAspirante);
      setLinkUrl(url);
      setCopiado(false);
      try {
        await navigator.clipboard.writeText(url);
        setCopiado(true);
      } catch {
        // el usuario puede copiarlo manualmente desde el cuadro
      }
    } catch {
      toast.error("Error al generar el enlace");
    } finally {
      setGenerando(false);
    }
  };

  const handleCopiar = async () => {
    if (!linkUrl) return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopiado(true);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar; selecciona el texto y cópialo manualmente");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5" style={{ color: "#14356F" }} />
            Estudio Socioeconómico
          </DialogTitle>
          <DialogDescription>
            {applicant?.nombreCompleto}
            {estudio?.fechaLlenado
              ? ` · Última actualización: ${new Date(estudio.fechaLlenado).toLocaleDateString("es-MX")}${
                  estudio.llenadoPorAspirante ? " (llenado por el aspirante)" : ""
                }`
              : " · Sin estudio registrado"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleGenerarLink} disabled={generando}>
            {generando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
            Generar link para el aspirante
          </Button>
        </div>

        {linkUrl && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
            <p className="text-sm font-medium text-blue-900">
              Comparte este enlace con el aspirante para que llene su estudio:
            </p>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={linkUrl}
                onFocus={(e) => e.target.select()}
                className="bg-white font-mono text-xs"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCopiar}
                style={{ backgroundColor: copiado ? "#16a34a" : "#14356F" }}
                className="shrink-0"
              >
                {copiado ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copiado ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </div>
        )}

        {loading || !catalogos ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Cargando...
          </div>
        ) : (
          <EstudioSocioeconomicoForm
            catalogos={catalogos}
            initial={estudio}
            analistas={analistas}
            showAnalista
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
