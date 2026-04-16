"use client";

import { useEffect, useState } from "react";

import { ClipboardList, Edit, Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCampusList } from "@/services/campus-service";
import { getStudyPlans } from "@/services/catalogs-service";
import {
  listarTarifasAdmision,
  eliminarTarifaAdmision,
  cambiarEstadoTarifaAdmision,
} from "@/services/tarifas-admision-service";
import { Campus } from "@/types/campus";
import { StudyPlan } from "@/types/catalog";
import { TarifaAdmisionDto } from "@/types/tarifa-admision";

import { TarifaAdmisionModal } from "./_components/tarifa-admision-modal";

export default function TarifasAdmisionPage() {
  const [tarifas, setTarifas] = useState<TarifaAdmisionDto[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [planes, setPlanes] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroCampus, setFiltroCampus] = useState<string>("TODOS");
  const [filtroPlan, setFiltroPlan] = useState<string>("TODOS");
  const [filtroActivo, setFiltroActivo] = useState<string>("true");
  const [modalOpen, setModalOpen] = useState(false);
  const [tarifaEditar, setTarifaEditar] = useState<TarifaAdmisionDto | null>(null);

  useEffect(() => {
    Promise.all([
      getCampusList().then((res) => setCampuses(res.items ?? [])),
      getStudyPlans().then(setPlanes),
    ]).catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
  }, [filtroActivo]);

  async function cargar() {
    setLoading(true);
    try {
      const soloActivas = filtroActivo === "true" ? true : filtroActivo === "false" ? false : undefined;
      const data = await listarTarifasAdmision(soloActivas);
      setTarifas(data);
    } catch {
      toast.error("Error al cargar tarifas de admisión");
    } finally {
      setLoading(false);
    }
  }

  async function handleCambiarEstado(id: number, activo: boolean) {
    try {
      await cambiarEstadoTarifaAdmision(id, activo);
      toast.success(activo ? "Tarifa activada" : "Tarifa desactivada");
      cargar();
    } catch {
      toast.error("Error al cambiar estado");
    }
  }

  async function handleEliminar(tarifa: TarifaAdmisionDto) {
    if (!confirm(`¿Seguro que deseas eliminar la tarifa "${tarifa.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarTarifaAdmision(tarifa.idTarifaAdmision);
      toast.success("Tarifa eliminada");
      cargar();
    } catch {
      toast.error("No se pudo eliminar la tarifa");
    }
  }

  function handleEditar(tarifa: TarifaAdmisionDto) {
    setTarifaEditar(tarifa);
    setModalOpen(true);
  }

  function handleNueva() {
    setTarifaEditar(null);
    setModalOpen(true);
  }

  function handleCloseModal(reload?: boolean) {
    setModalOpen(false);
    setTarifaEditar(null);
    if (reload) cargar();
  }

  const totalMonto = (tarifa: TarifaAdmisionDto) =>
    tarifa.detalles.filter((d) => d.esAplicable).reduce((acc, d) => acc + d.monto, 0);

  const planesFiltradosPorCampus = filtroCampus === "TODOS"
    ? planes
    : planes.filter((p) => String(p.idCampus) === filtroCampus);

  const tarifasFiltradas = tarifas.filter((t) => {
    if (filtroCampus !== "TODOS") {
      const plan = planes.find((p) => p.idPlanEstudios === t.idPlanEstudios);
      if (!plan || String(plan.idCampus) !== filtroCampus) return false;
    }
    if (filtroPlan !== "TODOS" && String(t.idPlanEstudios) !== filtroPlan) return false;
    return true;
  });

  if (loading && tarifas.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Cargando tarifas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Tarifas de Admisión
          </h1>
          <p className="text-muted-foreground">
            Administra las tarifas de cobro para el proceso de admisión por plan de estudios
          </p>
        </div>
        <Button onClick={handleNueva} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Tarifa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <div className="min-w-[200px] shrink-0">
              <Select value={filtroCampus} onValueChange={(v) => { setFiltroCampus(v); setFiltroPlan("TODOS"); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por campus..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los Campus</SelectItem>
                  {campuses.map((c) => (
                    <SelectItem key={c.idCampus} value={String(c.idCampus)}>
                      {c.claveCampus} - {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[250px] shrink-0">
              <Select value={filtroPlan} onValueChange={setFiltroPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por plan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los Planes</SelectItem>
                  {planesFiltradosPorCampus.map((p) => (
                    <SelectItem key={p.idPlanEstudios} value={String(p.idPlanEstudios)}>
                      {p.nombrePlanEstudios}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px] shrink-0">
              <Select value={filtroActivo} onValueChange={setFiltroActivo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Solo Activas</SelectItem>
                  <SelectItem value="false">Solo Inactivas</SelectItem>
                  <SelectItem value="all">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tarifas de Admisión</CardTitle>
          <CardDescription>Total: {tarifasFiltradas.length} tarifa{tarifasFiltradas.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Campus</TableHead>
                  <TableHead>Plan de Estudios</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-center whitespace-nowrap">Conceptos</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Total</TableHead>
                  <TableHead className="text-center whitespace-nowrap">Prom. Mens.</TableHead>
                  <TableHead className="text-center whitespace-nowrap">Costos Conv.</TableHead>
                  <TableHead className="text-center whitespace-nowrap">Estado</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tarifasFiltradas.map((tarifa) => (
                  <TableRow key={tarifa.idTarifaAdmision}>
                    <TableCell className="text-xs text-muted-foreground">
                      {tarifa.nombreCampus || "-"}
                    </TableCell>
                    <TableCell className="max-w-[220px] overflow-hidden">
                      <div className="overflow-hidden">
                        <p className="font-medium text-sm truncate" title={tarifa.nombrePlanEstudios}>{tarifa.nombrePlanEstudios}</p>
                        <p className="text-xs text-muted-foreground font-mono">{tarifa.clavePlanEstudios}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] overflow-hidden">
                      <p className="truncate font-medium" title={tarifa.nombre}>{tarifa.nombre}</p>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <Badge variant="outline">{tarifa.detalles.length}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono whitespace-nowrap">
                      ${totalMonto(tarifa).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {tarifa.aplicaConvenioMensualidad ? (
                        <Badge variant="default" className="bg-blue-600">Sí</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {tarifa.esConvenioEmpresarial ? (
                        <Badge variant="default" className="bg-purple-600">Sí</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <Badge variant={tarifa.activo ? "default" : "secondary"}>
                        {tarifa.activo ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEditar(tarifa)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleCambiarEstado(tarifa.idTarifaAdmision, !tarifa.activo)}>
                          <Power className={`h-4 w-4 ${tarifa.activo ? "text-green-600" : "text-gray-400"}`} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEliminar(tarifa)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {tarifasFiltradas.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              {filtroCampus !== "TODOS" || filtroPlan !== "TODOS"
                ? "No se encontraron tarifas para los filtros seleccionados"
                : "No se encontraron tarifas de admisión"}
            </div>
          )}
        </CardContent>
      </Card>

      <TarifaAdmisionModal
        open={modalOpen}
        onClose={handleCloseModal}
        tarifaToEdit={tarifaEditar}
        planes={planes}
        campuses={campuses}
      />
    </div>
  );
}
