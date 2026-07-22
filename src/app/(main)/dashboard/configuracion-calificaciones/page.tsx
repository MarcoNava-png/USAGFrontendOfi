"use client";

import { useEffect, useState } from "react";

import { SlidersHorizontal, Save, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getConfiguracionCalificaciones,
  guardarConfiguracionCalificaciones,
  getParciales,
  guardarParcial,
  eliminarParcial,
  type ConfiguracionCalificaciones,
  type Parcial,
} from "@/services/configuracion-calificaciones-service";

const CONFIG_DEFAULT: ConfiguracionCalificaciones = {
  idConfiguracionCalificaciones: 0,
  escalaMaxima: 10,
  calificacionMinimaAprobatoria: 6,
  decimales: 1,
  redondearAlEntero: false,
};

export default function ConfiguracionCalificacionesPage() {
  const [config, setConfig] = useState<ConfiguracionCalificaciones>(CONFIG_DEFAULT);
  const [parciales, setParciales] = useState<Parcial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [parcialEdicion, setParcialEdicion] = useState<Parcial>({ id: 0, name: "", orden: 0 });
  const [guardandoParcial, setGuardandoParcial] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const [cfg, pcs] = await Promise.all([getConfiguracionCalificaciones(), getParciales()]);
      setConfig(cfg);
      setParciales(pcs);
    } catch {
      toast.error("No se pudo cargar la configuración de calificaciones");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function onGuardarConfig() {
    setGuardando(true);
    try {
      const actualizada = await guardarConfiguracionCalificaciones(config);
      setConfig(actualizada);
      toast.success("Configuración guardada correctamente");
    } catch {
      toast.error("No se pudo guardar la configuración");
    } finally {
      setGuardando(false);
    }
  }

  function abrirNuevoParcial() {
    const siguienteOrden = parciales.length > 0 ? Math.max(...parciales.map((p) => p.orden)) + 1 : 1;
    setParcialEdicion({ id: 0, name: "", orden: siguienteOrden });
    setDialogAbierto(true);
  }

  function abrirEditarParcial(parcial: Parcial) {
    setParcialEdicion({ ...parcial });
    setDialogAbierto(true);
  }

  async function onGuardarParcial() {
    if (!parcialEdicion.name.trim()) {
      toast.error("El nombre del parcial es requerido");
      return;
    }
    setGuardandoParcial(true);
    try {
      await guardarParcial(parcialEdicion);
      toast.success("Parcial guardado correctamente");
      setDialogAbierto(false);
      await cargar();
    } catch {
      toast.error("No se pudo guardar el parcial");
    } finally {
      setGuardandoParcial(false);
    }
  }

  async function onEliminarParcial(id: number) {
    try {
      await eliminarParcial(id);
      toast.success("Parcial eliminado");
      setParciales((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error("No se pudo eliminar el parcial");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <SlidersHorizontal className="h-7 w-7 text-primary" />
          </div>
          Configuración de Calificaciones
        </h1>
        <p className="text-muted-foreground mt-1">
          Define la escala, la calificación mínima aprobatoria, el redondeo y los parciales del ciclo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Escala y aprobación</CardTitle>
          <CardDescription>Parámetros generales para el cálculo de calificaciones.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {cargando ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="escalaMaxima">Escala máxima</Label>
                  <Input
                    id="escalaMaxima"
                    type="number"
                    step="0.01"
                    value={config.escalaMaxima}
                    onChange={(e) => setConfig({ ...config, escalaMaxima: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calificacionMinimaAprobatoria">Calificación mínima aprobatoria</Label>
                  <Input
                    id="calificacionMinimaAprobatoria"
                    type="number"
                    step="0.01"
                    value={config.calificacionMinimaAprobatoria}
                    onChange={(e) =>
                      setConfig({ ...config, calificacionMinimaAprobatoria: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="decimales">Decimales</Label>
                  <Input
                    id="decimales"
                    type="number"
                    step="1"
                    min="0"
                    value={config.decimales}
                    onChange={(e) => setConfig({ ...config, decimales: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="redondearAlEntero">Redondear al entero</Label>
                    <p className="text-sm text-muted-foreground">Redondea la calificación final al número entero.</p>
                  </div>
                  <Switch
                    id="redondearAlEntero"
                    checked={config.redondearAlEntero}
                    onCheckedChange={(v) => setConfig({ ...config, redondearAlEntero: v })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={onGuardarConfig} disabled={guardando}>
                  {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Parciales</CardTitle>
            <CardDescription>Periodos de captura de calificaciones.</CardDescription>
          </div>
          <Button variant="outline" onClick={abrirNuevoParcial}>
            <Plus className="h-4 w-4" /> Agregar parcial
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Orden</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-32 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parciales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    No hay parciales registrados.
                  </TableCell>
                </TableRow>
              ) : (
                parciales.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.orden}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => abrirEditarParcial(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => onEliminarParcial(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{parcialEdicion.id > 0 ? "Editar parcial" : "Nuevo parcial"}</DialogTitle>
            <DialogDescription>Captura el nombre y el orden del parcial.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="parcialNombre">Nombre</Label>
              <Input
                id="parcialNombre"
                value={parcialEdicion.name}
                onChange={(e) => setParcialEdicion({ ...parcialEdicion, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parcialOrden">Orden</Label>
              <Input
                id="parcialOrden"
                type="number"
                step="1"
                value={parcialEdicion.orden}
                onChange={(e) => setParcialEdicion({ ...parcialEdicion, orden: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={onGuardarParcial} disabled={guardandoParcial}>
              {guardandoParcial ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
