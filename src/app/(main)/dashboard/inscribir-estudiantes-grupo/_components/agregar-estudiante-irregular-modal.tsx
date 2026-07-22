"use client";

import { useEffect, useState } from "react";

import { CheckCircle2, Copy, KeyRound, Loader2, Mail, UserPlus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getGenresList } from "@/services/catalogs-service";
import {
  agregarEstudianteIrregular,
  getEmailDomains,
  type AgregarEstudianteIrregularResponse,
} from "@/services/groups-service";
import type { Genres } from "@/types/catalog";

interface AgregarEstudianteIrregularModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idGrupo: number;
  nombreGrupo: string;
  planEstudios?: string;
  onSuccess?: () => void;
}

const estadoInicial = {
  nombre: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  curp: "",
  correo: "",
  telefono: "",
  celular: "",
  fechaNacimiento: "",
  idGenero: "",
  matricula: "",
};

export function AgregarEstudianteIrregularModal({
  open,
  onOpenChange,
  idGrupo,
  nombreGrupo,
  planEstudios,
  onSuccess,
}: AgregarEstudianteIrregularModalProps) {
  const [form, setForm] = useState(estadoInicial);
  const [generos, setGeneros] = useState<Genres[]>([]);
  const [crearAcceso, setCrearAcceso] = useState(false);
  const [crearCorreoM365, setCrearCorreoM365] = useState(false);
  const [usuarioCorreo, setUsuarioCorreo] = useState("");
  const [dominios, setDominios] = useState<string[]>(["usaguanajuato.edu.mx"]);
  const [dominio, setDominio] = useState("usaguanajuato.edu.mx");
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState<AgregarEstudianteIrregularResponse | null>(null);

  useEffect(() => {
    if (open) {
      setForm(estadoInicial);
      setCrearAcceso(false);
      setCrearCorreoM365(false);
      setUsuarioCorreo("");
      setResultado(null);
      getGenresList()
        .then(setGeneros)
        .catch(() => setGeneros([]));
      getEmailDomains()
        .then((d) => {
          if (d && d.length > 0) {
            setDominios(d);
            setDominio(d.includes("usaguanajuato.edu.mx") ? "usaguanajuato.edu.mx" : d[0]);
          }
        })
        .catch(() => {
          setDominios(["usaguanajuato.edu.mx"]);
          setDominio("usaguanajuato.edu.mx");
        });
    }
  }, [open]);

  useEffect(() => {
    if (!crearAcceso) setCrearCorreoM365(false);
  }, [crearAcceso]);

  const set = (campo: keyof typeof estadoInicial, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.apellidoPaterno.trim()) {
      toast.error("El nombre y el apellido paterno son obligatorios");
      return;
    }

    setSubmitting(true);
    try {
      const data = await agregarEstudianteIrregular(idGrupo, {
        datos: {
          nombre: form.nombre.trim(),
          apellidoPaterno: form.apellidoPaterno.trim(),
          apellidoMaterno: form.apellidoMaterno.trim() || undefined,
          curp: form.curp.trim() || undefined,
          correo: form.correo.trim() || undefined,
          telefono: form.telefono.trim() || undefined,
          celular: form.celular.trim() || undefined,
          fechaNacimiento: form.fechaNacimiento || undefined,
          idGenero: form.idGenero ? parseInt(form.idGenero) : undefined,
          matricula: form.matricula.trim() || undefined,
        },
        crearAcceso,
        crearCorreoM365,
        usuarioCorreo: usuarioCorreo.trim() || undefined,
        dominio,
      });

      if (data.exitoso) {
        toast.success(data.mensaje);
        setResultado(data);
        onSuccess?.();
      } else {
        toast.error(data.mensaje);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { mensaje?: string } }; message?: string };
      toast.error(err?.response?.data?.mensaje ?? err?.message ?? "Error al agregar el estudiante");
    } finally {
      setSubmitting(false);
    }
  };

  const copiar = (texto: string) => {
    navigator.clipboard?.writeText(texto);
    toast.success("Copiado al portapapeles");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" style={{ color: "#14356F" }} />
            Agregar estudiante irregular
          </DialogTitle>
          <DialogDescription>
            Se creará el estudiante, se le asignará matrícula y se inscribirá a todas las materias del grupo{" "}
            <strong>{nombreGrupo}</strong>
            {planEstudios ? ` (${planEstudios})` : ""}.
          </DialogDescription>
        </DialogHeader>

        {resultado ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-800 font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                Estudiante agregado al grupo
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  Matrícula: <strong className="font-mono">{resultado.matricula}</strong>
                </p>
                <p>Materias inscritas: {resultado.materiasInscritas}</p>
              </div>
            </div>

            {resultado.accesoCreado && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-gray-800">
                  <KeyRound className="w-4 h-4" /> Cuenta de acceso
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-mono break-all">{resultado.emailAcceso}</span>
                  <Button variant="ghost" size="icon" onClick={() => copiar(resultado.emailAcceso ?? "")}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    Contraseña temporal:{" "}
                    <strong className="font-mono">{resultado.passwordTemporal}</strong>
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => copiar(resultado.passwordTemporal ?? "")}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-amber-700">
                  Guarda esta contraseña ahora: no se volverá a mostrar. El alumno deberá cambiarla al primer ingreso.
                </p>
              </div>
            )}

            {crearCorreoM365 && (
              <div
                className={`rounded-lg border p-3 text-sm flex items-start gap-2 ${
                  resultado.correoM365Creado
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{resultado.mensajeM365 ?? (resultado.correoM365Creado ? "Buzón creado en Microsoft 365" : "No se creó el buzón en Microsoft 365")}</span>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} style={{ backgroundColor: "#14356F" }}>
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nombre(s) *</Label>
                <Input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Apellido paterno *</Label>
                <Input value={form.apellidoPaterno} onChange={(e) => set("apellidoPaterno", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Apellido materno</Label>
                <Input value={form.apellidoMaterno} onChange={(e) => set("apellidoMaterno", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>CURP</Label>
                <Input
                  value={form.curp}
                  maxLength={18}
                  onChange={(e) => set("curp", e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-1">
                <Label>Correo personal</Label>
                <Input type="email" value={form.correo} onChange={(e) => set("correo", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={(e) => set("telefono", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Celular</Label>
                <Input value={form.celular} onChange={(e) => set("celular", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(e) => set("fechaNacimiento", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Género</Label>
                <Select value={form.idGenero} onValueChange={(v) => set("idGenero", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {generos.map((g) => (
                      <SelectItem key={g.idGenero} value={g.idGenero.toString()}>
                        {g.descGenero}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Matrícula (opcional)</Label>
                <Input
                  value={form.matricula}
                  onChange={(e) => set("matricula", e.target.value)}
                  placeholder="Automática si se deja vacía"
                />
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-blue-900 cursor-pointer">
                <Checkbox checked={crearAcceso} onCheckedChange={(v) => setCrearAcceso(v === true)} />
                Crear cuenta de acceso al portal
              </label>
              {crearAcceso && (
                <div className="space-y-2 pl-6">
                  <Label className="text-xs text-blue-900">Correo institucional</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      value={usuarioCorreo}
                      onChange={(e) => setUsuarioCorreo(e.target.value.replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase())}
                      placeholder="matrícula (automático)"
                      className="flex-1"
                    />
                    <span className="text-sm text-blue-900">@</span>
                    <Select value={dominio} onValueChange={setDominio}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dominios.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-blue-600">
                    Quedará como{" "}
                    <strong className="font-mono">
                      {(usuarioCorreo.trim() || "{matrícula}")}@{dominio}
                    </strong>
                    . El dominio se elige de la lista verificada en Microsoft 365.
                  </p>
                  <label className="flex items-center gap-2 text-xs text-blue-800 cursor-pointer">
                    <Checkbox
                      checked={crearCorreoM365}
                      onCheckedChange={(v) => setCrearCorreoM365(v === true)}
                    />
                    Crear también el buzón en Microsoft 365 (asigna licencia)
                  </label>
                </div>
              )}
              <p className="text-xs text-blue-700">
                La contraseña temporal se generará y se mostrará al terminar.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} style={{ backgroundColor: "#14356F" }}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  "Agregar al grupo"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
