"use client";

import { useEffect, useState } from "react";

import { Hash, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ConfiguracionMatricula,
  getConfiguracionMatriculas,
  guardarConfiguracionMatricula,
} from "@/services/configuracion-matricula-service";

export default function ConfiguracionMatriculasPage() {
  const [rows, setRows] = useState<ConfiguracionMatricula[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await getConfiguracionMatriculas());
    } catch {
      toast.error("No se pudieron cargar las configuraciones de matrícula");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateRow = (id: number, patch: Partial<ConfiguracionMatricula>) => {
    setRows((prev) => prev.map((r) => (r.idNivelEducativo === id ? { ...r, ...patch } : r)));
  };

  const ejemplo = (r: ConfiguracionMatricula) => {
    const pref = (r.prefijo ?? "").trim().toUpperCase();
    if (!pref) return r.ejemploMatricula ?? "";
    return `${pref}${"1".padStart(r.digitos, "0")}`;
  };

  const handleSave = async (r: ConfiguracionMatricula) => {
    setSavingId(r.idNivelEducativo);
    try {
      const saved = await guardarConfiguracionMatricula({
        idNivelEducativo: r.idNivelEducativo,
        prefijo: (r.prefijo ?? "").trim().toUpperCase(),
        digitos: r.digitos,
        activo: r.activo,
        descripcion: r.descripcion,
      });
      updateRow(r.idNivelEducativo, saved);
      toast.success(`Guardado: ${saved.nivelEducativo} → ${saved.ejemploMatricula}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { Error?: string } } };
      toast.error(err?.response?.data?.Error ?? "No se pudo guardar la configuración");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Hash className="w-8 h-8" style={{ color: "#14356F" }} />
          Configuración de Matrículas
        </h1>
        <p className="text-muted-foreground mt-1">
          Define el prefijo y la cantidad de dígitos de la matrícula por nivel educativo. Cada nivel lleva su propia
          numeración (por ejemplo, Diplomados con <span className="font-mono font-semibold">LD</span>).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prefijos por nivel educativo</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nivel educativo</TableHead>
                    <TableHead className="w-[140px]">Prefijo</TableHead>
                    <TableHead className="w-[110px]">Dígitos</TableHead>
                    <TableHead className="w-[150px]">Ejemplo</TableHead>
                    <TableHead className="w-[100px] text-center">Activo</TableHead>
                    <TableHead className="w-[110px]">Alumnos</TableHead>
                    <TableHead className="w-[120px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.idNivelEducativo}>
                      <TableCell className="font-medium">
                        {r.nivelEducativo}
                        {!r.tieneRegla && (
                          <Badge variant="outline" className="ml-2 text-xs font-normal">
                            por defecto
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={r.prefijo ?? ""}
                          maxLength={5}
                          placeholder="auto"
                          className="uppercase font-mono"
                          onChange={(e) =>
                            updateRow(r.idNivelEducativo, {
                              prefijo: e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase(),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={4}
                          max={8}
                          value={r.digitos}
                          onChange={(e) =>
                            updateRow(r.idNivelEducativo, { digitos: Number(e.target.value) || 5 })
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{ejemplo(r)}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={r.activo}
                          onCheckedChange={(v) => updateRow(r.idNivelEducativo, { activo: v })}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.totalEstudiantes}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingId === r.idNivelEducativo}
                          onClick={() => handleSave(r)}
                        >
                          {savingId === r.idNivelEducativo ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-1" /> Guardar
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Si un nivel no tiene prefijo definido, el sistema usa su lógica por defecto. El prefijo solo aplica a matrículas
        nuevas; las ya asignadas no cambian.
      </p>
    </div>
  );
}
