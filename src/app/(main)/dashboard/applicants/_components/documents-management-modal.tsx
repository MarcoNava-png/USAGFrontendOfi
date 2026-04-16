"use client";

import { useEffect, useState } from "react";

import { CheckCircle, ClipboardCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  getApplicantDocuments,
  getDocumentRequirements,
} from "@/services/applicants-service";
import apiClient from "@/services/api-client";
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

  const handleToggle = async (doc: AspiranteDocumentoDto | undefined, reqId: number) => {
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

  const getDoc = (reqId: number) => documents.find(d => d.idDocumentoRequisito === reqId);

  const totalRecibidos = requirements.filter(r => {
    const doc = getDoc(r.idDocumentoRequisito);
    return doc?.estatus === EstatusDocumentoEnum.VALIDADO || doc?.estatus === EstatusDocumentoEnum.SUBIDO;
  }).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[70vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Documentos - {applicant?.nombreCompleto}
          </DialogTitle>
          <DialogDescription>
            {totalRecibidos}/{requirements.length} documentos recibidos
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : (
          <div className="space-y-2">
            {requirements.map((req) => {
              const doc = getDoc(req.idDocumentoRequisito);
              const isRecibido = doc?.estatus === EstatusDocumentoEnum.VALIDADO || doc?.estatus === EstatusDocumentoEnum.SUBIDO;

              return (
                <div
                  key={req.idDocumentoRequisito}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                    isRecibido ? "border-green-200 bg-green-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {isRecibido ? (
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-300 shrink-0" />
                    )}
                    <div>
                      <span className="font-medium text-sm">{req.descripcion}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{req.clave}</span>
                        {req.esObligatorio && (
                          <Badge variant="outline" className="text-[9px] border-orange-300 text-orange-600 px-1 py-0">
                            Obligatorio
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isRecibido ? "default" : "outline"}
                    className={`shrink-0 gap-1 text-xs ${isRecibido ? "bg-green-600 hover:bg-green-700" : ""}`}
                    onClick={() => handleToggle(doc, req.idDocumentoRequisito)}
                    disabled={!doc}
                  >
                    {isRecibido ? "✓ Recibido" : "Marcar"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
