"use client";

import { useEffect, useState } from "react";

import { Building2, CheckCircle, KeyRound, Loader2, Save, Settings, Shield, Upload, User, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import apiClient from "@/services/api-client";

const BASE = "/titulacion/configuracion";

interface ConfigIPES {
  id: number;
  idNombreInstitucion: string;
  nombreInstitucion: string | null;
  idCampusSEP: string;
  campusSEP: string | null;
  idEntidadFederativa: string;
  entidadFederativa: string | null;
  idCampus: number;
  nombreCampus: string | null;
  activa: boolean;
  responsableActivo: ResponsableFirma | null;
  credencialActiva: CredencialSEP | null;
}

interface ResponsableFirma {
  id: number;
  curp: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string | null;
  idCargo: string;
  cargo: string | null;
  tieneCertificadoCer: boolean;
  tieneLlaveKey: boolean;
  noCertificadoResponsable: string | null;
  activo: boolean;
}

interface CredencialSEP {
  id: number;
  usuario: string;
  tienePassword: boolean;
  endpointUrl: string | null;
  esProduccion: boolean;
  activa: boolean;
}

export default function TitulacionConfiguracionPage() {
  const [config, setConfig] = useState<ConfigIPES | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [ipesForm, setIpesForm] = useState({ idNombreInstitucion: "21171", nombreInstitucion: "COLEGIO DE SAN ANDRÉS DE GUANAJUATO", idCampusSEP: "110486", campusSEP: "León", idEntidadFederativa: "11", entidadFederativa: "GUANAJUATO" });
  const [respForm, setRespForm] = useState({ curp: "", nombre: "", primerApellido: "", segundoApellido: "", idCargo: "", cargo: "", passwordLlavePrivada: "" });
  const [credForm, setCredForm] = useState({ usuario: "", password: "", endpointUrl: "https://metqa.siged.sep.gob.mx/met-ws/services/TitulosElectronicos.wsdl", esProduccion: false });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data } = await apiClient.get<ConfigIPES[]>(`${BASE}`);
      const cfg = data?.[0] || null;
      if (cfg) {
        setConfig(cfg);
        setIpesForm({
          idNombreInstitucion: cfg.idNombreInstitucion || "21171",
          nombreInstitucion: cfg.nombreInstitucion || "COLEGIO DE SAN ANDRÉS DE GUANAJUATO",
          idCampusSEP: cfg.idCampusSEP || "110486",
          campusSEP: cfg.campusSEP || "León",
          idEntidadFederativa: cfg.idEntidadFederativa || "11",
          entidadFederativa: cfg.entidadFederativa || "GUANAJUATO",
        });
        if (cfg.responsableActivo) {
          const r = cfg.responsableActivo;
          setRespForm({ curp: r.curp, nombre: r.nombre, primerApellido: r.primerApellido, segundoApellido: r.segundoApellido || "", idCargo: r.idCargo, cargo: r.cargo || "", passwordLlavePrivada: "" });
        }
        if (cfg.credencialActiva) {
          const c = cfg.credencialActiva;
          setCredForm({ usuario: c.usuario, password: "", endpointUrl: c.endpointUrl || "", esProduccion: c.esProduccion });
        }
      }
    } catch {
      setConfig(null);
    } finally { setLoading(false); }
  };

  const guardarIPES = async () => {
    if (!ipesForm.idNombreInstitucion || !ipesForm.idCampusSEP || !ipesForm.idEntidadFederativa) {
      toast.error("Completa los campos requeridos de la IPES");
      return;
    }
    setSaving(true);
    try {
      const { data } = await apiClient.post<ConfigIPES>(`${BASE}/ipes`, { ...ipesForm, id: config?.id, idCampus: config?.idCampus || 595 });
      setConfig(prev => prev ? { ...prev, ...data } : data);
      toast.success("Datos de la IPES guardados");
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const guardarResponsable = async () => {
    if (!config?.id || !respForm.curp || !respForm.nombre || !respForm.primerApellido || !respForm.idCargo) {
      toast.error("Completa los campos requeridos del responsable");
      return;
    }
    setSaving(true);
    try {
      const { data } = await apiClient.post(`${BASE}/responsable`, { ...respForm, id: config.responsableActivo?.id, idConfiguracionIPES: config.id });
      setConfig(prev => prev ? { ...prev, responsableActivo: data } : prev);
      toast.success("Responsable guardado");
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const guardarCredencial = async () => {
    if (!config?.id || !credForm.usuario) {
      toast.error("Completa el usuario");
      return;
    }
    setSaving(true);
    try {
      const { data } = await apiClient.post(`${BASE}/credencial`, { ...credForm, id: config.credencialActiva?.id, idConfiguracionIPES: config.id });
      setConfig(prev => prev ? { ...prev, credencialActiva: data } : prev);
      toast.success("Credenciales guardadas");
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const subirArchivo = async (tipo: "certificado-cer" | "llave-key") => {
    if (!config?.responsableActivo?.id) { toast.error("Primero guarda el responsable"); return; }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = tipo === "certificado-cer" ? ".cer" : ".key";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("archivo", file);
      try {
        await apiClient.post(`${BASE}/responsable/${config.responsableActivo!.id}/${tipo}`, formData);
        toast.success(`Archivo ${tipo === "certificado-cer" ? ".cer" : ".key"} subido`);
        loadConfig();
      } catch { toast.error("Error al subir archivo"); }
    };
    input.click();
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Cargando...</div>;

  const resp = config?.responsableActivo;
  const cred = config?.credencialActiva;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: "linear-gradient(to bottom right, rgba(20, 53, 111, 0.1), rgba(30, 74, 143, 0.1))" }}>
            <Settings className="h-8 w-8" style={{ color: "#14356F" }} />
          </div>
          Configuración SEP - Titulación
        </h1>
        <p className="text-muted-foreground mt-1">Configura los datos de la IPES, responsable y credenciales para la generación de certificados electrónicos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className={`border-2 ${config ? "border-green-200 bg-green-50/50" : "border-gray-200"}`}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">{config ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-400" />} Datos IPES</CardDescription>
            <CardTitle className="text-lg">{config ? "Configurada" : "Pendiente"}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={`border-2 ${resp ? "border-green-200 bg-green-50/50" : "border-gray-200"}`}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">{resp ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-400" />} Responsable</CardDescription>
            <CardTitle className="text-lg">{resp ? `${resp.nombre} ${resp.primerApellido}` : "Pendiente"}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={`border-2 ${resp?.tieneCertificadoCer && resp?.tieneLlaveKey ? "border-green-200 bg-green-50/50" : "border-gray-200"}`}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><KeyRound className="h-4 w-4" /> Llaves SAT</CardDescription>
            <CardTitle className="text-lg flex gap-2">
              <Badge variant={resp?.tieneCertificadoCer ? "default" : "secondary"}>.cer</Badge>
              <Badge variant={resp?.tieneLlaveKey ? "default" : "secondary"}>.key</Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className={`border-2 ${cred ? "border-green-200 bg-green-50/50" : "border-gray-200"}`}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Shield className="h-4 w-4" /> Credenciales WS</CardDescription>
            <CardTitle className="text-lg">{cred ? cred.usuario : "Pendiente"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Datos de la Institución (IPES)</CardTitle>
          <CardDescription>Datos que identifican a la USAG ante la SEP</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ID Institución (IPES) *</Label>
              <Input value={ipesForm.idNombreInstitucion} onChange={(e) => setIpesForm(f => ({ ...f, idNombreInstitucion: e.target.value }))} placeholder="Ej: 9999" />
            </div>
            <div className="space-y-2">
              <Label>Nombre Institución</Label>
              <Input value={ipesForm.nombreInstitucion} onChange={(e) => setIpesForm(f => ({ ...f, nombreInstitucion: e.target.value }))} placeholder="Universidad San Andrés de Guanajuato" />
            </div>
            <div className="space-y-2">
              <Label>ID Campus SEP *</Label>
              <Input value={ipesForm.idCampusSEP} onChange={(e) => setIpesForm(f => ({ ...f, idCampusSEP: e.target.value }))} placeholder="Ej: 040077" />
            </div>
            <div className="space-y-2">
              <Label>Nombre Campus SEP</Label>
              <Input value={ipesForm.campusSEP} onChange={(e) => setIpesForm(f => ({ ...f, campusSEP: e.target.value }))} placeholder="Nombre del campus ante SEP" />
            </div>
            <div className="space-y-2">
              <Label>ID Entidad Federativa *</Label>
              <Input value={ipesForm.idEntidadFederativa} onChange={(e) => setIpesForm(f => ({ ...f, idEntidadFederativa: e.target.value }))} placeholder="Ej: 11 (Guanajuato)" />
            </div>
            <div className="space-y-2">
              <Label>Entidad Federativa</Label>
              <Input value={ipesForm.entidadFederativa} onChange={(e) => setIpesForm(f => ({ ...f, entidadFederativa: e.target.value }))} placeholder="Guanajuato" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={guardarIPES} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Guardar IPES</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Responsable de Firma</CardTitle>
          <CardDescription>Persona que firma electrónicamente los certificados con su FIEL/e.firma del SAT</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>CURP *</Label>
              <Input value={respForm.curp} onChange={(e) => setRespForm(f => ({ ...f, curp: e.target.value.toUpperCase() }))} placeholder="18 caracteres" maxLength={18} className="uppercase font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Nombre(s) *</Label>
              <Input value={respForm.nombre} onChange={(e) => setRespForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Primer Apellido *</Label>
              <Input value={respForm.primerApellido} onChange={(e) => setRespForm(f => ({ ...f, primerApellido: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Segundo Apellido</Label>
              <Input value={respForm.segundoApellido} onChange={(e) => setRespForm(f => ({ ...f, segundoApellido: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>ID Cargo *</Label>
              <Input value={respForm.idCargo} onChange={(e) => setRespForm(f => ({ ...f, idCargo: e.target.value }))} placeholder="Ej: 1 (Director General)" />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input value={respForm.cargo} onChange={(e) => setRespForm(f => ({ ...f, cargo: e.target.value }))} placeholder="Director General" />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><KeyRound className="h-4 w-4" /> Llaves SAT (FIEL / e.firma)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Contraseña de la llave privada</Label>
                <Input type="password" value={respForm.passwordLlavePrivada} onChange={(e) => setRespForm(f => ({ ...f, passwordLlavePrivada: e.target.value }))} placeholder={resp ? "••••••••" : "Contraseña del .key"} />
              </div>
              <div className="space-y-2">
                <Label>Certificado (.cer)</Label>
                <Button variant="outline" className="w-full gap-2" onClick={() => subirArchivo("certificado-cer")} disabled={!config?.id}>
                  <Upload className="h-4 w-4" /> {resp?.tieneCertificadoCer ? "Reemplazar .cer" : "Subir .cer"}
                </Button>
                {resp?.tieneCertificadoCer && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Archivo cargado</p>}
              </div>
              <div className="space-y-2">
                <Label>Llave privada (.key)</Label>
                <Button variant="outline" className="w-full gap-2" onClick={() => subirArchivo("llave-key")} disabled={!config?.id}>
                  <Upload className="h-4 w-4" /> {resp?.tieneLlaveKey ? "Reemplazar .key" : "Subir .key"}
                </Button>
                {resp?.tieneLlaveKey && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Archivo cargado</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={guardarResponsable} disabled={saving || !config?.id}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Guardar Responsable</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Credenciales Web Service SEP</CardTitle>
          <CardDescription>Usuario y contraseña para el servicio de Títulos Electrónicos de la SEP</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Usuario *</Label>
              <Input value={credForm.usuario} onChange={(e) => setCredForm(f => ({ ...f, usuario: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input type="password" value={credForm.password} onChange={(e) => setCredForm(f => ({ ...f, password: e.target.value }))} placeholder={cred?.tienePassword ? "••••••••" : "Contraseña"} />
            </div>
            <div className="space-y-2">
              <Label>Endpoint URL</Label>
              <Input value={credForm.endpointUrl} onChange={(e) => setCredForm(f => ({ ...f, endpointUrl: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={credForm.esProduccion} onCheckedChange={(v) => setCredForm(f => ({ ...f, esProduccion: v }))} />
              <Label>{credForm.esProduccion ? "Producción" : "Ambiente de pruebas (QA)"}</Label>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={guardarCredencial} disabled={saving || !config?.id}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Guardar Credenciales</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
