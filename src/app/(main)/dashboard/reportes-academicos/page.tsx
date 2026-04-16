"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

import {
  BookOpen,
  Briefcase,
  ClipboardList,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Loader2,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  descargarEstudiantesGrupoPdf,
  descargarEstudiantesGrupoExcel,
  descargarBoletaPdf,
  descargarActaPdf,
  descargarHorarioGrupoPdf,
  descargarHorarioGrupoExcel,
  descargarHorarioDocentePdf,
  descargarHorarioDocenteExcel,
  descargarListaAsistenciaPdf,
  descargarPlanesEstudioExcel,
  descargarReporteBajasPdf,
  descargarReporteBajasExcel,
  getReporteBajas,
  descargarBlob,
  getGrupos,
  getPeriodosAcademicos,
  getGrupoMaterias,
  getParciales,
  getProfesores,
  getEstudiantes,
} from "@/services/reportes-academicos-service";
import { getAllTeachers } from "@/services/teacher-service";
import { buscarEstudiantes } from "@/services/estudiante-panel-service";
import { getCampusList } from "@/services/campus-service";
import { getStudyPlansList } from "@/services/study-plans-service";
import { getGroups, getGroupSubjects } from "@/services/groups-service";
import type { Teacher } from "@/types/teacher";
import type { EstudianteListaDto } from "@/types/estudiante-panel";

interface PeriodoAcademico {
  idPeriodoAcademico: number;
  nombre: string;
  esPeriodoActual: boolean;
}

interface CampusItem {
  idCampus: number;
  nombre: string;
}

interface PlanEstudioItem {
  idPlanEstudios: number;
  nombrePlanEstudios: string;
}

interface GrupoItem {
  idGrupo: number;
  nombreGrupo: string;
  planEstudios?: string;
  idPlanEstudios?: number;
}

interface GrupoMateriaItem {
  idGrupoMateria: number;
  materia?: string;
  nombre?: string;
}

interface ParcialItem {
  id: number;
  name: string;
}

interface ProfesorItem {
  idProfesor: number;
  nombre?: string;
  noEmpleado?: string;
  persona?: { nombre: string; apellidoPaterno: string };
}

interface EstudianteItem {
  idEstudiante: number;
  matricula: string;
  nombreCompleto?: string;
  planEstudios?: string;
  email?: string;
  telefono?: string;
  persona?: { nombre: string; apellidoPaterno: string; apellidoMaterno: string };
}

interface DocenteMateriaItem {
  grupo: string;
  materia: string;
  docente: string;
  aula: string;
}

export default function ReportesAcademicosPage() {
  // ─── Catálogos ───
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
  const [grupos, setGrupos] = useState<GrupoItem[]>([]);
  const [grupoMaterias, setGrupoMaterias] = useState<GrupoMateriaItem[]>([]);
  const [parciales, setParciales] = useState<ParcialItem[]>([]);
  const [profesores, setProfesores] = useState<ProfesorItem[]>([]);
  const [estudiantes, setEstudiantes] = useState<EstudianteItem[]>([]);

  // ─── Selecciones ───
  const [selectedPeriodo, setSelectedPeriodo] = useState("");
  const [selectedGrupo, setSelectedGrupo] = useState("");
  const [selectedGrupoMateria, setSelectedGrupoMateria] = useState("");
  const [selectedParcial, setSelectedParcial] = useState("");
  const [selectedProfesor, setSelectedProfesor] = useState("");
  const [selectedEstudiante, setSelectedEstudiante] = useState("");

  // ─── Filtros boleta ───
  const [boletaCampus, setBoletaCampus] = useState("");
  const [boletaPlan, setBoletaPlan] = useState("");
  const [boletaGrupo, setBoletaGrupo] = useState("");
  const [boletaPlanes, setBoletaPlanes] = useState<PlanEstudioItem[]>([]);
  const [boletaGrupos, setBoletaGrupos] = useState<GrupoItem[]>([]);
  const [boletaEstudiantes, setBoletaEstudiantes] = useState<EstudianteItem[]>([]);
  const [boletaSearch, setBoletaSearch] = useState("");

  // ─── Filtros cascada ───
  const [campusList, setCampusList] = useState<CampusItem[]>([]);
  const [planesList, setPlanesList] = useState<PlanEstudioItem[]>([]);
  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedPlanEstudios, setSelectedPlanEstudios] = useState("");

  // Sub-tabs for horarios
  const [horarioTab, setHorarioTab] = useState("grupo");

  // ─── Tabs nuevos ───
  const [activeTab, setActiveTab] = useState("estudiantes");
  const [allStudents, setAllStudents] = useState<EstudianteListaDto[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [docentesMaterias, setDocentesMaterias] = useState<DocenteMateriaItem[]>([]);
  const [loadingAllStudents, setLoadingAllStudents] = useState(false);
  const [loadingAllTeachers, setLoadingAllTeachers] = useState(false);
  const [loadingDocentesMaterias, setLoadingDocentesMaterias] = useState(false);
  const [searchAlumnos, setSearchAlumnos] = useState("");
  const [searchProfesores, setSearchProfesores] = useState("");
  const [searchDocentesMaterias, setSearchDocentesMaterias] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reporteBajas, setReporteBajas] = useState<any>(null);
  const [loadingBajas, setLoadingBajas] = useState(false);
  const [bajaCampusFilter, setBajaCampusFilter] = useState("");
  const [bajaPlanFilter, setBajaPlanFilter] = useState("");

  const [bajaMesFilter, setBajaMesFilter] = useState("");
  const [bajaSubTab, setBajaSubTab] = useState("academico");
  const [bajaPlanesFiltered, setBajaPlanesFiltered] = useState<PlanEstudioItem[]>([]);

  // ─── Loading states ───
  const [loading, setLoading] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  // ─── Load catálogos on mount ───
  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        const [periodosRes, parcialesRes, profesoresRes, campusRes, planesRes] = await Promise.all([
          getPeriodosAcademicos(),
          getParciales(),
          getProfesores(),
          getCampusList(),
          getStudyPlansList(),
        ]);
        setPeriodos(Array.isArray(periodosRes) ? periodosRes : periodosRes?.items ?? periodosRes?.data ?? []);
        setParciales(Array.isArray(parcialesRes) ? parcialesRes : parcialesRes?.items ?? []);
        setProfesores(Array.isArray(profesoresRes) ? profesoresRes : profesoresRes?.items ?? profesoresRes?.data ?? []);
        setCampusList(Array.isArray(campusRes) ? campusRes : campusRes?.items ?? []);
        setPlanesList(planesRes?.items ?? []);
      } catch {
        toast.error("Error al cargar catálogos");
      } finally {
        setLoadingCatalogos(false);
      }
    };
    loadCatalogos();
  }, []);

  useEffect(() => {
    setBajaPlanFilter("");
    if (!bajaCampusFilter || bajaCampusFilter === "todos") {
      setBajaPlanesFiltered(planesList);
      return;
    }
    const load = async () => {
      try {
        const res = await getStudyPlansList({ idCampus: Number(bajaCampusFilter) });
        setBajaPlanesFiltered(res.items ?? []);
      } catch {
        setBajaPlanesFiltered([]);
      }
    };
    load();
  }, [bajaCampusFilter, planesList]);

  // ─── Load grupos when periodo changes ───
  useEffect(() => {
    if (!selectedPeriodo) return;
    const loadGrupos = async () => {
      try {
        const res = await getGrupos(Number(selectedPeriodo));
        setGrupos(Array.isArray(res) ? res : res?.items ?? res?.data ?? []);
      } catch {
        toast.error("Error al cargar grupos");
      }
    };
    loadGrupos();
  }, [selectedPeriodo]);

  // ─── Load grupo materias when grupo changes ───
  useEffect(() => {
    if (!selectedGrupo) return;
    const load = async () => {
      try {
        const res = await getGrupoMaterias(Number(selectedGrupo));
        setGrupoMaterias(Array.isArray(res) ? res : res?.items ?? []);
      } catch {
        toast.error("Error al cargar materias del grupo");
      }
    };
    load();
  }, [selectedGrupo]);

  // ─── Boleta: cargar planes cuando cambia campus ───
  useEffect(() => {
    setBoletaPlan("");
    setBoletaGrupo("");
    setBoletaEstudiantes([]);
    setSelectedEstudiante("");
    if (!boletaCampus) { setBoletaPlanes([]); return; }
    const load = async () => {
      try {
        const res = await getStudyPlansList({ idCampus: Number(boletaCampus) });
        setBoletaPlanes(res.items ?? []);
      } catch { setBoletaPlanes([]); }
    };
    load();
  }, [boletaCampus]);

  // ─── Boleta: cargar grupos cuando cambia plan ───
  useEffect(() => {
    setBoletaGrupo("");
    setBoletaEstudiantes([]);
    setSelectedEstudiante("");
    if (!boletaPlan || !selectedPeriodo) { setBoletaGrupos([]); return; }
    const load = async () => {
      try {
        const res = await getGrupos(Number(selectedPeriodo));
        const all = Array.isArray(res) ? res : res?.items ?? res?.data ?? [];
        const planId = Number(boletaPlan);
        const plan = boletaPlanes.find((p) => p.idPlanEstudios === planId);
        setBoletaGrupos(all.filter((g: GrupoItem) => g.idPlanEstudios === planId || g.planEstudios === plan?.nombrePlanEstudios));
      } catch { setBoletaGrupos([]); }
    };
    load();
  }, [boletaPlan, selectedPeriodo]);

  // ─── Boleta: cargar estudiantes cuando cambia grupo ───
  useEffect(() => {
    setSelectedEstudiante("");
    setBoletaSearch("");
    if (!boletaGrupo) { setBoletaEstudiantes([]); return; }
    const load = async () => {
      try {
        const grupoId = Number(boletaGrupo);
        const { default: apiClient } = await import("@/services/api-client");
        const { data: grupoData } = await apiClient.get(`/grupos/${grupoId}/estudiantes`);
        const estGrupo = grupoData.estudiantes ?? grupoData ?? [];
        const mapped: EstudianteItem[] = estGrupo.map((e: any) => ({
          idEstudiante: e.idEstudiante,
          matricula: e.matricula ?? "",
          nombreCompleto: e.nombreCompleto ?? "",
        }));
        setBoletaEstudiantes(mapped);
      } catch {
        setBoletaEstudiantes([]);
      }
    };
    load();
  }, [boletaGrupo]);

  useEffect(() => {
    if (activeTab !== "todos-alumnos" || allStudents.length > 0) return;
    const load = async () => {
      setLoadingAllStudents(true);
      try {
        const res = await buscarEstudiantes({ pagina: 1, tamanoPagina: 5000 });
        setAllStudents(res.estudiantes ?? []);
      } catch {
        toast.error("Error al cargar estudiantes");
      } finally {
        setLoadingAllStudents(false);
      }
    };
    load();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "todos-profesores" || allTeachers.length > 0) return;
    const load = async () => {
      setLoadingAllTeachers(true);
      try {
        const res = await getAllTeachers(1, 5000);
        setAllTeachers(res.items ?? []);
      } catch {
        toast.error("Error al cargar profesores");
      } finally {
        setLoadingAllTeachers(false);
      }
    };
    load();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "docentes-materia" || !selectedPeriodo) return;
    setDocentesMaterias([]);
    const load = async () => {
      setLoadingDocentesMaterias(true);
      try {
        const gruposRes = await getGroups(1, 500, Number(selectedPeriodo));
        const gruposList = gruposRes.items ?? [];
        const allMaterias: DocenteMateriaItem[] = [];
        for (const grupo of gruposList) {
          try {
            const materias = await getGroupSubjects(grupo.idGrupo);
            for (const m of materias) {
              allMaterias.push({
                grupo: grupo.nombreGrupo,
                materia: m.nombreMateria,
                docente: m.nombreProfesor ?? "Sin asignar",
                aula: m.aula ?? "Sin asignar",
              });
            }
          } catch { /* skip */ }
        }
        setDocentesMaterias(allMaterias);
      } catch {
        toast.error("Error al cargar docentes por materia");
      } finally {
        setLoadingDocentesMaterias(false);
      }
    };
    load();
  }, [activeTab, selectedPeriodo]);

  // ─── Load planes de estudio when campus changes ───
  useEffect(() => {
    setSelectedPlanEstudios("");
    if (!selectedCampus) {
      setPlanesList([]);
      return;
    }
    const load = async () => {
      try {
        const res = await getStudyPlansList({ idCampus: Number(selectedCampus) });
        setPlanesList(res.items ?? []);
      } catch {
        toast.error("Error al cargar planes de estudio");
      }
    };
    load();
  }, [selectedCampus]);

  // ─── Filtered grupos by plan de estudios ───
  const gruposFiltrados = useMemo(() => {
    if (!selectedPlanEstudios) return grupos;
    const planId = Number(selectedPlanEstudios);
    const plan = planesList.find((p) => p.idPlanEstudios === planId);
    if (!plan) return grupos;
    return grupos.filter(
      (g) =>
        g.idPlanEstudios === planId ||
        g.planEstudios === plan.nombrePlanEstudios
    );
  }, [grupos, selectedPlanEstudios, planesList]);

  const getNombreEstudiante = (est: EstudianteItem) => {
    if (est.persona) return `${est.matricula} - ${est.persona.nombre} ${est.persona.apellidoPaterno} ${est.persona.apellidoMaterno ?? ""}`.trim();
    if (est.nombreCompleto) return `${est.matricula} - ${est.nombreCompleto}`;
    return est.matricula;
  };

  const boletaEstudiantesFiltrados = useMemo(() => {
    if (!boletaSearch.trim()) return boletaEstudiantes;
    const term = boletaSearch.toLowerCase();
    return boletaEstudiantes.filter((e) => {
      const nombre = getNombreEstudiante(e).toLowerCase();
      return nombre.includes(term);
    });
  }, [boletaEstudiantes, boletaSearch]);

  const exportToCSV = (rows: Record<string, string>[], filename: string) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map(row => headers.map(h => `"${(row[h] ?? "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    descargarBlob(blob, filename);
  };

  // ─── Download handler ───
  const handleDownload = async (fn: () => Promise<Blob>, filename: string) => {
    setLoading(true);
    try {
      const blob = await fn();
      descargarBlob(blob, filename);
      toast.success("Archivo descargado exitosamente");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al generar el reporte";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fechaActual = new Date().toISOString().slice(0, 10);

  const getNombreProfesor = (prof: ProfesorItem) => {
    if (prof.persona) return `${prof.persona.nombre} ${prof.persona.apellidoPaterno}`;
    return prof.nombre ?? prof.noEmpleado ?? `Profesor ${prof.idProfesor}`;
  };



  if (loadingCatalogos) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2">Cargando catálogos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="w-6 h-6" />
          Reportes Académicos
        </h1>
        <p className="text-muted-foreground">
          Genera reportes de estudiantes, calificaciones, horarios y más.
        </p>
      </div>

      {/* Selector de periodo global */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-sm">
              <Label>Periodo Académico</Label>
              <Select value={selectedPeriodo} onValueChange={(v) => { setSelectedPeriodo(v); setSelectedGrupo(""); setSelectedGrupoMateria(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar periodo..." />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((p) => (
                    <SelectItem key={p.idPeriodoAcademico} value={p.idPeriodoAcademico.toString()}>
                      {p.nombre} {p.esPeriodoActual && "(Actual)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="estudiantes" className="flex items-center gap-1">
            <Users className="w-4 h-4" /> Estudiantes
          </TabsTrigger>
          <TabsTrigger value="boleta" className="flex items-center gap-1">
            <FileText className="w-4 h-4" /> Boleta
          </TabsTrigger>
          <TabsTrigger value="acta" className="flex items-center gap-1">
            <ClipboardList className="w-4 h-4" /> Acta
          </TabsTrigger>
          <TabsTrigger value="horarios" className="flex items-center gap-1">
            <Clock className="w-4 h-4" /> Horarios
          </TabsTrigger>
          <TabsTrigger value="asistencia" className="flex items-center gap-1">
            <ClipboardList className="w-4 h-4" /> Asistencia
          </TabsTrigger>
          <TabsTrigger value="planes" className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" /> Planes
          </TabsTrigger>
          <TabsTrigger value="todos-alumnos" className="flex items-center gap-1">
            <GraduationCap className="w-4 h-4" /> Todos los Alumnos
          </TabsTrigger>
          <TabsTrigger value="todos-profesores" className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" /> Todos los Profesores
          </TabsTrigger>
          <TabsTrigger value="docentes-materia" className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" /> Docentes por Materia
          </TabsTrigger>
          <TabsTrigger value="bajas" className="flex items-center gap-1">
            <UserX className="w-4 h-4" /> Bajas
          </TabsTrigger>
        </TabsList>

        {/* ────── TAB 1: Estudiantes por Grupo ────── */}
        <TabsContent value="estudiantes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estudiantes por Grupo</CardTitle>
              <CardDescription>Lista de estudiantes inscritos en un grupo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Campus</Label>
                  <Select
                    value={selectedCampus}
                    onValueChange={(v) => {
                      setSelectedCampus(v);
                      setSelectedPlanEstudios("");
                      setSelectedGrupo("");
                    }}
                    disabled={!selectedPeriodo}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedPeriodo ? "Seleccionar campus..." : "Primero selecciona un periodo"} />
                    </SelectTrigger>
                    <SelectContent>
                      {campusList.map((c) => (
                        <SelectItem key={c.idCampus} value={c.idCampus.toString()}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Plan de Estudios</Label>
                  <Select
                    value={selectedPlanEstudios}
                    onValueChange={(v) => {
                      setSelectedPlanEstudios(v);
                      setSelectedGrupo("");
                    }}
                    disabled={!selectedCampus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCampus ? "Seleccionar plan..." : "Primero selecciona un campus"} />
                    </SelectTrigger>
                    <SelectContent>
                      {planesList.map((p) => (
                        <SelectItem key={p.idPlanEstudios} value={p.idPlanEstudios.toString()}>
                          {p.nombrePlanEstudios}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Grupo</Label>
                  <Select value={selectedGrupo} onValueChange={setSelectedGrupo} disabled={!selectedPlanEstudios}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedPlanEstudios ? "Seleccionar grupo..." : "Primero selecciona un plan"} />
                    </SelectTrigger>
                    <SelectContent>
                      {gruposFiltrados.map((g) => (
                        <SelectItem key={g.idGrupo} value={g.idGrupo.toString()}>
                          {g.nombreGrupo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  disabled={!selectedGrupo || loading}
                  onClick={() => handleDownload(
                    () => descargarEstudiantesGrupoPdf(Number(selectedGrupo)),
                    `Estudiantes_Grupo_${fechaActual}.pdf`
                  )}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  Descargar PDF
                </Button>
                <Button
                  variant="outline"
                  disabled={!selectedGrupo || loading}
                  onClick={() => handleDownload(
                    () => descargarEstudiantesGrupoExcel(Number(selectedGrupo)),
                    `Estudiantes_Grupo_${fechaActual}.xlsx`
                  )}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                  Descargar Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────── TAB 2: Boleta de Calificaciones ────── */}
        <TabsContent value="boleta">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Boleta de Calificaciones</CardTitle>
              <CardDescription>Calificaciones parciales y finales del estudiante en el periodo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Campus</Label>
                  <Select
                    value={boletaCampus}
                    onValueChange={(v) => { setBoletaCampus(v); }}
                    disabled={!selectedPeriodo}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedPeriodo ? "Seleccionar campus..." : "Primero selecciona un periodo"} />
                    </SelectTrigger>
                    <SelectContent>
                      {campusList.map((c) => (
                        <SelectItem key={c.idCampus} value={c.idCampus.toString()}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Plan de Estudios</Label>
                  <Select
                    value={boletaPlan}
                    onValueChange={(v) => { setBoletaPlan(v); }}
                    disabled={!boletaCampus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={boletaCampus ? "Seleccionar plan..." : "Primero selecciona un campus"} />
                    </SelectTrigger>
                    <SelectContent>
                      {boletaPlanes.map((p) => (
                        <SelectItem key={p.idPlanEstudios} value={p.idPlanEstudios.toString()}>
                          {p.nombrePlanEstudios}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Grupo</Label>
                  <Select
                    value={boletaGrupo}
                    onValueChange={(v) => { setBoletaGrupo(v); }}
                    disabled={!boletaPlan}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={boletaPlan ? "Seleccionar grupo..." : "Primero selecciona un plan"} />
                    </SelectTrigger>
                    <SelectContent>
                      {boletaGrupos.map((g) => (
                        <SelectItem key={g.idGrupo} value={g.idGrupo.toString()}>
                          {g.nombreGrupo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {boletaGrupo && (
                <div className="space-y-3">
                  <div className="max-w-md">
                    <Label>Buscar alumno</Label>
                    <Input
                      placeholder="Buscar por nombre o matrícula..."
                      value={boletaSearch}
                      onChange={(e) => setBoletaSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-w-md">
                    <Label>Estudiante</Label>
                    <Select value={selectedEstudiante} onValueChange={setSelectedEstudiante}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estudiante..." />
                      </SelectTrigger>
                      <SelectContent>
                        {boletaEstudiantesFiltrados.map((e) => (
                          <SelectItem key={e.idEstudiante} value={e.idEstudiante.toString()}>
                            {getNombreEstudiante(e)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button
                disabled={!selectedEstudiante || !selectedPeriodo || loading}
                onClick={() => handleDownload(
                  () => descargarBoletaPdf(Number(selectedEstudiante), Number(selectedPeriodo)),
                  `Boleta_${fechaActual}.pdf`
                )}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Generar Boleta PDF
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────── TAB 3: Acta de Calificación ────── */}
        <TabsContent value="acta">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acta de Calificación</CardTitle>
              <CardDescription>Acta oficial de calificaciones por materia y parcial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Grupo</Label>
                  <Select value={selectedGrupo} onValueChange={setSelectedGrupo} disabled={!selectedPeriodo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Grupo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {grupos.map((g) => (
                        <SelectItem key={g.idGrupo} value={g.idGrupo.toString()}>
                          {g.nombreGrupo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Materia</Label>
                  <Select value={selectedGrupoMateria} onValueChange={setSelectedGrupoMateria} disabled={!selectedGrupo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Materia..." />
                    </SelectTrigger>
                    <SelectContent>
                      {grupoMaterias.map((gm) => (
                        <SelectItem key={gm.idGrupoMateria} value={gm.idGrupoMateria.toString()}>
                          {gm.materia ?? gm.nombre ?? `Materia ${gm.idGrupoMateria}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Parcial (opcional)</Label>
                  <Select value={selectedParcial} onValueChange={setSelectedParcial}>
                    <SelectTrigger>
                      <SelectValue placeholder="Final (todos)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Final (todos)</SelectItem>
                      {parciales.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                disabled={!selectedGrupoMateria || loading}
                onClick={() => handleDownload(
                  () => descargarActaPdf(
                    Number(selectedGrupoMateria),
                    selectedParcial && selectedParcial !== "0" ? Number(selectedParcial) : undefined
                  ),
                  `Acta_${fechaActual}.pdf`
                )}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Generar Acta PDF
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────── TAB 4: Horarios ────── */}
        <TabsContent value="horarios">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Horarios</CardTitle>
              <CardDescription>Horarios de grupo o docente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={horarioTab} onValueChange={setHorarioTab}>
                <TabsList>
                  <TabsTrigger value="grupo">Horario de Grupo</TabsTrigger>
                  <TabsTrigger value="docente">Horario de Docente</TabsTrigger>
                </TabsList>

                <TabsContent value="grupo" className="space-y-4 pt-4">
                  <div className="max-w-sm">
                    <Label>Grupo</Label>
                    <Select value={selectedGrupo} onValueChange={setSelectedGrupo} disabled={!selectedPeriodo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar grupo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {grupos.map((g) => (
                          <SelectItem key={g.idGrupo} value={g.idGrupo.toString()}>
                            {g.nombreGrupo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      disabled={!selectedGrupo || loading}
                      onClick={() => handleDownload(
                        () => descargarHorarioGrupoPdf(Number(selectedGrupo)),
                        `Horario_Grupo_${fechaActual}.pdf`
                      )}
                    >
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!selectedGrupo || loading}
                      onClick={() => handleDownload(
                        () => descargarHorarioGrupoExcel(Number(selectedGrupo)),
                        `Horario_Grupo_${fechaActual}.xlsx`
                      )}
                    >
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                      Excel
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="docente" className="space-y-4 pt-4">
                  <div className="max-w-sm">
                    <Label>Docente</Label>
                    <Select value={selectedProfesor} onValueChange={setSelectedProfesor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar docente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {profesores.map((p) => (
                          <SelectItem key={p.idProfesor} value={p.idProfesor.toString()}>
                            {getNombreProfesor(p)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      disabled={!selectedProfesor || !selectedPeriodo || loading}
                      onClick={() => handleDownload(
                        () => descargarHorarioDocentePdf(Number(selectedProfesor), Number(selectedPeriodo)),
                        `Horario_Docente_${fechaActual}.pdf`
                      )}
                    >
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!selectedProfesor || !selectedPeriodo || loading}
                      onClick={() => handleDownload(
                        () => descargarHorarioDocenteExcel(Number(selectedProfesor), Number(selectedPeriodo)),
                        `Horario_Docente_${fechaActual}.xlsx`
                      )}
                    >
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                      Excel
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────── TAB 5: Lista de Asistencia ────── */}
        <TabsContent value="asistencia">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lista de Asistencia</CardTitle>
              <CardDescription>Lista imprimible para pase de asistencia en aula</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Grupo</Label>
                  <Select value={selectedGrupo} onValueChange={setSelectedGrupo} disabled={!selectedPeriodo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Grupo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {grupos.map((g) => (
                        <SelectItem key={g.idGrupo} value={g.idGrupo.toString()}>
                          {g.nombreGrupo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Materia</Label>
                  <Select value={selectedGrupoMateria} onValueChange={setSelectedGrupoMateria} disabled={!selectedGrupo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Materia..." />
                    </SelectTrigger>
                    <SelectContent>
                      {grupoMaterias.map((gm) => (
                        <SelectItem key={gm.idGrupoMateria} value={gm.idGrupoMateria.toString()}>
                          {gm.materia ?? gm.nombre ?? `Materia ${gm.idGrupoMateria}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                disabled={!selectedGrupoMateria || loading}
                onClick={() => handleDownload(
                  () => descargarListaAsistenciaPdf(Number(selectedGrupoMateria)),
                  `ListaAsistencia_${fechaActual}.pdf`
                )}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Generar Lista PDF
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────── TAB 6: Planes de Estudio ────── */}
        <TabsContent value="planes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Planes de Estudio</CardTitle>
              <CardDescription>Exportar malla curricular de todos los planes activos</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                disabled={loading}
                variant="outline"
                onClick={() => handleDownload(
                  () => descargarPlanesEstudioExcel(),
                  `PlanesEstudio_${fechaActual}.xlsx`
                )}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
                Exportar Excel
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────── TAB 7: Todos los Alumnos ────── */}
        <TabsContent value="todos-alumnos">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Todos los Alumnos</CardTitle>
              <CardDescription>Listado completo de alumnos registrados ({allStudents.length})</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Buscar por matrícula, nombre o plan..."
                  value={searchAlumnos}
                  onChange={(e) => setSearchAlumnos(e.target.value)}
                  className="max-w-sm"
                />
                <Button
                  variant="outline"
                  disabled={allStudents.length === 0}
                  onClick={() => exportToCSV(
                    allStudents.map(s => ({
                      Matricula: s.matricula,
                      Nombre: s.nombreCompleto,
                      Grupo: s.grupo ?? "",
                      "Plan de Estudios": s.planEstudios ?? "",
                      Email: s.email ?? "",
                      Telefono: s.telefono ?? "",
                    })),
                    `Todos_Alumnos_${fechaActual}.csv`
                  )}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>

              {loadingAllStudents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Cargando alumnos...
                </div>
              ) : (
                <div className="border rounded-lg max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Grupo</TableHead>
                        <TableHead>Plan de Estudios</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Teléfono</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allStudents
                        .filter(s => {
                          if (!searchAlumnos) return true;
                          const q = searchAlumnos.toLowerCase();
                          return (
                            s.matricula?.toLowerCase().includes(q) ||
                            s.nombreCompleto?.toLowerCase().includes(q) ||
                            s.grupo?.toLowerCase().includes(q) ||
                            s.planEstudios?.toLowerCase().includes(q)
                          );
                        })
                        .map(s => (
                          <TableRow key={s.idEstudiante}>
                            <TableCell className="font-mono">{s.matricula}</TableCell>
                            <TableCell>{s.nombreCompleto}</TableCell>
                            <TableCell>{s.grupo ?? "-"}</TableCell>
                            <TableCell>{s.planEstudios}</TableCell>
                            <TableCell>{s.email ?? "-"}</TableCell>
                            <TableCell>{s.telefono ?? "-"}</TableCell>
                          </TableRow>
                        ))}
                      {allStudents.length === 0 && !loadingAllStudents && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No hay alumnos registrados
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────── TAB 8: Todos los Profesores ────── */}
        <TabsContent value="todos-profesores">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Todos los Profesores</CardTitle>
              <CardDescription>Listado completo de profesores ({allTeachers.length})</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Buscar por nombre, no. empleado o email..."
                  value={searchProfesores}
                  onChange={(e) => setSearchProfesores(e.target.value)}
                  className="max-w-sm"
                />
                <Button
                  variant="outline"
                  disabled={allTeachers.length === 0}
                  onClick={() => exportToCSV(
                    allTeachers.map(t => ({
                      "No. Empleado": t.noEmpleado,
                      Nombre: t.nombreCompleto,
                      "Email Institucional": t.emailInstitucional ?? "",
                      Telefono: t.telefono ?? "",
                      CURP: t.curp ?? "",
                      RFC: t.rfc ?? "",
                    })),
                    `Todos_Profesores_${fechaActual}.csv`
                  )}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>

              {loadingAllTeachers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Cargando profesores...
                </div>
              ) : (
                <div className="border rounded-lg max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Empleado</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email Institucional</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>CURP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allTeachers
                        .filter(t => {
                          if (!searchProfesores) return true;
                          const q = searchProfesores.toLowerCase();
                          return (
                            t.noEmpleado?.toLowerCase().includes(q) ||
                            t.nombreCompleto?.toLowerCase().includes(q) ||
                            t.emailInstitucional?.toLowerCase().includes(q)
                          );
                        })
                        .map(t => (
                          <TableRow key={t.idProfesor}>
                            <TableCell className="font-mono">{t.noEmpleado}</TableCell>
                            <TableCell>{t.nombreCompleto}</TableCell>
                            <TableCell>{t.emailInstitucional ?? "-"}</TableCell>
                            <TableCell>{t.telefono ?? "-"}</TableCell>
                            <TableCell>{t.curp ?? "-"}</TableCell>
                          </TableRow>
                        ))}
                      {allTeachers.length === 0 && !loadingAllTeachers && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No hay profesores registrados
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────── TAB 9: Docentes por Materia ────── */}
        <TabsContent value="docentes-materia">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Docentes por Materia</CardTitle>
              <CardDescription>
                Asignación de docentes a materias por grupo en el periodo seleccionado
                {docentesMaterias.length > 0 && ` (${docentesMaterias.length} asignaciones)`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedPeriodo ? (
                <p className="text-muted-foreground text-sm py-4">Selecciona un periodo académico para ver las asignaciones.</p>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <Input
                      placeholder="Buscar por grupo, materia o docente..."
                      value={searchDocentesMaterias}
                      onChange={(e) => setSearchDocentesMaterias(e.target.value)}
                      className="max-w-sm"
                    />
                    <Button
                      variant="outline"
                      disabled={docentesMaterias.length === 0}
                      onClick={() => exportToCSV(
                        docentesMaterias.map(d => ({
                          Grupo: d.grupo,
                          Materia: d.materia,
                          Docente: d.docente,
                          Aula: d.aula,
                        })),
                        `Docentes_Materia_${fechaActual}.csv`
                      )}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar CSV
                    </Button>
                  </div>

                  {loadingDocentesMaterias ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Cargando asignaciones de docentes...
                    </div>
                  ) : (
                    <div className="border rounded-lg max-h-[500px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Grupo</TableHead>
                            <TableHead>Materia</TableHead>
                            <TableHead>Docente</TableHead>
                            <TableHead>Aula</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {docentesMaterias
                            .filter(d => {
                              if (!searchDocentesMaterias) return true;
                              const q = searchDocentesMaterias.toLowerCase();
                              return (
                                d.grupo.toLowerCase().includes(q) ||
                                d.materia.toLowerCase().includes(q) ||
                                d.docente.toLowerCase().includes(q)
                              );
                            })
                            .map((d, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">{d.grupo}</TableCell>
                                <TableCell>{d.materia}</TableCell>
                                <TableCell>{d.docente}</TableCell>
                                <TableCell>{d.aula}</TableCell>
                              </TableRow>
                            ))}
                          {docentesMaterias.length === 0 && !loadingDocentesMaterias && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                No hay asignaciones para este periodo
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────── TAB: Reporte de Bajas ────── */}
        <TabsContent value="bajas">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reporte de Bajas</CardTitle>
              <CardDescription>Reporte centralizado con enfoque Académico y Financiero</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Campus</Label>
                  <Select value={bajaCampusFilter} onValueChange={setBajaCampusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los campus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {campusList.map((c) => (
                        <SelectItem key={c.idCampus} value={c.idCampus.toString()}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Plan de Estudios</Label>
                  <Select value={bajaPlanFilter} onValueChange={setBajaPlanFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los planes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {bajaPlanesFiltered.map((p) => (
                        <SelectItem key={p.idPlanEstudios} value={p.idPlanEstudios.toString()}>
                          {p.nombrePlanEstudios}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mes</Label>
                  <Select value={bajaMesFilter} onValueChange={setBajaMesFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los meses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m, i) => (
                        <SelectItem key={i+1} value={`${i+1}-${new Date().getFullYear()}`}>{m} {new Date().getFullYear()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={async () => {
                      setLoadingBajas(true);
                      try {
                        const campusId = bajaCampusFilter && bajaCampusFilter !== "todos" ? Number(bajaCampusFilter) : undefined;
                        const planId = bajaPlanFilter && bajaPlanFilter !== "todos" ? Number(bajaPlanFilter) : undefined;
                        const periodoId = selectedPeriodo ? Number(selectedPeriodo) : undefined;
                        let mesVal: number | undefined;
                        let anioVal: number | undefined;
                        if (bajaMesFilter && bajaMesFilter !== "todos") {
                          const [m, a] = bajaMesFilter.split("-");
                          mesVal = Number(m);
                          anioVal = Number(a);
                        }
                        const data = await getReporteBajas(campusId, planId, periodoId, mesVal, anioVal);
                        setReporteBajas(data);
                      } catch {
                        toast.error("Error al generar reporte de bajas");
                      } finally {
                        setLoadingBajas(false);
                      }
                    }}
                    disabled={loadingBajas}
                    style={{ background: "linear-gradient(to right, #14356F, #1e4a8f)" }}
                  >
                    {loadingBajas ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                    Consultar
                  </Button>
                  {reporteBajas && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Descargar PDF"
                        onClick={async () => {
                          try {
                            const campusId = bajaCampusFilter && bajaCampusFilter !== "todos" ? Number(bajaCampusFilter) : undefined;
                            const planId = bajaPlanFilter && bajaPlanFilter !== "todos" ? Number(bajaPlanFilter) : undefined;
                            const periodoId = selectedPeriodo ? Number(selectedPeriodo) : undefined;
                            let mesVal: number | undefined;
                            let anioVal: number | undefined;
                            if (bajaMesFilter && bajaMesFilter !== "todos") {
                              const [m, a] = bajaMesFilter.split("-");
                              mesVal = Number(m);
                              anioVal = Number(a);
                            }
                            const blob = await descargarReporteBajasPdf(campusId, planId, periodoId, mesVal, anioVal);
                            descargarBlob(blob, `ReporteBajas_${new Date().toISOString().split("T")[0]}.pdf`);
                            toast.success("PDF descargado");
                          } catch {
                            toast.error("Error al descargar PDF");
                          }
                        }}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Descargar Excel"
                        onClick={async () => {
                          try {
                            const campusId = bajaCampusFilter && bajaCampusFilter !== "todos" ? Number(bajaCampusFilter) : undefined;
                            const planId = bajaPlanFilter && bajaPlanFilter !== "todos" ? Number(bajaPlanFilter) : undefined;
                            const periodoId = selectedPeriodo ? Number(selectedPeriodo) : undefined;
                            let mesVal: number | undefined;
                            let anioVal: number | undefined;
                            if (bajaMesFilter && bajaMesFilter !== "todos") {
                              const [m, a] = bajaMesFilter.split("-");
                              mesVal = Number(m);
                              anioVal = Number(a);
                            }
                            const blob = await descargarReporteBajasExcel(campusId, planId, periodoId, mesVal, anioVal);
                            descargarBlob(blob, `ReporteBajas_${new Date().toISOString().split("T")[0]}.xlsx`);
                            toast.success("Excel descargado");
                          } catch {
                            toast.error("Error al descargar Excel");
                          }
                        }}
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {reporteBajas && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div className="p-3 rounded-lg bg-gray-100 text-center">
                      <p className="text-2xl font-bold" style={{ color: "#14356F" }}>{reporteBajas.totalBajas}</p>
                      <p className="text-xs text-gray-600">Total Bajas</p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-50 text-center border border-yellow-200">
                      <p className="text-2xl font-bold text-yellow-700">{reporteBajas.bajasTemporales}</p>
                      <p className="text-xs text-yellow-600">Temporales</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 text-center border border-red-200">
                      <p className="text-2xl font-bold text-red-700">{reporteBajas.bajasDefinitivas}</p>
                      <p className="text-xs text-red-600">Definitivas</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 text-center border border-blue-200">
                      <p className="text-2xl font-bold text-blue-700">{reporteBajas.bajasAdministrativas}</p>
                      <p className="text-xs text-blue-600">Administrativas</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-50 text-center border border-purple-200">
                      <p className="text-2xl font-bold text-purple-700">{reporteBajas.bajasAcademicas}</p>
                      <p className="text-xs text-purple-600">Académicas</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 text-center border border-red-200">
                      <p className="text-2xl font-bold text-red-700">${reporteBajas.totalSaldoPendiente?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-red-600">Saldo Pendiente Total</p>
                    </div>
                  </div>

                  <Tabs value={bajaSubTab} onValueChange={setBajaSubTab}>
                    <TabsList>
                      <TabsTrigger value="academico" className="flex items-center gap-1">
                        <GraduationCap className="w-4 h-4" /> Académico
                      </TabsTrigger>
                      <TabsTrigger value="financiero" className="flex items-center gap-1">
                        <FileSpreadsheet className="w-4 h-4" /> Financiero
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="academico">
                      {reporteBajas.estudiantes.length > 0 ? (
                        <div className="border rounded-lg overflow-auto max-h-[500px]">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-[#14356F]">
                                <TableHead className="text-white font-bold">#</TableHead>
                                <TableHead className="text-white font-bold">Matrícula</TableHead>
                                <TableHead className="text-white font-bold">Nombre</TableHead>
                                <TableHead className="text-white font-bold">Plan</TableHead>
                                <TableHead className="text-white font-bold">Grupo</TableHead>
                                <TableHead className="text-white font-bold">Tipo</TableHead>
                                <TableHead className="text-white font-bold">Estado</TableHead>
                                <TableHead className="text-white font-bold">Motivo</TableHead>
                                <TableHead className="text-white font-bold">Fecha</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {reporteBajas.estudiantes.map((est: any, i: number) => (
                                <TableRow key={est.matricula} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                  <TableCell className="text-xs">{i + 1}</TableCell>
                                  <TableCell className="font-mono text-xs">{est.matricula}</TableCell>
                                  <TableCell className="text-xs">{est.nombreCompleto}</TableCell>
                                  <TableCell className="text-xs max-w-[150px] truncate">{est.planEstudios || "—"}</TableCell>
                                  <TableCell className="text-xs font-mono">{est.ultimoGrupo || "—"}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={
                                      est.tipoBaja === "Administrativa" ? "border-blue-300 text-blue-700 bg-blue-50" :
                                      est.tipoBaja === "Académica" ? "border-purple-300 text-purple-700 bg-purple-50" :
                                      "border-gray-300"
                                    }>
                                      {est.tipoBaja}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={
                                      est.estadoBaja === "Temporal" ? "border-yellow-300 text-yellow-700 bg-yellow-50" :
                                      est.estadoBaja === "Definitiva" ? "border-red-300 text-red-700 bg-red-50" :
                                      "border-gray-300"
                                    }>
                                      {est.estadoBaja}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs max-w-[200px] truncate" title={est.motivoBaja || ""}>
                                    {est.motivoBaja || "—"}
                                  </TableCell>
                                  <TableCell className="text-xs whitespace-nowrap">
                                    {est.fechaBaja ? new Date(est.fechaBaja).toLocaleDateString("es-MX") : "—"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No se encontraron estudiantes dados de baja con los filtros seleccionados.
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="financiero">
                      {reporteBajas.estudiantes.length > 0 ? (
                        <div className="border rounded-lg overflow-auto max-h-[500px]">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-[#14356F]">
                                <TableHead className="text-white font-bold">#</TableHead>
                                <TableHead className="text-white font-bold">Matrícula</TableHead>
                                <TableHead className="text-white font-bold">Nombre</TableHead>
                                <TableHead className="text-white font-bold">Plan</TableHead>
                                <TableHead className="text-white font-bold">Estado</TableHead>
                                <TableHead className="text-white font-bold">Fecha Baja</TableHead>
                                <TableHead className="text-white font-bold">Saldo Pendiente</TableHead>
                                <TableHead className="text-white font-bold">Total Pagado</TableHead>
                                <TableHead className="text-white font-bold">Último Pago</TableHead>
                                <TableHead className="text-white font-bold">Contacto</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {reporteBajas.estudiantes.map((est: any, i: number) => (
                                <TableRow key={est.matricula} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                  <TableCell className="text-xs">{i + 1}</TableCell>
                                  <TableCell className="font-mono text-xs">{est.matricula}</TableCell>
                                  <TableCell className="text-xs">{est.nombreCompleto}</TableCell>
                                  <TableCell className="text-xs max-w-[120px] truncate">{est.planEstudios || "—"}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={
                                      est.estadoBaja === "Temporal" ? "border-yellow-300 text-yellow-700 bg-yellow-50" :
                                      est.estadoBaja === "Definitiva" ? "border-red-300 text-red-700 bg-red-50" :
                                      "border-gray-300"
                                    }>
                                      {est.estadoBaja}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs whitespace-nowrap">
                                    {est.fechaBaja ? new Date(est.fechaBaja).toLocaleDateString("es-MX") : "—"}
                                  </TableCell>
                                  <TableCell className={`text-xs font-semibold ${est.saldoPendiente > 0 ? "text-red-600" : "text-green-600"}`}>
                                    ${est.saldoPendiente?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    ${est.totalPagado?.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell className="text-xs whitespace-nowrap">
                                    {est.ultimoPago
                                      ? `${new Date(est.ultimoPago).toLocaleDateString("es-MX")} ($${est.montoUltimoPago?.toLocaleString("es-MX", { minimumFractionDigits: 2 })})`
                                      : "Sin pagos"}
                                  </TableCell>
                                  <TableCell className="text-xs max-w-[120px] truncate" title={`${est.email || ""} ${est.telefono || ""}`}>
                                    {est.email || est.telefono || "—"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No se encontraron estudiantes dados de baja con los filtros seleccionados.
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Los reportes se generan en tiempo real basados en la información de la base de datos.
          Asegúrate de seleccionar el periodo académico correcto para obtener los datos deseados.
        </p>
      </div>
    </div>
  );
}
