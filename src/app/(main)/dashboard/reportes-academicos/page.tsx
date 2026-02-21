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
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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

  // ─── Loading states ───
  const [loading, setLoading] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  // ─── Load catálogos on mount ───
  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        const [periodosRes, parcialesRes, profesoresRes, campusRes] = await Promise.all([
          getPeriodosAcademicos(),
          getParciales(),
          getProfesores(),
          getCampusList(),
        ]);
        setPeriodos(Array.isArray(periodosRes) ? periodosRes : periodosRes?.items ?? periodosRes?.data ?? []);
        setParciales(Array.isArray(parcialesRes) ? parcialesRes : parcialesRes?.items ?? []);
        setProfesores(Array.isArray(profesoresRes) ? profesoresRes : profesoresRes?.items ?? profesoresRes?.data ?? []);
        setCampusList(Array.isArray(campusRes) ? campusRes : campusRes?.items ?? []);
      } catch {
        toast.error("Error al cargar catálogos");
      } finally {
        setLoadingCatalogos(false);
      }
    };
    loadCatalogos();
  }, []);

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

  // ─── Load estudiantes when periodo changes (for boleta) ───
  useEffect(() => {
    if (!selectedPeriodo) return;
    const load = async () => {
      try {
        const res = await getEstudiantes(1, 2000);
        setEstudiantes(Array.isArray(res) ? res : res?.items ?? res?.data ?? []);
      } catch {
        // ignore
      }
    };
    load();
  }, [selectedPeriodo]);

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

  const getNombreEstudiante = (est: EstudianteItem) => {
    if (est.persona) return `${est.matricula} - ${est.persona.nombre} ${est.persona.apellidoPaterno} ${est.persona.apellidoMaterno ?? ""}`.trim();
    return est.matricula;
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
              <div className="max-w-sm">
                <Label>Estudiante</Label>
                <Select value={selectedEstudiante} onValueChange={setSelectedEstudiante} disabled={!selectedPeriodo}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedPeriodo ? "Seleccionar estudiante..." : "Primero selecciona un periodo"} />
                  </SelectTrigger>
                  <SelectContent>
                    {estudiantes.map((e) => (
                      <SelectItem key={e.idEstudiante} value={e.idEstudiante.toString()}>
                        {getNombreEstudiante(e)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
