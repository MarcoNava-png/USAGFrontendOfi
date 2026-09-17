"use client";

import { useEffect, useState } from "react";

import { CalendarClock } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { formatPeriodoLabel } from "@/services/academic-period-service";
import { getAcademicPeriods } from "@/services/catalogs-service";
import {
  apartarParaPeriodo,
  getPendientes,
  PreInscripcionDto,
} from "@/services/pre-inscripcion-service";
import { AcademicPeriod } from "@/types/catalog";

interface ApartarPeriodoButtonProps {
  idEstudiante: number;
  matricula: string;
  idPlanEstudios: number | null;
  planEstudios: string | null;
}

export function ApartarPeriodoButton({
  idEstudiante,
  matricula,
  idPlanEstudios,
  planEstudios,
}: ApartarPeriodoButtonProps) {
  const [open, setOpen] = useState(false);
  const [periodos, setPeriodos] = useState<AcademicPeriod[]>([]);
  const [periodoDestino, setPeriodoDestino] = useState<string>("");
  const [cuatrimestreObjetivo, setCuatrimestreObjetivo] = useState<string>("");
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [preinscripcionPendiente, setPreinscripcionPendiente] = useState<PreInscripcionDto | null>(null);

  useEffect(() => {
    let activo = true;
    if (!idPlanEstudios) return;
    getAcademicPeriods()
      .then(async (data) => {
        if (!activo) return;
        setPeriodos(data);
        await cargarPendienteDeLista(data);
      })
      .catch(() => undefined);
    return () => {
      activo = false;
    };
  }, [idPlanEstudios, idEstudiante]);

  const cargarPendienteDeLista = async (listaPeriodos: AcademicPeriod[]) => {
    if (!idPlanEstudios) return;
    try {
      const resultados = await Promise.all(
        listaPeriodos.map((p) =>
          getPendientes(idPlanEstudios, p.idPeriodoAcademico).catch(() => [] as PreInscripcionDto[])
        )
      );
      const todas = resultados.flat();
      const propia = todas.find((pre) => pre.idEstudiante === idEstudiante || pre.matricula === matricula);
      setPreinscripcionPendiente(propia ?? null);
    } catch {
      setPreinscripcionPendiente(null);
    }
  };

  const handleConfirmar = async () => {
    if (!idPlanEstudios) {
      toast.error("El estudiante no tiene plan de estudios asignado");
      return;
    }
    if (!periodoDestino || !cuatrimestreObjetivo) return;
    setGuardando(true);
    try {
      const creada = await apartarParaPeriodo({
        idEstudiante,
        idPlanEstudios,
        idPeriodoAcademicoDestino: Number(periodoDestino),
        numeroCuatrimestreObjetivo: Number(cuatrimestreObjetivo),
        nota: nota.trim() || undefined,
      });
      setPreinscripcionPendiente(creada);
      toast.success("Alumno apartado para el periodo seleccionado");
      setOpen(false);
      setPeriodoDestino("");
      setCuatrimestreObjetivo("");
      setNota("");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; Error?: string; mensaje?: string } } };
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.Error ||
        err?.response?.data?.mensaje ||
        "Error al apartar al alumno";
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      {preinscripcionPendiente && (
        <Badge
          variant="outline"
          className="border-blue-300 bg-blue-50 text-blue-800 gap-1"
        >
          <CalendarClock className="w-3.5 h-3.5" />
          Inscripción pendiente para periodo futuro · {preinscripcionPendiente.periodoNombre}
        </Badge>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={!idPlanEstudios}
        title={!idPlanEstudios ? "El estudiante necesita un plan de estudios asignado" : undefined}
      >
        <CalendarClock className="w-4 h-4 mr-2" />
        Apartar para periodo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: "#14356F" }}>
              <CalendarClock className="h-5 w-5" />
              Apartar para periodo futuro
            </DialogTitle>
            <DialogDescription>
              {planEstudios ? `Plan: ${planEstudios}` : "Inscripción pendiente para periodo futuro"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Periodo destino</Label>
              <Select value={periodoDestino} onValueChange={setPeriodoDestino}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el periodo" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {periodos.map((p) => (
                    <SelectItem key={p.idPeriodoAcademico} value={p.idPeriodoAcademico.toString()}>
                      {formatPeriodoLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cuatrimestre objetivo</Label>
              <Input
                type="number"
                min={1}
                max={12}
                placeholder="Ej. 2"
                value={cuatrimestreObjetivo}
                onChange={(e) => setCuatrimestreObjetivo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nota (opcional)</Label>
              <Textarea
                placeholder="Observaciones del apartado..."
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmar}
              disabled={!periodoDestino || !cuatrimestreObjetivo || guardando}
              style={{ background: "linear-gradient(to right, var(--brand-surface), var(--brand-surface-2))" }}
            >
              {guardando ? "Apartando..." : "Apartar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
