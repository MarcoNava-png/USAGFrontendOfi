"use client";

import { useEffect, useState } from "react";

import { GraduationCap, AlertCircle, CheckCircle, FileText, DollarSign, Clock, Printer, BookOpen, Mail, IdCard, Users, Download, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { enrollApplicantAsStudent, getApplicantAdmissionSheet, downloadApplicantEnrollmentSheet, getApplicantInscripcionPrevia, downloadEnrollmentReceipt } from "@/services/applicants-service";
import {
  Applicant,
  FichaAdmisionDto,
  InscribirAspiranteRequest,
  InscripcionAspiranteResultDto,
  InscripcionPreviaAspiranteDto,
  EstatusDocumentoEnum,
} from "@/types/applicant";

interface EnrollStudentModalProps {
  open: boolean;
  applicant: Applicant | null;
  onClose: () => void;
  onEnrollmentSuccess: () => void;
}

export function EnrollStudentModal({ open, applicant, onClose, onEnrollmentSuccess }: EnrollStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [fichaAdmision, setFichaAdmision] = useState<FichaAdmisionDto | null>(null);
  const [previa, setPrevia] = useState<InscripcionPreviaAspiranteDto | null>(null);

  const [idGrupo, setIdGrupo] = useState<string>("");
  const [forzarInscripcion, setForzarInscripcion] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [crearCorreoAzure, setCrearCorreoAzure] = useState(true);

  const [canEnroll, setCanEnroll] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [resultado, setResultado] = useState<InscripcionAspiranteResultDto | null>(null);

  useEffect(() => {
    if (open && applicant) {
      loadData();
    } else {
      resetForm();
    }
  }, [open, applicant]);

  const loadData = async () => {
    if (!applicant) return;

    setLoading(true);
    try {
      const [fichaData, previaData] = await Promise.all([
        getApplicantAdmissionSheet(applicant.idAspirante),
        getApplicantInscripcionPrevia(applicant.idAspirante),
      ]);

      setFichaAdmision(fichaData);
      setPrevia(previaData);

      validateRequirements(fichaData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar los datos del aspirante");
    } finally {
      setLoading(false);
    }
  };

  const validateRequirements = (ficha: FichaAdmisionDto) => {
    const errors: string[] = [];

    const documentosObligatorios = ficha.documentos.filter((d) => d.esObligatorio);
    const cumple = (d: typeof documentosObligatorios[number]) =>
      d.estatus === EstatusDocumentoEnum.VALIDADO || d.tieneProrrogaVigente === true;
    const documentosPendientes = documentosObligatorios.filter((d) => !cumple(d));

    if (documentosPendientes.length > 0) {
      errors.push(
        `Documentos pendientes (sin prórroga vigente): ${documentosPendientes.map((d) => d.descripcion).join(", ")}`,
      );
    }

    const saldoPendiente = ficha.informacionPagos.saldoPendiente;
    if (saldoPendiente > 0) {
      errors.push(`Tiene un saldo pendiente de ${formatCurrency(saldoPendiente)}`);
    }

    const estatusValidos = ["EN PROCESO", "PAGO COMPLETO", "PAGADO", "ACEPTADO"];
    const estatusActual = ficha.estatusActual.toUpperCase();
    if (!estatusValidos.some((e) => estatusActual.includes(e))) {
      errors.push(`El estatus actual "${ficha.estatusActual}" no es válido para inscripción`);
    }

    setValidationErrors(errors);
    setCanEnroll(errors.length === 0);
  };

  const resetForm = () => {
    setIdGrupo("");
    setForzarInscripcion(false);
    setObservaciones("");
    setCrearCorreoAzure(true);
    setFichaAdmision(null);
    setPrevia(null);
    setValidationErrors([]);
    setCanEnroll(false);
    setResultado(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!applicant) return;

    if (!canEnroll && !forzarInscripcion) {
      toast.error("No se cumplen los requisitos para inscribir. Active 'Forzar inscripción' si desea continuar.");
      return;
    }

    setSubmitting(true);
    try {
      const request: InscribirAspiranteRequest = {
        idPeriodoAcademico: previa?.idPeriodoAcademico ?? null,
        idGrupo: idGrupo ? parseInt(idGrupo) : null,
        forzarInscripcion,
        observaciones: observaciones || null,
        crearCorreoAzure,
      };

      const result: InscripcionAspiranteResultDto = await enrollApplicantAsStudent(
        applicant.idAspirante,
        request,
      );

      setResultado(result);
      onEnrollmentSuccess();
    } catch (error: unknown) {
      console.error("Error al inscribir:", error);
      const err = error as { response?: { data?: { mensaje?: string } }; message?: string };
      const errorMessage = err?.response?.data?.mensaje ?? err?.message ?? "Error al inscribir el aspirante";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDescargarComprobante = async () => {
    if (!resultado) return;
    try {
      await downloadEnrollmentReceipt(resultado.idEstudiante, resultado.credenciales.passwordTemporal);
      toast.success("Comprobante descargado");
    } catch {
      toast.error("Error al descargar comprobante");
    }
  };

  const handleCopiarCredenciales = () => {
    if (!resultado) return;
    const texto = `Matrícula: ${resultado.matricula}\nUsuario: ${resultado.credenciales.usuario}\nContraseña temporal: ${resultado.credenciales.passwordTemporal}`;
    navigator.clipboard.writeText(texto);
    toast.success("Credenciales copiadas");
  };

  const handleCerrarPostInscripcion = () => {
    onClose();
    resetForm();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const handleDownloadPdf = async (openInNewTab: boolean = false) => {
    if (!applicant) return;

    setDownloadingPdf(true);
    try {
      await downloadApplicantEnrollmentSheet(applicant.idAspirante, openInNewTab);
      toast.success(openInNewTab ? "PDF abierto en nueva pestaña" : "PDF descargado correctamente");
    } catch (error: unknown) {
      console.error("Error al descargar PDF:", error);
      const err = error as { response?: { data?: { mensaje?: string } }; message?: string };
      const errorMessage = err?.response?.data?.mensaje ?? err?.message ?? "Error al generar el PDF";
      toast.error(errorMessage);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getDocumentStatusIcon = (doc: { estatus: EstatusDocumentoEnum; tieneProrrogaVigente?: boolean; prorrogaVencida?: boolean }) => {
    if (doc.estatus === EstatusDocumentoEnum.VALIDADO)
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (doc.tieneProrrogaVigente) return <Clock className="w-4 h-4 text-amber-600" />;
    if (doc.prorrogaVencida) return <AlertCircle className="w-4 h-4 text-red-600" />;
    if (doc.estatus === EstatusDocumentoEnum.RECHAZADO) return <AlertCircle className="w-4 h-4 text-red-600" />;
    if (doc.estatus === EstatusDocumentoEnum.SUBIDO) return <Clock className="w-4 h-4 text-yellow-600" />;
    return <AlertCircle className="w-4 h-4 text-gray-400" />;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Inscribir Aspirante como Estudiante
          </DialogTitle>
          <DialogDescription>
            Convierta al aspirante {applicant?.nombreCompleto} en estudiante activo del sistema
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Cargando información...</div>
        ) : resultado ? (
          <div className="space-y-5">
            <div className="p-4 rounded-lg bg-emerald-50 border-2 border-emerald-300">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-emerald-900">Inscripción exitosa</h3>
              </div>
              <p className="text-sm text-emerald-800 mb-3">
                El aspirante <strong>{resultado.nombreCompleto}</strong> ahora es estudiante activo.
              </p>
              <div className="bg-white border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Matrícula</span>
                  <code className="font-mono font-bold">{resultado.matricula}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Correo institucional</span>
                  <code className="font-mono text-sm break-all">{resultado.credenciales.usuario}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Contraseña temporal</span>
                  <code className="font-mono font-bold text-red-700">{resultado.credenciales.passwordTemporal}</code>
                </div>
                {resultado.codigoGrupo && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Grupo asignado</span>
                    <span className="font-medium">{resultado.codigoGrupo}{resultado.nombreGrupo ? ` · ${resultado.nombreGrupo}` : ""}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-amber-700 mt-3 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Guarda o descarga estas credenciales ahora. La contraseña no se mostrará de nuevo.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCopiarCredenciales} className="text-xs gap-1">
                <Copy className="w-3 h-3" /> Copiar
              </Button>
              <Button type="button" onClick={handleDescargarComprobante} className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700">
                <Download className="w-3 h-3" /> Descargar comprobante PDF
              </Button>
              <Button type="button" variant="default" onClick={handleCerrarPostInscripcion} className="text-xs">
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              className={`border rounded-lg p-4 ${
                canEnroll ? "bg-green-50 border-green-300" : "bg-orange-50 border-orange-300"
              }`}
            >
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                {canEnroll ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                )}
                Estado de Requisitos
              </h3>

              {fichaAdmision && (
                <div className="space-y-3 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">Documentos ({fichaAdmision.documentos.length})</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {fichaAdmision.documentos
                        .filter((d) => d.esObligatorio)
                        .map((doc, idx) => (
                          <div key={idx} className="flex items-center gap-2 flex-wrap">
                            {getDocumentStatusIcon(doc)}
                            <span
                              className={
                                doc.estatus === EstatusDocumentoEnum.VALIDADO
                                  ? "text-green-700"
                                  : doc.tieneProrrogaVigente
                                    ? "text-amber-700"
                                    : doc.prorrogaVencida
                                      ? "text-red-700"
                                      : ""
                              }
                            >
                              {doc.descripcion}
                            </span>
                            {doc.tieneProrrogaVigente && doc.fechaProrroga && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                Prórroga: {new Date(doc.fechaProrroga).toLocaleDateString("es-MX")}
                              </span>
                            )}
                            {doc.prorrogaVencida && (
                              <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-semibold">
                                PRÓRROGA VENCIDA
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium">Pagos</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      <div className="flex justify-between">
                        <span>Total a pagar:</span>
                        <span className="font-semibold">
                          {formatCurrency(fichaAdmision.informacionPagos.totalAPagar)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total pagado:</span>
                        <span className="font-semibold text-green-700">
                          {formatCurrency(fichaAdmision.informacionPagos.totalPagado)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saldo pendiente:</span>
                        <span
                          className={`font-semibold ${
                            fichaAdmision.informacionPagos.saldoPendiente > 0 ? "text-red-700" : "text-green-700"
                          }`}
                        >
                          {formatCurrency(fichaAdmision.informacionPagos.saldoPendiente)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <span className="font-medium">Estatus actual:</span>
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                      {fichaAdmision.estatusActual}
                    </span>
                  </div>
                  {validationErrors.length > 0 && (
                    <div className="pt-2 border-t space-y-1">
                      <p className="font-medium text-orange-800">Advertencias:</p>
                      <ul className="list-disc list-inside space-y-1 text-orange-700">
                        {validationErrors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-sm">Parámetros de Inscripción</h3>

              {fichaAdmision && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-white border rounded-md">
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Plan de Estudios</p>
                      <p className="text-xs font-medium">
                        {fichaAdmision.informacionAcademica.nombrePlan || "No asignado"}
                      </p>
                      {fichaAdmision.informacionAcademica.clavePlan && (
                        <p className="text-[10px] text-gray-400">{fichaAdmision.informacionAcademica.clavePlan}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <GraduationCap className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Modalidad</p>
                      <p className="text-xs font-medium">
                        {fichaAdmision.informacionAcademica.modalidad || "No especificada"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Turno</p>
                      <p className="text-xs font-medium">
                        {fichaAdmision.informacionAcademica.turno || "No especificado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Dias</p>
                      <p className="text-xs font-medium">
                        {fichaAdmision.informacionAcademica.dias || "No especificados"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {previa && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <IdCard className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-[10px] text-emerald-700 uppercase">Matrícula proyectada</p>
                        <p className="text-sm font-bold font-mono">{previa.matriculaProyectada}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-[10px] text-emerald-700 uppercase">Correo proyectado</p>
                        <p className="text-xs font-medium break-all">{previa.correoProyectado}</p>
                      </div>
                    </div>
                    {previa.nombrePeriodoAcademico && (
                      <div className="flex items-start gap-2 md:col-span-2">
                        <Clock className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-[10px] text-emerald-700 uppercase">Periodo Académico (del aspirante)</p>
                          <p className="text-xs font-medium">{previa.nombrePeriodoAcademico}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="idGrupo" className="text-xs flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Grupo (opcional - lo puedes asignar después)
                  </Label>
                  <Select value={idGrupo} onValueChange={setIdGrupo}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder={previa && previa.gruposDisponibles.length === 0 ? "No hay grupos disponibles" : "Seleccione un grupo"} />
                    </SelectTrigger>
                    <SelectContent>
                      {previa?.gruposDisponibles.map((g) => (
                        <SelectItem
                          key={g.idGrupo}
                          value={g.idGrupo.toString()}
                          disabled={!g.tieneCupo}
                        >
                          {g.codigoGrupo || g.nombreGrupo} · Cuatri {g.numeroCuatrimestre}
                          {g.turno ? ` · ${g.turno}` : ""}
                          {` · ${g.ocupados}/${g.capacidadMaxima}`}
                          {!g.tieneCupo ? " · SIN CUPO" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Si asigna grupo, el alumno quedará inscrito automáticamente a todas las materias de ese grupo.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones" className="text-xs">
                    Observaciones
                  </Label>
                  <Textarea
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas adicionales sobre la inscripción..."
                    rows={3}
                    className="text-xs"
                  />
                </div>

                {!canEnroll && (
                  <div className="flex items-start gap-2 p-3 bg-orange-100 border border-orange-300 rounded">
                    <Checkbox
                      id="forzar"
                      checked={forzarInscripcion}
                      onCheckedChange={(checked) => setForzarInscripcion(checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="forzar" className="text-xs font-semibold cursor-pointer">
                        Forzar inscripción (Omitir validaciones)
                      </Label>
                      <p className="text-[10px] text-orange-700">
                        Active esta opción solo si está seguro de inscribir al aspirante sin cumplir todos los
                        requisitos. Esta acción quedará registrada en el sistema.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-indigo-50 border-indigo-200 space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-sm text-indigo-900">Correo Microsoft 365</h3>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="crearCorreoAzure"
                  checked={crearCorreoAzure}
                  onCheckedChange={(checked) => setCrearCorreoAzure(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label htmlFor="crearCorreoAzure" className="text-xs font-semibold cursor-pointer">
                    Crear correo institucional en Microsoft 365
                  </Label>
                  <p className="text-[10px] text-indigo-700">
                    Se creara automaticamente el correo [matricula]@usaguanajuato.edu.mx en Azure AD con la matricula como contrasena temporal
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm text-blue-900">¿Qué sucederá al inscribir?</h4>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Se generará una matrícula automáticamente según el programa de estudios</li>
                <li>Se creará el registro del estudiante en el sistema</li>
                <li>Se crearán credenciales de acceso (usuario y contraseña temporal)</li>
                {crearCorreoAzure && <li>Se creara el correo institucional en Microsoft 365 / Azure AD</li>}
                <li>El estatus del aspirante cambiará a &quot;INSCRITO&quot;</li>
                <li>Se registrará la acción en la bitácora de seguimiento</li>
              </ul>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDownloadPdf(true)}
                disabled={downloadingPdf || loading}
                className="text-xs gap-2"
              >
                <Printer className="w-4 h-4" />
                {downloadingPdf ? "Generando..." : "Imprimir Hoja de Inscripción"}
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="text-xs">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || (!canEnroll && !forzarInscripcion)}
                  className="text-xs"
                >
                  {submitting ? "Procesando..." : "Inscribir como Estudiante"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
