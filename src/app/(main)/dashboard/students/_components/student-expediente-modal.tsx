"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AlertTriangle, CheckCircle, Clock, Download, FolderOpen, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AspiranteDocumentoDto,
  getStudentExpediente,
  uploadStudentExpedienteFile,
} from "@/services/students-service";

interface StudentExpedienteModalProps {
  open: boolean;
  onClose: () => void;
  studentId: number;
  studentName: string;
}

const ESTATUS_VALIDADO = 2;

export function StudentExpedienteModal({ open, onClose, studentId, studentName }: StudentExpedienteModalProps) {
  const [docs, setDocs] = useState<AspiranteDocumentoDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStudentExpediente(studentId);
      setDocs(data);
    } catch {
      toast.error("Error al cargar el expediente");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (open) cargar();
  }, [open, cargar]);

  const handleFile = async (doc: AspiranteDocumentoDto, file: File) => {
    const tipos = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!tipos.includes(file.type)) {
      toast.error("Solo se permiten archivos PDF, JPG o PNG");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo supera 5 MB");
      return;
    }
    setUploadingId(doc.idAspiranteDocumento);
    try {
      await uploadStudentExpedienteFile(studentId, doc.idDocumentoRequisito, file);
      toast.success("Escaneo cargado");
      await cargar();
    } catch {
      toast.error("Error al subir el archivo");
    } finally {
      setUploadingId(null);
    }
  };

  const ahora = new Date();
  const prorrogaVigente = (d: AspiranteDocumentoDto) =>
    !!d.fechaProrroga && new Date(d.fechaProrroga) > ahora && d.estatus !== ESTATUS_VALIDADO;
  const prorrogaVencida = (d: AspiranteDocumentoDto) =>
    !!d.fechaProrroga && new Date(d.fechaProrroga) <= ahora && d.estatus !== ESTATUS_VALIDADO;

  const totalRecibidos = docs.filter((d) => d.estatus === ESTATUS_VALIDADO).length;
  const totalConArchivo = docs.filter((d) => !!d.urlArchivo).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[75vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Expediente Digital — {studentName}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              {totalRecibidos}/{docs.length} recibidos
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              {totalConArchivo} con escaneo
            </Badge>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : docs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Sin documentos registrados</div>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => {
              const isRecibido = d.estatus === ESTATUS_VALIDADO;
              const vigente = prorrogaVigente(d);
              const vencida = prorrogaVencida(d);

              return (
                <div
                  key={d.idAspiranteDocumento}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                    isRecibido
                      ? "border-green-200 bg-green-50"
                      : vencida
                        ? "border-red-200 bg-red-50"
                        : vigente
                          ? "border-amber-200 bg-amber-50"
                          : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
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
                      <p className="font-medium text-sm">{d.descripcion}</p>
                      <div className="flex flex-wrap gap-2 mt-0.5 text-xs">
                        <span className="text-gray-400">{d.clave}</span>
                        {vigente && d.fechaProrroga && (
                          <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px]">
                            Prórroga vigente: {new Date(d.fechaProrroga).toLocaleDateString("es-MX")}
                          </span>
                        )}
                        {vencida && d.fechaProrroga && (
                          <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            Prórroga vencida: {new Date(d.fechaProrroga).toLocaleDateString("es-MX")}
                          </span>
                        )}
                        {d.urlArchivo && (
                          <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px]">
                            Escaneo cargado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {d.urlArchivo && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1"
                        onClick={() => window.open(d.urlArchivo!, "_blank")}
                      >
                        <Download className="h-3 w-3" />
                        Ver
                      </Button>
                    )}
                    <input
                      ref={(el) => {
                        fileInputs.current[d.idAspiranteDocumento] = el;
                      }}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(d, file);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      size="sm"
                      variant={d.urlArchivo ? "outline" : "default"}
                      disabled={uploadingId === d.idAspiranteDocumento}
                      className="text-xs gap-1"
                      onClick={() => fileInputs.current[d.idAspiranteDocumento]?.click()}
                    >
                      <Upload className="h-3 w-3" />
                      {uploadingId === d.idAspiranteDocumento
                        ? "Subiendo..."
                        : d.urlArchivo
                          ? "Reemplazar"
                          : "Subir escaneo"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
