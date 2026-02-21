"use client";

import { useEffect, useState } from "react";

import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getDocumentosPlan,
  actualizarDocumentosPlan,
  getDocumentosRequisitoDisponibles,
} from "@/services/study-plans-service";
import { StudyPlan, DocumentoRequisitoDisponible } from "@/types/study-plan";

interface PlanDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: StudyPlan | null;
}

interface DocumentoConfig {
  idDocumentoRequisito: number;
  selected: boolean;
  esObligatorio: boolean;
}

export function PlanDocumentsDialog({ open, onOpenChange, plan }: PlanDocumentsDialogProps) {
  const [disponibles, setDisponibles] = useState<DocumentoRequisitoDisponible[]>([]);
  const [config, setConfig] = useState<DocumentoConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && plan) {
      loadData();
    }
  }, [open, plan]);

  const loadData = async () => {
    if (!plan) return;
    setLoading(true);
    try {
      const [allDocs, planDocs] = await Promise.all([
        getDocumentosRequisitoDisponibles(),
        getDocumentosPlan(plan.idPlanEstudios),
      ]);

      setDisponibles(allDocs.filter((d) => d.activo));

      const planDocMap = new Map(
        planDocs.map((pd) => [pd.idDocumentoRequisito, pd])
      );

      setConfig(
        allDocs
          .filter((d) => d.activo)
          .map((d) => ({
            idDocumentoRequisito: d.idDocumentoRequisito,
            selected: planDocMap.has(d.idDocumentoRequisito),
            esObligatorio: planDocMap.get(d.idDocumentoRequisito)?.esObligatorio ?? d.esObligatorio,
          }))
      );
    } catch {
      toast.error("Error al cargar los documentos");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelected = (idDoc: number) => {
    setConfig((prev) =>
      prev.map((c) =>
        c.idDocumentoRequisito === idDoc ? { ...c, selected: !c.selected } : c
      )
    );
  };

  const toggleObligatorio = (idDoc: number) => {
    setConfig((prev) =>
      prev.map((c) =>
        c.idDocumentoRequisito === idDoc ? { ...c, esObligatorio: !c.esObligatorio } : c
      )
    );
  };

  const handleSave = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const documentos = config
        .filter((c) => c.selected)
        .map((c) => ({
          idDocumentoRequisito: c.idDocumentoRequisito,
          esObligatorio: c.esObligatorio,
        }));

      await actualizarDocumentosPlan(plan.idPlanEstudios, documentos);
      toast.success("Documentos del plan actualizados correctamente");
      onOpenChange(false);
    } catch {
      toast.error("Error al guardar los documentos");
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = config.filter((c) => c.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Requeridos
          </DialogTitle>
          <DialogDescription>
            Configura los documentos que se solicitarán a los aspirantes del plan{" "}
            <strong>{plan?.nombrePlanEstudios}</strong>.
            {selectedCount === 0 && (
              <span className="block mt-1 text-amber-600">
                Sin documentos configurados, se solicitarán todos los documentos activos (comportamiento por defecto).
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Cargando documentos...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground pb-2 border-b">
              <span>{selectedCount} documento(s) seleccionado(s)</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setConfig((prev) => prev.map((c) => ({ ...c, selected: true })))
                  }
                >
                  Seleccionar todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setConfig((prev) => prev.map((c) => ({ ...c, selected: false })))
                  }
                >
                  Deseleccionar todos
                </Button>
              </div>
            </div>

            {disponibles.map((doc) => {
              const docConfig = config.find(
                (c) => c.idDocumentoRequisito === doc.idDocumentoRequisito
              );
              if (!docConfig) return null;

              return (
                <div
                  key={doc.idDocumentoRequisito}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                    docConfig.selected
                      ? "border-blue-200 bg-blue-50/50"
                      : "border-gray-200 bg-gray-50/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={docConfig.selected}
                      onCheckedChange={() => toggleSelected(doc.idDocumentoRequisito)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{doc.descripcion}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {doc.clave}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {docConfig.selected && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`obligatorio-${doc.idDocumentoRequisito}`}
                        checked={docConfig.esObligatorio}
                        onCheckedChange={() => toggleObligatorio(doc.idDocumentoRequisito)}
                      />
                      <Label
                        htmlFor={`obligatorio-${doc.idDocumentoRequisito}`}
                        className="text-xs cursor-pointer"
                      >
                        Obligatorio
                      </Label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
