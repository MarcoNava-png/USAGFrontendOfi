"use client";

import { useEffect, useState } from "react";

import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Analista,
  CatalogosEstudio,
  EstudioSocioeconomico,
  EstudioSocioeconomicoRequest,
} from "@/types/estudio-socioeconomico";

interface Props {
  catalogos: CatalogosEstudio;
  initial?: EstudioSocioeconomico | null;
  analistas?: Analista[];
  showAnalista?: boolean;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (req: EstudioSocioeconomicoRequest) => void;
}

function buildState(initial?: EstudioSocioeconomico | null): EstudioSocioeconomicoRequest {
  return {
    idParentescoVivienda: initial?.idParentescoVivienda ?? null,
    conQuienViveOtro: initial?.conQuienViveOtro ?? "",
    numeroPersonasHogar: initial?.numeroPersonasHogar ?? null,
    principalSostenEconomico: initial?.principalSostenEconomico ?? "",
    personasAportanIngresos: initial?.personasAportanIngresos ?? null,
    trabaja: initial?.trabaja ?? false,
    empresaActividad: initial?.empresaActividad ?? "",
    horarioLaboral: initial?.horarioLaboral ?? "",
    quienCubreGastos: initial?.quienCubreGastos ?? "",
    dificultadesEconomicas: initial?.dificultadesEconomicas ?? false,
    idServicioMedico: initial?.idServicioMedico ?? null,
    padeceEnfermedad: initial?.padeceEnfermedad ?? false,
    padeceEnfermedadDetalle: initial?.padeceEnfermedadDetalle ?? "",
    tieneDiscapacidad: initial?.tieneDiscapacidad ?? false,
    tieneDiscapacidadDetalle: initial?.tieneDiscapacidadDetalle ?? "",
    escuelaProcedencia: initial?.escuelaProcedencia ?? "",
    promedioNivelAnterior: initial?.promedioNivelAnterior ?? null,
    analistaId: initial?.analistaId ?? null,
    serviciosViviendaIds: initial?.serviciosViviendaIds ?? [],
    recursosTecnologicosIds: initial?.recursosTecnologicosIds ?? [],
  };
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: "#14356F" }}>
        {titulo}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
      <Separator />
    </div>
  );
}

export function EstudioSocioeconomicoForm({
  catalogos,
  initial,
  analistas = [],
  showAnalista = false,
  submitting = false,
  submitLabel = "Guardar estudio",
  onSubmit,
}: Props) {
  const [form, setForm] = useState<EstudioSocioeconomicoRequest>(buildState(initial));
  const [faltantes, setFaltantes] = useState<string[]>([]);

  useEffect(() => {
    setForm(buildState(initial));
    setFaltantes([]);
  }, [initial]);

  const update = (partial: Partial<EstudioSocioeconomicoRequest>) => setForm((prev) => ({ ...prev, ...partial }));

  const toggleId = (key: "serviciosViviendaIds" | "recursosTecnologicosIds", id: number) =>
    setForm((prev) => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] };
    });

  const parentescoOtro = catalogos.parentescos.find((p) => p.id === form.idParentescoVivienda)?.nombre === "Otro";

  const handleSubmit = () => {
    const clean = (s?: string | null) => (s && s.trim() !== "" ? s.trim() : null);

    const requeridos: { falta: boolean; label: string }[] = [
      { falta: form.idParentescoVivienda == null, label: "¿Con quién vive actualmente?" },
      { falta: form.numeroPersonasHogar == null, label: "Número de personas que integran su hogar" },
      { falta: !clean(form.principalSostenEconomico), label: "Principal sostén económico de la familia" },
      { falta: !clean(form.quienCubreGastos), label: "¿Quién cubrirá los gastos de sus estudios?" },
      { falta: form.idServicioMedico == null, label: "¿Cuenta con servicio médico?" },
      { falta: !clean(form.escuelaProcedencia), label: "Escuela de procedencia" },
      { falta: form.promedioNivelAnterior == null, label: "Promedio obtenido en el nivel anterior" },
    ];
    const errores = requeridos.filter((r) => r.falta).map((r) => r.label);
    setFaltantes(errores);
    if (errores.length > 0) {
      toast.error("Faltan campos obligatorios por completar");
      return;
    }

    onSubmit({
      ...form,
      conQuienViveOtro: clean(form.conQuienViveOtro),
      principalSostenEconomico: clean(form.principalSostenEconomico),
      empresaActividad: clean(form.empresaActividad),
      horarioLaboral: clean(form.horarioLaboral),
      quienCubreGastos: clean(form.quienCubreGastos),
      padeceEnfermedadDetalle: clean(form.padeceEnfermedadDetalle),
      tieneDiscapacidadDetalle: clean(form.tieneDiscapacidadDetalle),
      escuelaProcedencia: clean(form.escuelaProcedencia),
    });
  };

  return (
    <div className="space-y-6">
      {faltantes.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-semibold">Completa los campos obligatorios (*):</p>
            <ul className="list-disc list-inside mt-1">
              {faltantes.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Seccion titulo="Información Familiar">
        <div className="space-y-2">
          <Label>¿Con quién vive actualmente? *</Label>
          <Select
            value={form.idParentescoVivienda?.toString() ?? ""}
            onValueChange={(v) => update({ idParentescoVivienda: parseInt(v) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {catalogos.parentescos.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {parentescoOtro && (
          <div className="space-y-2">
            <Label>Especifique (otro)</Label>
            <Input
              value={form.conQuienViveOtro ?? ""}
              onChange={(e) => update({ conQuienViveOtro: e.target.value })}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Número de personas que integran su hogar *</Label>
          <Input
            type="number"
            min={0}
            value={form.numeroPersonasHogar ?? ""}
            onChange={(e) => update({ numeroPersonasHogar: e.target.value ? parseInt(e.target.value) : null })}
          />
        </div>
        <div className="space-y-2">
          <Label>Principal sostén económico de la familia *</Label>
          <Input
            value={form.principalSostenEconomico ?? ""}
            onChange={(e) => update({ principalSostenEconomico: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>¿Cuántas personas aportan ingresos al hogar?</Label>
          <Input
            type="number"
            min={0}
            value={form.personasAportanIngresos ?? ""}
            onChange={(e) => update({ personasAportanIngresos: e.target.value ? parseInt(e.target.value) : null })}
          />
        </div>
      </Seccion>

      <Seccion titulo="Situación Económica">
        <div className="flex items-center gap-2 md:col-span-2">
          <Checkbox
            checked={form.trabaja === true}
            onCheckedChange={(v) => update({ trabaja: v === true })}
          />
          <Label>¿Trabaja actualmente?</Label>
        </div>
        {form.trabaja && (
          <>
            <div className="space-y-2">
              <Label>Empresa o actividad</Label>
              <Input value={form.empresaActividad ?? ""} onChange={(e) => update({ empresaActividad: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Horario laboral</Label>
              <Input value={form.horarioLaboral ?? ""} onChange={(e) => update({ horarioLaboral: e.target.value })} />
            </div>
          </>
        )}
        <div className="space-y-2">
          <Label>¿Quién cubrirá los gastos de sus estudios? *</Label>
          <Input value={form.quienCubreGastos ?? ""} onChange={(e) => update({ quienCubreGastos: e.target.value })} />
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <Checkbox
            checked={form.dificultadesEconomicas === true}
            onCheckedChange={(v) => update({ dificultadesEconomicas: v === true })}
          />
          <Label>¿Considera que tendrá dificultades económicas para continuar sus estudios?</Label>
        </div>
      </Seccion>

      <Seccion titulo="Vivienda — servicios con los que cuenta">
        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
          {catalogos.serviciosVivienda.map((s) => (
            <label key={s.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={form.serviciosViviendaIds.includes(s.id)}
                onCheckedChange={() => toggleId("serviciosViviendaIds", s.id)}
              />
              <span className="text-sm">{s.nombre}</span>
            </label>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Recursos Tecnológicos">
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          {catalogos.recursosTecnologicos.map((r) => (
            <label key={r.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={form.recursosTecnologicosIds.includes(r.id)}
                onCheckedChange={() => toggleId("recursosTecnologicosIds", r.id)}
              />
              <span className="text-sm">{r.nombre}</span>
            </label>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Salud">
        <div className="space-y-2">
          <Label>¿Cuenta con servicio médico? *</Label>
          <Select
            value={form.idServicioMedico?.toString() ?? ""}
            onValueChange={(v) => update({ idServicioMedico: parseInt(v) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {catalogos.serviciosMedicos.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div />
        <div className="flex items-center gap-2 md:col-span-2">
          <Checkbox
            checked={form.padeceEnfermedad === true}
            onCheckedChange={(v) => update({ padeceEnfermedad: v === true })}
          />
          <Label>¿Padece alguna enfermedad o condición que requiera atención especial?</Label>
        </div>
        {form.padeceEnfermedad && (
          <div className="space-y-2 md:col-span-2">
            <Label>Detalle de la enfermedad/condición</Label>
            <Textarea
              value={form.padeceEnfermedadDetalle ?? ""}
              onChange={(e) => update({ padeceEnfermedadDetalle: e.target.value })}
            />
          </div>
        )}
        <div className="flex items-center gap-2 md:col-span-2">
          <Checkbox
            checked={form.tieneDiscapacidad === true}
            onCheckedChange={(v) => update({ tieneDiscapacidad: v === true })}
          />
          <Label>¿Tiene alguna discapacidad o necesidad educativa específica?</Label>
        </div>
        {form.tieneDiscapacidad && (
          <div className="space-y-2 md:col-span-2">
            <Label>Detalle de la discapacidad/NEE</Label>
            <Textarea
              value={form.tieneDiscapacidadDetalle ?? ""}
              onChange={(e) => update({ tieneDiscapacidadDetalle: e.target.value })}
            />
          </div>
        )}
      </Seccion>

      <Seccion titulo="Aspectos Académicos">
        <div className="space-y-2">
          <Label>Escuela de procedencia *</Label>
          <Input
            value={form.escuelaProcedencia ?? ""}
            onChange={(e) => update({ escuelaProcedencia: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Promedio obtenido en el nivel anterior *</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            max={10}
            value={form.promedioNivelAnterior ?? ""}
            onChange={(e) => update({ promedioNivelAnterior: e.target.value ? parseFloat(e.target.value) : null })}
          />
        </div>
      </Seccion>

      {showAnalista && (
        <Seccion titulo="Analista de la escuela">
          <div className="space-y-2 md:col-span-2">
            <Label>Analista responsable del estudio</Label>
            <Select value={form.analistaId ?? ""} onValueChange={(v) => update({ analistaId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Se registrará automáticamente quien capture (o elige)" />
              </SelectTrigger>
              <SelectContent>
                {analistas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Seccion>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={submitting} style={{ backgroundColor: "#14356F" }}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </div>
  );
}
