"use client";

import { useEffect, useState } from "react";

import { BookOpen, CheckCircle, Database, GraduationCap, Loader2, Pencil, Save, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apiClient from "@/services/api-client";

const BASE = "/titulacion/catalogos-sep";

interface CatalogoItem {
  id: number;
  idTipoPeriodo?: string;
  idTipoCertificacion?: string;
  idCargo?: string;
  idObservacion?: string;
  codigo?: string;
  nombre?: string;
  descripcion: string;
  activo: boolean;
}

interface CarreraSEP {
  id: number;
  idNombreInstitucion: string;
  idNivelEstudios: string;
  idCarrera: string;
  claveCarrera: string;
  nombreCarrera: string;
  activo: boolean;
}

interface AsignaturaSEP {
  id: number;
  idNombreInstitucion: string;
  idCarrera: number;
  idAsignatura: number;
  claveAsignatura: string;
  nombre: string;
  creditos?: number | null;
  idTipoAsignatura?: number | null;
  tipoAsignatura?: string | null;
  activo: boolean;
}

interface Resumen {
  tiposPeriodo: number;
  tiposCertificacion: number;
  cargos: number;
  observaciones: number;
  nivelesEstudio: number;
  generos: number;
  tiposAsignatura: number;
  entidadesFederativas: number;
}

const CATALOGOS = [
  { key: "tipos-periodo", label: "Periodos", idField: "idTipoPeriodo" },
  { key: "tipos-certificacion", label: "Certificación", idField: "idTipoCertificacion" },
  { key: "cargos", label: "Cargos", idField: "idCargo" },
  { key: "observaciones", label: "Observaciones", idField: "idObservacion" },
  { key: "niveles-estudio", label: "Niveles", idField: "codigo" },
  { key: "generos", label: "Géneros", idField: "codigo" },
  { key: "tipos-asignatura", label: "Tipo Asig.", idField: "codigo" },
  { key: "entidades-federativas", label: "Entidades", idField: "codigo" },
];

export default function TitulacionCatalogosPage() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [mainTab, setMainTab] = useState("carreras");
  const [catTab, setCatTab] = useState("tipos-periodo");
  const [catItems, setCatItems] = useState<CatalogoItem[]>([]);
  const [loadingCat, setLoadingCat] = useState(false);

  const [carreras, setCarreras] = useState<CarreraSEP[]>([]);
  const [loadingCarreras, setLoadingCarreras] = useState(false);
  const [selectedCarrera, setSelectedCarrera] = useState<CarreraSEP | null>(null);

  const [asignaturas, setAsignaturas] = useState<AsignaturaSEP[]>([]);
  const [loadingAsig, setLoadingAsig] = useState(false);
  const [editingAsig, setEditingAsig] = useState<Record<number, AsignaturaSEP>>({});
  const [savingAsig, setSavingAsig] = useState(false);

  useEffect(() => {
    apiClient.get(`${BASE}/resumen`).then(r => setResumen(r.data)).catch(() => {});
    loadCarreras();
  }, []);

  useEffect(() => {
    if (mainTab === "otros") loadCatalogo();
  }, [catTab, mainTab]);

  const loadCarreras = async () => {
    setLoadingCarreras(true);
    try {
      const { data } = await apiClient.get<CarreraSEP[]>(`${BASE}/carreras`);
      setCarreras(data);
    } catch { toast.error("Error al cargar carreras"); }
    finally { setLoadingCarreras(false); }
  };

  const loadAsignaturas = async (idCarrera: number) => {
    setLoadingAsig(true);
    setEditingAsig({});
    try {
      const { data } = await apiClient.get<AsignaturaSEP[]>(`${BASE}/asignaturas/${idCarrera}`);
      setAsignaturas(data);
    } catch { toast.error("Error al cargar asignaturas"); }
    finally { setLoadingAsig(false); }
  };

  const handleSelectCarrera = (carrera: CarreraSEP) => {
    setSelectedCarrera(carrera);
    loadAsignaturas(parseInt(carrera.idCarrera));
  };

  const handleEditAsig = (asig: AsignaturaSEP) => {
    setEditingAsig(prev => ({
      ...prev,
      [asig.id]: {
        ...asig,
        idTipoAsignatura: asig.idTipoAsignatura || 263,
        tipoAsignatura: asig.tipoAsignatura || "OBLIGATORIA",
      }
    }));
  };

  const handleCancelEdit = (id: number) => {
    setEditingAsig(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSaveAsig = async (id: number) => {
    const edited = editingAsig[id];
    if (!edited) return;
    try {
      await apiClient.put(`${BASE}/asignaturas/${id}`, edited);
      toast.success("Asignatura actualizada");
      handleCancelEdit(id);
      if (selectedCarrera) loadAsignaturas(parseInt(selectedCarrera.idCarrera));
    } catch { toast.error("Error al guardar"); }
  };

  const handleSaveAll = async () => {
    const sinCreditos = asignaturas.filter(a => !a.creditos);
    if (sinCreditos.length > 0 && Object.keys(editingAsig).length === 0) {
      toast.error("Edita los créditos antes de guardar");
      return;
    }
    setSavingAsig(true);
    try {
      const updates = Object.values(editingAsig);
      if (updates.length > 0) {
        await apiClient.put(`${BASE}/asignaturas/lote`, updates);
        toast.success(`${updates.length} asignaturas actualizadas`);
        setEditingAsig({});
        if (selectedCarrera) loadAsignaturas(parseInt(selectedCarrera.idCarrera));
      }
    } catch { toast.error("Error al guardar lote"); }
    finally { setSavingAsig(false); }
  };

  const loadCatalogo = async () => {
    setLoadingCat(true);
    try {
      const { data } = await apiClient.get(`${BASE}/${catTab}`);
      setCatItems(data);
    } catch { toast.error("Error al cargar catálogo"); }
    finally { setLoadingCat(false); }
  };

  const getCodigo = (item: CatalogoItem) => {
    const cat = CATALOGOS.find(c => c.key === catTab);
    if (!cat) return "";
    return (item as any)[cat.idField] || item.codigo || "";
  };

  const conCreditos = asignaturas.filter(a => a.creditos && a.creditos > 0).length;
  const totalCreditos = asignaturas.reduce((s, a) => s + (a.creditos || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: "linear-gradient(to bottom right, rgba(20, 53, 111, 0.1), rgba(30, 74, 143, 0.1))" }}>
            <Database className="h-8 w-8" style={{ color: "#14356F" }} />
          </div>
          Catálogos SEP
        </h1>
        <p className="text-muted-foreground mt-1">Carreras, asignaturas y catálogos oficiales para certificados electrónicos</p>
      </div>

      {resumen && (
        <div className="grid gap-3 md:grid-cols-4">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Carreras</CardDescription>
              <CardTitle className="text-2xl text-green-700">{carreras.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Observaciones</CardDescription>
              <CardTitle className="text-2xl text-blue-700">{resumen.observaciones}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-purple-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Niveles</CardDescription>
              <CardTitle className="text-2xl text-purple-700">{resumen.nivelesEstudio}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-2">
              <CardDescription className="text-orange-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Entidades</CardDescription>
              <CardTitle className="text-2xl text-orange-700">{resumen.entidadesFederativas}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="carreras" className="gap-1"><GraduationCap className="h-4 w-4" /> Carreras y Asignaturas</TabsTrigger>
          <TabsTrigger value="otros" className="gap-1"><BookOpen className="h-4 w-4" /> Catálogos Generales</TabsTrigger>
        </TabsList>

        <TabsContent value="carreras" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Carreras Registradas ({carreras.length})</CardTitle>
                <CardDescription className="text-xs">Selecciona una carrera para ver sus asignaturas</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingCarreras ? (
                  <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                ) : (
                  <div className="max-h-[500px] overflow-auto">
                    {carreras.map(c => (
                      <div
                        key={c.id}
                        className={`px-4 py-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedCarrera?.id === c.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""}`}
                        onClick={() => handleSelectCarrera(c)}
                      >
                        <p className="font-medium text-sm">{c.nombreCarrera}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">ID: {c.idCarrera}</Badge>
                          <Badge variant="outline" className="text-xs">{c.claveCarrera}</Badge>
                          <Badge variant="outline" className="text-xs">Nivel: {c.idNivelEstudios}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">
                      {selectedCarrera ? `Asignaturas — ${selectedCarrera.nombreCarrera}` : "Selecciona una carrera"}
                    </CardTitle>
                    {selectedCarrera && (
                      <CardDescription className="text-xs mt-1">
                        {asignaturas.length} asignaturas | {conCreditos} con créditos | Total créditos: {totalCreditos.toFixed(2)}
                      </CardDescription>
                    )}
                  </div>
                  {Object.keys(editingAsig).length > 0 && (
                    <Button size="sm" onClick={handleSaveAll} disabled={savingAsig} className="gap-1">
                      {savingAsig ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Guardar todo ({Object.keys(editingAsig).length})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!selectedCarrera ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Selecciona una carrera de la lista</p>
                  </div>
                ) : loadingAsig ? (
                  <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                ) : (
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead className="w-8">#</TableHead>
                          <TableHead className="w-28">Clave</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead className="w-24 text-center">Créditos</TableHead>
                          <TableHead className="w-28 text-center">Tipo</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {asignaturas.map(a => {
                          const isEditing = editingAsig[a.id] !== undefined;
                          const editData = editingAsig[a.id];
                          return (
                            <TableRow key={a.id} className={isEditing ? "bg-yellow-50" : !a.creditos ? "bg-red-50/30" : ""}>
                              <TableCell className="text-xs text-gray-400">{a.idAsignatura}</TableCell>
                              <TableCell className="font-mono text-xs">{a.claveAsignatura}</TableCell>
                              <TableCell className="text-sm">{a.nombre}</TableCell>
                              <TableCell className="text-center">
                                {isEditing ? (
                                  <Input
                                    className="h-7 text-xs text-center w-20 mx-auto"
                                    type="number"
                                    step="0.01"
                                    value={editData.creditos ?? ""}
                                    onChange={e => setEditingAsig(prev => ({
                                      ...prev,
                                      [a.id]: { ...prev[a.id], creditos: e.target.value ? parseFloat(e.target.value) : null }
                                    }))}
                                  />
                                ) : (
                                  <span className={`text-sm ${a.creditos ? "font-semibold" : "text-red-400"}`}>
                                    {a.creditos?.toFixed(2) || "—"}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {isEditing ? (
                                  <Select
                                    value={String(editData.idTipoAsignatura || 263)}
                                    onValueChange={v => setEditingAsig(prev => ({
                                      ...prev,
                                      [a.id]: { ...prev[a.id], idTipoAsignatura: parseInt(v), tipoAsignatura: v === "263" ? "OBLIGATORIA" : v === "264" ? "OPTATIVA" : v === "265" ? "ELECTIVA" : "COMPLEMENTARIA" }
                                    }))}
                                  >
                                    <SelectTrigger className="h-7 text-xs w-28 mx-auto">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="263">Obligatoria</SelectItem>
                                      <SelectItem value="264">Optativa</SelectItem>
                                      <SelectItem value="265">Electiva</SelectItem>
                                      <SelectItem value="266">Complementaria</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span className="text-xs">{a.tipoAsignatura || "—"}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleSaveAsig(a.id)}>
                                      <Save className="h-3 w-3 text-green-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCancelEdit(a.id)}>
                                      <Trash2 className="h-3 w-3 text-red-400" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditAsig(a)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="otros" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Tabs value={catTab} onValueChange={setCatTab}>
                <TabsList className="flex flex-wrap h-auto gap-1">
                  {CATALOGOS.map(c => (
                    <TabsTrigger key={c.key} value={c.key} className="text-xs">{c.label}</TabsTrigger>
                  ))}
                </TabsList>

                {CATALOGOS.map(c => (
                  <TabsContent key={c.key} value={c.key}>
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {c.label}
                        <Badge variant="outline" className="text-xs">{catItems.length} registros</Badge>
                      </h3>

                      {loadingCat ? (
                        <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></div>
                      ) : (
                        <div className="border rounded-lg max-h-[500px] overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-24">ID SEP</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-center w-20">Estado</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {catItems.map((item, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-mono text-sm font-semibold">{getCodigo(item)}</TableCell>
                                  <TableCell>{item.descripcion || item.nombre || ""}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge className="bg-green-100 text-green-800 text-xs">Activo</Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
