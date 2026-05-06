"use client";

import { useEffect, useState } from "react";

import { User, Mail, Phone, MapPin, GraduationCap, Calendar, Heart, Save, FileWarning, Clock, AlertTriangle, FolderOpen, Download, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { obtenerMiPerfil, actualizarMiPerfil, obtenerMisDocumentosPendientes, obtenerMiExpediente, type AspiranteDocumentoLecturaDto } from "@/services/portal-alumno-service";
import type { MiPerfil, MisDocumentosPendientes } from "@/types/portal-alumno";

export default function MiPerfilPage() {
  const [perfil, setPerfil] = useState<MiPerfil | null>(null);
  const [docsPendientes, setDocsPendientes] = useState<MisDocumentosPendientes | null>(null);
  const [expediente, setExpediente] = useState<AspiranteDocumentoLecturaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [telefono, setTelefono] = useState("");
  const [celular, setCelular] = useState("");
  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoTelefono, setContactoTelefono] = useState("");
  const [contactoParentesco, setContactoParentesco] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setLoading(true);
    try {
      const [data, docs, exp] = await Promise.all([
        obtenerMiPerfil(),
        obtenerMisDocumentosPendientes().catch(() => null),
        obtenerMiExpediente().catch(() => [] as AspiranteDocumentoLecturaDto[]),
      ]);
      setPerfil(data);
      setDocsPendientes(docs);
      setExpediente(exp);
      setTelefono(data.telefono ?? "");
      setCelular(data.celular ?? "");
      setContactoNombre(data.contactoEmergencia?.nombre ?? "");
      setContactoTelefono(data.contactoEmergencia?.telefono ?? "");
      setContactoParentesco(data.contactoEmergencia?.parentesco ?? "");
    } catch {
      toast.error("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  }

  async function handleGuardar() {
    setGuardando(true);
    try {
      await actualizarMiPerfil({
        telefono: telefono || undefined,
        celular: celular || undefined,
        contactoEmergencia: {
          nombre: contactoNombre || undefined,
          telefono: contactoTelefono || undefined,
          parentesco: contactoParentesco || undefined,
        },
      });
      toast.success("Perfil actualizado exitosamente");
      await cargar();
    } catch {
      toast.error("Error al actualizar el perfil");
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!perfil) {
    return <div className="text-center py-12 text-muted-foreground">No se pudo cargar tu perfil</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
            <User className="h-8 w-8 text-blue-700" />
          </div>
          Mi Perfil
        </h1>
        <p className="text-muted-foreground mt-1">Consulta y actualiza tu informacion personal</p>
      </div>

      {docsPendientes && docsPendientes.totalPendientes > 0 && (
        <Card
          className={`border-2 ${
            docsPendientes.conProrrogaVencida > 0
              ? "border-red-300 bg-red-50/50"
              : docsPendientes.conProrrogaVigente > 0
                ? "border-amber-300 bg-amber-50/50"
                : "border-orange-300 bg-orange-50/50"
          }`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {docsPendientes.conProrrogaVencida > 0 ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <FileWarning className="w-5 h-5 text-amber-600" />
              )}
              Documentos pendientes de entrega
              <Badge variant="outline" className="ml-auto">
                {docsPendientes.totalPendientes} pendiente{docsPendientes.totalPendientes !== 1 ? "s" : ""}
              </Badge>
            </CardTitle>
            <CardDescription>
              {docsPendientes.conProrrogaVencida > 0
                ? `Tienes ${docsPendientes.conProrrogaVencida} prórroga(s) vencida(s). Entrégalos cuanto antes.`
                : docsPendientes.conProrrogaVigente > 0
                  ? `Tienes ${docsPendientes.conProrrogaVigente} documento(s) con prórroga vigente.`
                  : "Documentos que debes entregar en Servicios Escolares."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {docsPendientes.documentos.map((d) => (
                <div
                  key={d.idAspiranteDocumento}
                  className={`p-3 rounded-md border flex items-center justify-between gap-3 ${
                    d.prorrogaVencida
                      ? "bg-red-50 border-red-200"
                      : d.tieneProrrogaVigente
                        ? "bg-amber-50 border-amber-200"
                        : "bg-white"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{d.descripcion}</p>
                    <p className="text-xs text-muted-foreground">Clave: {d.clave}</p>
                    {d.motivoProrroga && (
                      <p className="text-xs text-muted-foreground italic mt-1">Motivo: {d.motivoProrroga}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {d.prorrogaVencida ? (
                      <Badge className="bg-red-100 text-red-700 gap-1">
                        <AlertTriangle className="w-3 h-3" /> Prórroga vencida
                      </Badge>
                    ) : d.tieneProrrogaVigente ? (
                      <Badge className="bg-amber-100 text-amber-700 gap-1">
                        <Clock className="w-3 h-3" /> Vence en {d.diasRestantes} día{d.diasRestantes !== 1 ? "s" : ""}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pendiente</Badge>
                    )}
                    {d.fechaProrroga && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(d.fechaProrroga).toLocaleDateString("es-MX")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {expediente.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderOpen className="w-5 h-5" />
              Mi Expediente Digital
              <Badge variant="outline" className="ml-auto">
                {expediente.filter((d) => d.urlArchivo).length}/{expediente.length} escaneados
              </Badge>
            </CardTitle>
            <CardDescription>
              Documentos que has entregado. Los escaneos los sube el área de Admisiones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expediente.map((d) => (
                <div
                  key={d.idAspiranteDocumento}
                  className={`p-3 rounded-md border flex items-center justify-between gap-3 ${
                    d.urlArchivo ? "bg-emerald-50 border-emerald-200" : "bg-white"
                  }`}
                >
                  <div className="min-w-0 flex items-center gap-2">
                    {d.urlArchivo ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{d.descripcion}</p>
                      <p className="text-xs text-muted-foreground">{d.clave}</p>
                    </div>
                  </div>
                  {d.urlArchivo && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1 shrink-0"
                      onClick={() => window.open(d.urlArchivo!, "_blank")}
                    >
                      <Download className="w-3 h-3" /> Ver
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{perfil.nombreCompleto}</CardTitle>
              <CardDescription>Matricula: {perfil.matricula}</CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">Estudiante Activo</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Plan de estudios</Label>
              <p className="font-medium">{perfil.planEstudios ?? "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Campus</Label>
              <p className="font-medium">{perfil.campus ?? "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Fecha de ingreso</Label>
              <p className="font-medium">{perfil.fechaIngreso ? new Date(perfil.fechaIngreso).toLocaleDateString("es-MX") : "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">CURP</Label>
              <p className="font-medium font-mono">{perfil.curp ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" /> Informacion de contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Correo institucional</Label>
              <Input value={perfil.email ?? ""} disabled />
            </div>
            <div>
              <Label>Telefono</Label>
              <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 4771234567" />
            </div>
            <div>
              <Label>Celular</Label>
              <Input value={celular} onChange={(e) => setCelular(e.target.value)} placeholder="Ej: 4771234567" />
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3"><MapPin className="w-4 h-4" /> Direccion</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Calle y numero</Label>
                <p>{perfil.direccion?.calle} {perfil.direccion?.numeroExterior} {perfil.direccion?.numeroInterior ? `Int. ${perfil.direccion.numeroInterior}` : ""}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Colonia</Label>
                <p>{perfil.direccion?.colonia ?? "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Codigo postal</Label>
                <p>{perfil.direccion?.codigoPostal ?? "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Municipio / Estado</Label>
                <p>{perfil.direccion?.municipio} {perfil.direccion?.estado ? `, ${perfil.direccion.estado}` : ""}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3"><Heart className="w-4 h-4" /> Contacto de emergencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input value={contactoNombre} onChange={(e) => setContactoNombre(e.target.value)} />
              </div>
              <div>
                <Label>Telefono</Label>
                <Input value={contactoTelefono} onChange={(e) => setContactoTelefono(e.target.value)} />
              </div>
              <div>
                <Label>Parentesco</Label>
                <Input value={contactoParentesco} onChange={(e) => setContactoParentesco(e.target.value)} placeholder="Madre, padre, hermano..." />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleGuardar} disabled={guardando}>
              <Save className="w-4 h-4 mr-2" />
              {guardando ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
