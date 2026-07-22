"use client";

import { useEffect, useState } from "react";

import { Eye, FileText, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import apiClient from "@/services/api-client";
import { getApplicantsList } from "@/services/applicants-service";
import { getGrupos } from "@/services/catalogs-service";
import { getStudentsList } from "@/services/students-service";
import { getAllTeachers } from "@/services/teacher-service";

const BASE = "/plantillas-reporte";

interface Origen {
  clave: string;
  nombre: string;
  descripcion: string;
}

interface VariableCatalogo {
  clave: string;
  descripcion: string;
}

interface EntidadOpcion {
  id: number;
  label: string;
  sublabel: string;
}

const ENTIDAD_LABEL: Record<string, string> = {
  estudiante: "alumno",
  aspirante: "aspirante",
  grupo: "grupo",
  docente: "docente",
};

const ROLES_GENERA = [
  { value: "alumno", label: "Alumno (su propio formato)" },
  { value: "docente", label: "Docente (lo suyo / sus grupos)" },
  { value: "controlescolar", label: "Control Escolar" },
  { value: "director", label: "Director" },
  { value: "coordinador", label: "Coordinador" },
];

const CATEGORIAS = [
  { value: "control_escolar", label: "Control Escolar" },
  { value: "academico", label: "Académico" },
  { value: "admisiones", label: "Admisiones" },
  { value: "docente", label: "Docente" },
  { value: "solicitudes", label: "Solicitudes" },
  { value: "titulacion", label: "Titulación" },
];

const CODIGOS_PREDEFINIDOS = [
  { value: "listado_grupo", label: "Listado por Grupo" },
  { value: "constancia_estudios", label: "Constancia de Estudios" },
  { value: "kardex", label: "Kardex" },
  { value: "boleta_calificaciones", label: "Boleta de Calificaciones" },
  { value: "acta_calificacion", label: "Acta de Calificación" },
  { value: "lista_asistencia", label: "Lista de Asistencia" },
  { value: "horario_grupo", label: "Horario de Grupo" },
  { value: "horario_docente", label: "Horario de Docente" },
  { value: "solicitud_inscripcion_lic", label: "Solicitud Inscripción Licenciatura" },
  { value: "solicitud_inscripcion_esp", label: "Solicitud Inscripción Especialidad" },
  { value: "solicitud_inscripcion_maestria", label: "Solicitud Inscripción Maestría/Doctorado" },
  { value: "solicitud_reinscripcion_lic", label: "Solicitud Reinscripción Licenciatura" },
  { value: "solicitud_reinscripcion_esp", label: "Solicitud Reinscripción Especialidad" },
  { value: "solicitud_reinscripcion_maestria", label: "Solicitud Reinscripción Maestría/Doctorado" },
  { value: "solicitud_cambio_turno", label: "Solicitud de Cambio de Turno" },
  { value: "solicitud_examen", label: "Solicitud Anticipada de Examen" },
  { value: "solicitud_revision", label: "Solicitud de Revisión" },
  { value: "solicitud_materias_recurso", label: "Solicitud Materias en Recurso" },
  { value: "planeacion_docente", label: "Planeación Docente" },
  { value: "custom", label: "Personalizado..." },
];

interface Plantilla {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  categoria: string;
  nombreArchivoOriginal: string;
  origen: string | null;
  rolesGenera: string | null;
  activa: boolean;
  createdAt: string;
}

export default function PlantillasReportePage() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const [nombre, setNombre] = useState("");
  const [codigoSelect, setCodigoSelect] = useState("");
  const [codigoCustom, setCodigoCustom] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [origen, setOrigen] = useState("");
  const [rolesGenera, setRolesGenera] = useState<string[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);

  const [origenes, setOrigenes] = useState<Origen[]>([]);
  const [catalogo, setCatalogo] = useState<VariableCatalogo[]>([]);

  const [genOpen, setGenOpen] = useState(false);
  const [genPlantilla, setGenPlantilla] = useState<Plantilla | null>(null);
  const [genQuery, setGenQuery] = useState("");
  const [genEntidades, setGenEntidades] = useState<EntidadOpcion[]>([]);
  const [genLoading, setGenLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadData(); loadOrigenes(); }, []);

  useEffect(() => {
    if (!origen) { setCatalogo([]); return; }
    apiClient.get<VariableCatalogo[]>(`${BASE}/origenes/${origen}/variables`)
      .then(({ data }) => setCatalogo(data))
      .catch(() => setCatalogo([]));
  }, [origen]);

  const loadOrigenes = async () => {
    try {
      const { data } = await apiClient.get<Origen[]>(`${BASE}/origenes`);
      setOrigenes(data);
    } catch { /* opcional */ }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<Plantilla[]>(BASE);
      setPlantillas(data);
    } catch { toast.error("Error al cargar plantillas"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    const codigo = codigoSelect === "custom" ? codigoCustom : codigoSelect;
    if (!nombre || !codigo || !categoria || !archivo) {
      toast.error("Completa todos los campos y selecciona un archivo");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("codigo", codigo);
      formData.append("categoria", categoria);
      formData.append("descripcion", descripcion);
      if (origen) formData.append("origen", origen);
      if (rolesGenera.length > 0) formData.append("rolesGenera", rolesGenera.join(","));
      formData.append("archivo", archivo);
      await apiClient.post(BASE, formData);
      toast.success("Plantilla creada");
      setModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Error al crear");
    } finally { setSaving(false); }
  };

  const handleReemplazar = async (id: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".docx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("archivo", file);
      try {
        await apiClient.put(`${BASE}/${id}/archivo`, formData);
        toast.success("Archivo actualizado");
        loadData();
      } catch { toast.error("Error al actualizar"); }
    };
    input.click();
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    try {
      await apiClient.delete(`${BASE}/${id}`);
      toast.success("Plantilla eliminada");
      loadData();
    } catch { toast.error("Error al eliminar"); }
  };

  const handlePreview = async (plantilla: Plantilla, conDatos: boolean) => {
    setPreviewLoading(true);
    setPreviewTitle(plantilla.nombre + (conDatos ? " (con datos)" : " (plantilla)"));
    setPreviewUrl(null);
    try {
      const endpoint = conDatos ? `${BASE}/preview/${plantilla.codigo}` : `${BASE}/preview-original/${plantilla.codigo}`;
      const { data } = await apiClient.get(endpoint, { responseType: "arraybuffer" });
      const base64 = btoa(new Uint8Array(data).reduce((d, byte) => d + String.fromCharCode(byte), ""));
      setPreviewUrl(`data:application/pdf;base64,${base64}`);
    } catch (err: any) {
      toast.error("Error al generar preview");
    } finally { setPreviewLoading(false); }
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewLoading(false);
  };

  const handleDescargarDocx = async (plantilla: Plantilla) => {
    try {
      const { data } = await apiClient.post(`${BASE}/generar/${plantilla.codigo}`, {
        variables: {},
        tablas: null,
      }, { responseType: "blob" });
      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${plantilla.codigo}_ejemplo.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error("Error al descargar"); }
  };

  const resetForm = () => {
    setNombre(""); setCodigoSelect(""); setCodigoCustom("");
    setCategoria(""); setDescripcion(""); setOrigen(""); setRolesGenera([]); setArchivo(null);
  };

  const toggleRol = (rol: string) => {
    setRolesGenera((prev) => (prev.includes(rol) ? prev.filter((r) => r !== rol) : [...prev, rol]));
  };

  const abrirGenerar = (p: Plantilla) => {
    setGenPlantilla(p);
    setGenQuery("");
    setGenEntidades([]);
    setGenOpen(true);
  };

  const buscarEntidades = async () => {
    if (!genPlantilla?.origen) return;
    setGenLoading(true);
    try {
      const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
      const q = norm(genQuery);
      let opciones: EntidadOpcion[] = [];

      if (genPlantilla.origen === "estudiante") {
        const r = await getStudentsList(1, 100000);
        opciones = (r.items ?? []).map((e) => ({ id: e.idEstudiante, label: e.nombreCompleto, sublabel: e.matricula }));
      } else if (genPlantilla.origen === "aspirante") {
        const r = await getApplicantsList({ page: 1, pageSize: 100000, filter: genQuery || undefined });
        opciones = ((r as any).items ?? []).map((a: any) => ({ id: a.idAspirante, label: a.nombreCompleto, sublabel: `ASP-${a.idAspirante}` }));
      } else if (genPlantilla.origen === "grupo") {
        const r = await getGrupos();
        opciones = r.map((g) => ({ id: g.idGrupo, label: g.codigoGrupo || g.nombreGrupo, sublabel: `${(g as any).nombrePlanEstudios ?? ""} · Cuatri ${g.numeroCuatrimestre}` }));
      } else if (genPlantilla.origen === "docente") {
        const r = await getAllTeachers(1, 2000);
        opciones = ((r as any).items ?? []).map((t: any) => ({ id: t.idProfesor, label: t.nombreCompleto, sublabel: t.correo ?? "" }));
      }

      const filtradas = opciones.filter((o) => !q || norm(o.label).includes(q) || norm(o.sublabel).includes(q)).slice(0, 60);
      setGenEntidades(filtradas);
    } catch {
      toast.error("Error al buscar");
    } finally {
      setGenLoading(false);
    }
  };

  const generarEntidad = async (id: number) => {
    if (!genPlantilla) return;
    setGenerating(true);
    try {
      const { data } = await apiClient.post(
        `${BASE}/${genPlantilla.codigo}/generar-entidad/${id}`,
        null,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${genPlantilla.codigo}_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Formato generado");
      setGenOpen(false);
    } catch (err: any) {
      const blob = err?.response?.data;
      let msg = "Error al generar el formato";
      if (blob instanceof Blob) {
        try { msg = JSON.parse(await blob.text())?.error || msg; } catch { /* noop */ }
      }
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            Plantillas de Reportes
          </h1>
          <p className="text-muted-foreground mt-1">
            Sube archivos Word (.docx) o Excel (.xlsx) como plantillas, previsualiza con datos de ejemplo y actívalas
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Plantilla
        </Button>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            <strong>Variables disponibles:</strong> Usa <code className="bg-blue-100 px-1 rounded">{"{{variable}}"}</code> en el Word.
            Ejemplos: <code className="bg-blue-100 px-1 rounded">{"{{carrera}}"}</code>, <code className="bg-blue-100 px-1 rounded">{"{{matricula}}"}</code>, <code className="bg-blue-100 px-1 rounded">{"{{nombre_alumno}}"}</code>.
            Para tablas dinámicas, coloca las variables en una fila de la tabla: <code className="bg-blue-100 px-1 rounded">{"{{tabla_estudiantes}}"}</code> con <code className="bg-blue-100 px-1 rounded">{"{{matricula}}"}</code> <code className="bg-blue-100 px-1 rounded">{"{{estatus}}"}</code> <code className="bg-blue-100 px-1 rounded">{"{{nombre}}"}</code> en cada celda.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plantillas Configuradas</CardTitle>
          <CardDescription>{plantillas.length} plantilla(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" /></div>
          ) : plantillas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium">No hay plantillas configuradas</p>
              <p className="text-sm mt-1">Sube tu primer archivo .docx o .xlsx</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plantillas.map((p) => (
                <div key={p.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{p.nombre}</h4>
                        <Badge variant="outline" className="text-xs">{p.categoria}</Badge>
                        <Badge className={p.activa ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                          {p.activa ? "Activa" : "Inactiva"}
                        </Badge>
                        {p.origen && (
                          <Badge className="bg-indigo-100 text-indigo-800 text-xs">Origen: {p.origen}</Badge>
                        )}
                        {p.rolesGenera && (
                          <Badge className="bg-amber-100 text-amber-800 text-xs">Genera: {p.rolesGenera}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Código: <code className="bg-gray-100 px-1 rounded">{p.codigo}</code> — Archivo: {p.nombreArchivoOriginal}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {p.origen && (
                      <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => abrirGenerar(p)} title="Generar de prueba con datos reales (para desarrollar el formato)">
                        <FileText className="h-3 w-3" /> Generar (prueba)
                      </Button>
                    )}
                    <Link href={`/dashboard/plantillas-reporte/editor?id=${p.id}`}>
                      <Button variant="default" size="sm" className="gap-1">
                        <Pencil className="h-3 w-3" /> Editar en línea
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => handlePreview(p, false)}>
                      <Eye className="h-3 w-3" /> Ver Plantilla
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => handlePreview(p, true)}>
                      <Eye className="h-3 w-3" /> Preview con Datos
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => handleReemplazar(p.id)}>
                      <Upload className="h-3 w-3" /> Reemplazar
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEliminar(p.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(previewUrl !== null || previewLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closePreview}>
          <div
            className="bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden"
            style={{ width: "80vw", height: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                <h3 className="font-semibold">{previewTitle}</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={closePreview}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              {previewLoading ? (
                <div className="text-center py-20"><Loader2 className="h-10 w-10 animate-spin mx-auto text-gray-400" /><p className="mt-4 text-gray-500">Convirtiendo documento a PDF...</p></div>
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="Preview del documento"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Plantilla</DialogTitle>
            <DialogDescription>Sube un archivo Word (.docx) o Excel (.xlsx) con las variables del reporte</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Listado por Grupo" />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Reporte *</Label>
              <Select value={codigoSelect} onValueChange={(v) => { setCodigoSelect(v); if (v !== "custom") { const found = CODIGOS_PREDEFINIDOS.find(c => c.value === v); if (found && !nombre) setNombre(found.label); } }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {CODIGOS_PREDEFINIDOS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {codigoSelect === "custom" && (
              <div className="space-y-2">
                <Label>Código personalizado *</Label>
                <Input value={codigoCustom} onChange={(e) => setCodigoCustom(e.target.value.toLowerCase().replace(/\s/g, "_"))} placeholder="mi_reporte" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Origen de datos (autollenado)</Label>
              <Select value={origen} onValueChange={setOrigen}>
                <SelectTrigger><SelectValue placeholder="Sin origen (formato en blanco)" /></SelectTrigger>
                <SelectContent>
                  {origenes.map((o) => <SelectItem key={o.clave} value={o.clave}>{o.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
              {catalogo.length > 0 && (
                <div className="rounded-md border bg-muted/30 p-2 max-h-40 overflow-auto">
                  <p className="text-xs text-muted-foreground mb-1">
                    Variables disponibles — cópialas a tu Word como <code className="bg-muted px-1 rounded">{"{{clave}}"}</code>:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {catalogo.map((v) => (
                      <Badge key={v.clave} variant="outline" className="text-[10px] font-mono" title={v.descripcion}>
                        {`{{${v.clave}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {origen && (
              <div className="space-y-2">
                <Label>¿Quién puede generar este formato?</Label>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-2">
                  {ROLES_GENERA.map((r) => (
                    <label key={r.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={rolesGenera.includes(r.value)}
                        onChange={() => toggleRol(r.value)}
                        className="h-4 w-4"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Define qué roles pueden generarlo en su pantalla (ej. el alumno desde su panel genera solo el suyo).
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Archivo (.docx o .xlsx) *</Label>
              <Input type="file" accept=".docx,.xlsx,.xls" onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Plantilla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generar de prueba</DialogTitle>
            <DialogDescription>
              {genPlantilla?.nombre} — busca un {ENTIDAD_LABEL[genPlantilla?.origen ?? ""] ?? "registro"} de prueba para verificar el formato con datos reales.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={genQuery}
                onChange={(e) => setGenQuery(e.target.value)}
                placeholder={`Buscar ${ENTIDAD_LABEL[genPlantilla?.origen ?? ""] ?? ""} (nombre o clave)`}
                onKeyDown={(e) => e.key === "Enter" && buscarEntidades()}
              />
              <Button onClick={buscarEntidades} disabled={genLoading}>
                {genLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
            </div>
            <div className="max-h-72 divide-y overflow-auto rounded-md border">
              {genEntidades.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Busca un {ENTIDAD_LABEL[genPlantilla?.origen ?? ""] ?? "registro"} para generar el formato de prueba
                </p>
              ) : (
                genEntidades.map((e) => (
                  <button
                    key={e.id}
                    disabled={generating}
                    onClick={() => generarEntidad(e.id)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted/50 disabled:opacity-50"
                  >
                    <span>
                      <span className="font-medium">{e.label}</span>
                      {e.sublabel && <span className="ml-2 font-mono text-xs text-muted-foreground">{e.sublabel}</span>}
                    </span>
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-emerald-600" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
