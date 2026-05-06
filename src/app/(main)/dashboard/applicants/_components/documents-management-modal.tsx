"use client";

import { useEffect, useState } from "react";

import { CheckCircle, ClipboardCheck, XCircle, Calendar, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getApplicantDocuments,
  getDocumentRequirements,
} from "@/services/applicants-service";
import apiClient from "@/services/api-client";
import documentacionAspirantesService from "@/services/documentacion-aspirantes-service";
import {
  AspiranteDocumentoDto,
  DocumentoRequisitoDto,
  EstatusDocumentoEnum,
  Applicant,
} from "@/types/applicant";

interface DocumentsManagementModalProps {
  open: boolean;
  applicant: Applicant | null;
  onClose: () => void;
}

export function DocumentsManagementModal({ open, applicant, onClose }: DocumentsManagementModalProps) {
  const [requirements, setRequirements] = useState<DocumentoRequisitoDto[]>([]);
  const [documents, setDocuments] = useState<AspiranteDocumentoDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [showProrrogaDialog, setShowProrrogaDialog] = useState(false);
  const [prorrogaDocId, setProrrogaDocId] = useState<number | null>(null);
  const [prorrogaGlobal, setProrrogaGlobal] = useState(false);
  const [fechaProrroga, setFechaProrroga] = useState("");
  const [motivoProrroga, setMotivoProrroga] = useState("");
  const [savingProrroga, setSavingProrroga] = useState(false);

  useEffect(() => {
    if (open && applicant) loadDocuments();
  }, [open, applicant]);

  const loadDocuments = async () => {
    if (!applicant) return;
    setLoading(true);
    try {
      const docs = await getApplicantDocuments(applicant.idAspirante);
      setDocuments(docs);
      const docReqIds = new Set(docs.map(d => d.idDocumentoRequisito));
      const allReqs = await getDocumentRequirements();
      setRequirements(allReqs.filter(r => docReqIds.has(r.idDocumentoRequisito)));
    } catch {
      toast.error("Error al cargar documentos");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (doc: AspiranteDocumentoDto | undefined) => {
    if (!doc) return;
    try {
      const { data } = await apiClient.put<{ estatus: string; recibido: boolean }>(
        `/aspirante/documentos/${doc.idAspiranteDocumento}/toggle-recibido`
      );
      setDocuments(prev => prev.map(d =>
        d.idAspiranteDocumento === doc.idAspiranteDocumento
          ? { ...d, estatus: data.recibido ? EstatusDocumentoEnum.VALIDADO : EstatusDocumentoEnum.PENDIENTE }
          : d
      ));
      toast.success(data.recibido ? "Documento marcado como recibido" : "Documento desmarcado");
    } catch {
      toast.error("Error al actualizar documento");
    }
  };

  const openProrrogaDialog = (docId: number | null, isGlobal: boolean) => {
    setProrrogaDocId(docId);
    setProrrogaGlobal(isGlobal);
    setFechaProrroga("");
    setMotivoProrroga("");
    setShowProrrogaDialog(true);
  };

  const handleAsignarProrroga = async () => {
    if (!fechaProrroga) {
      toast.error("Selecciona una fecha de prórroga");
      return;
    }
    setSavingProrroga(true);
    try {
      if (prorrogaGlobal && applicant) {
        await documentacionAspirantesService.asignarProrrogaGlobal({
          idAspirante: applicant.idAspirante,
          fechaProrroga,
          motivo: motivoProrroga || undefined,
        });
      } else if (prorrogaDocId) {
        await documentacionAspirantesService.asignarProrroga({
          idAspiranteDocumento: prorrogaDocId,
          fechaProrroga,
          motivo: motivoProrroga || undefined,
        });
      }
      toast.success("Prórroga asignada");
      setShowProrrogaDialog(false);
      await loadDocuments();
    } catch {
      toast.error("Error al asignar prórroga");
    } finally {
      setSavingProrroga(false);
    }
  };

  const getDoc = (reqId: number) => documents.find(d => d.idDocumentoRequisito === reqId);

  const ahora = new Date();
  const prorrogaVigente = (d?: AspiranteDocumentoDto) =>
    !!d?.fechaProrroga && new Date(d.fechaProrroga) > ahora && d.estatus !== EstatusDocumentoEnum.VALIDADO;
  const prorrogaVencida = (d?: AspiranteDocumentoDto) =>
    !!d?.fechaProrroga && new Date(d.fechaProrroga) <= ahora && d.estatus !== EstatusDocumentoEnum.VALIDADO;

  const totalRecibidos = requirements.filter(r => {
    const doc = getDoc(r.idDocumentoRequisito);
    return doc?.estatus === EstatusDocumentoEnum.VALIDADO;
  }).length;

  const totalProrrogaVigente = requirements.filter(r => prorrogaVigente(getDoc(r.idDocumentoRequisito))).length;
  const totalProrrogaVencida = requirements.filter(r => prorrogaVencida(getDoc(r.idDocumentoRequisito))).length;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="sm:max-w-[75vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Documentos - {applicant?.nombreCompleto}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                {totalRecibidos}/{requirements.length} recibidos
              </Badge>
              {totalProrrogaVigente > 0 && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                  {totalProrrogaVigente} con prórroga vigente
                </Badge>
              )}
              {totalProrrogaVencida > 0 && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                  {totalProrrogaVencida} con prórroga VENCIDA
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end mb-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openProrrogaDialog(null, true)}
              className="gap-1 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Calendar className="w-3 h-3" />
              Prórroga global
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : (
            <div className="space-y-2">
              {requirements.map((req) => {
                const doc = getDoc(req.idDocumentoRequisito);
                const isRecibido = doc?.estatus === EstatusDocumentoEnum.VALIDADO;
                const vigente = prorrogaVigente(doc);
                const vencida = prorrogaVencida(doc);

                return (
                  <div
                    key={req.idDocumentoRequisito}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                      isRecibido
                        ? "border-green-200 bg-green-50"
                        : vencida
                          ? "border-red-200 bg-red-50"
                          : vigente
                            ? "border-amber-200 bg-amber-50"
                            : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isRecibido ? (
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      ) : vencida ? (
                        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                      ) : vigente ? (
                        <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-300 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="font-medium text-sm">{req.descripcion}</span>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{req.clave}</span>
                          {req.esObligatorio && (
                            <Badge variant="outline" className="text-[9px] border-orange-300 text-orange-600 px-1 py-0">
                              Obligatorio
                            </Badge>
                          )}
                          {vigente && doc?.fechaProrroga && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                              Vence: {new Date(doc.fechaProrroga).toLocaleDateString("es-MX")}
                            </span>
                          )}
                          {vencida && doc?.fechaProrroga && (
                            <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-semibold">
                              VENCIÓ: {new Date(doc.fechaProrroga).toLocaleDateString("es-MX")}
                            </span>
                          )}
                          {doc?.motivoProrroga && (
                            <span className="text-[10px] text-gray-500 italic">({doc.motivoProrroga})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {!isRecibido && doc && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openProrrogaDialog(doc.idAspiranteDocumento, false)}
                          className="text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                        >
                          <Calendar className="w-3 h-3" />
                          Prórroga
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={isRecibido ? "default" : "outline"}
                        className={`gap-1 text-xs ${isRecibido ? "bg-green-600 hover:bg-green-700" : ""}`}
                        onClick={() => handleToggle(doc)}
                        disabled={!doc}
                      >
                        {isRecibido ? "✓ Recibido" : "Marcar"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showProrrogaDialog} onOpenChange={setShowProrrogaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {prorrogaGlobal ? "Prórroga global" : "Asignar prórroga"}
            </DialogTitle>
            <DialogDescription>
              {prorrogaGlobal
                ? "Se aplicará a todos los documentos pendientes del aspirante."
                : "Se aplicará solo al documento seleccionado."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Fecha límite</Label>
              <Input
                type="date"
                value={fechaProrroga}
                onChange={(e) => setFechaProrroga(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Motivo (opcional)</Label>
              <Textarea
                value={motivoProrroga}
                onChange={(e) => setMotivoProrroga(e.target.value)}
                placeholder="Ej: Pendiente de apostilla, documento en trámite…"
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProrrogaDialog(false)} disabled={savingProrroga}>
              Cancelar
            </Button>
            <Button onClick={handleAsignarProrroga} disabled={savingProrroga}>
              {savingProrroga ? "Guardando..." : "Asignar prórroga"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
