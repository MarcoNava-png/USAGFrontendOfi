"use client";

import { useEffect, useState } from "react";

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnDef,
  Table,
  Updater,
  PaginationState,
} from "@tanstack/react-table";
import { Users, DollarSign, MoreHorizontal, FileText, CreditCard, ClipboardList, EyeOff, Eye, Pencil, GraduationCap, Printer, CheckCircle, Filter as FilterIcon, HeartHandshake } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { withDndColumn } from "@/components/data-table/table-utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePermissions } from "@/hooks/use-permissions";
import { getApplicantsList, getApplicantCounters, getApplicantAsesores, hideApplicant, restoreApplicant, downloadApplicantEnrollmentSheet, downloadApplicantEnrollmentReceipt } from "@/services/applicants-service";
import documentacionAspirantesService from "@/services/documentacion-aspirantes-service";
import type { DocumentacionAspiranteResumenDto } from "@/types/documentacion-aspirantes";
import { getCampusList } from "@/services/campus-service";
import {
  getAcademicPeriods,
  getApplicantStatus,
  getCivilStatus,
  getContactMethods,
  getGenresList,
  getModalidades,
  getSchedules,
} from "@/services/catalogs-service";
import { formatPeriodoLabel } from "@/services/academic-period-service";
import { getStates } from "@/services/location-service";
import { getStudyPlansList } from "@/services/study-plans-service";
import { Applicant, ApplicantsResponse } from "@/types/applicant";
import { Campus } from "@/types/campus";
import { AcademicPeriod, ApplicantStatus, CivilStatus, ContactMethod, Genres, Modalidad, Schedule } from "@/types/catalog";
import { State } from "@/types/location";
import { StudyPlan } from "@/types/study-plan";

import { ApplicantLogsModal } from "./_components/applicant-logs-modal";
import { CreateApplicantModal } from "./_components/create-applicant-modal";
import { DocumentsManagementModal } from "./_components/documents-management-modal";
import { EstudioSocioeconomicoModal } from "./_components/estudio-socioeconomico-modal";
import { EditApplicantModal } from "./_components/edit-applicant-modal";
import { EnrollStudentModal } from "./_components/enroll-student-modal";
import { ReceiptsManagementModal } from "./_components/receipts-management-modal";

const columns: ColumnDef<Applicant>[] = withDndColumn([
  {
    accessorKey: "idAspirante",
    header: "ID",
  },
  {
    accessorKey: "nombreCompleto",
    header: "Nombre",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
  },
  {
    accessorKey: "aspiranteEstatus",
    header: "Estatus",
  },
  {
    accessorKey: "fechaRegistro",
    header: "Registro",
  },
]);

const getStatusBadgeClass = (estatus: string) => {
  if (estatus === "Inscrito") return "bg-green-100 text-green-700";
  if (estatus === "Aceptado") return "bg-blue-100 text-blue-700";
  if (estatus === "Rechazado") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
};

const getPaymentStatusBadgeClass = (estatus?: string) => {
  if (estatus === "PAGADO") return "bg-green-100 text-green-700";
  if (estatus === "PARCIAL") return "bg-yellow-100 text-yellow-700";
  if (estatus === "PENDIENTE") return "bg-orange-100 text-orange-700";
  return "bg-gray-100 text-gray-700";
};

const getDocumentStatusBadgeClass = (estatus?: string) => {
  if (estatus === "VALIDADO") return "bg-green-100 text-green-700";
  if (estatus === "COMPLETO") return "bg-blue-100 text-blue-700";
  return "bg-orange-100 text-orange-700";
};

function Page() {
  const [data, setData] = useState<Applicant[]>([]);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [applicantToEnroll, setApplicantToEnroll] = useState<Applicant | null>(null);
  const [bitacorasModalOpen, setBitacorasModalOpen] = useState(false);
  const [applicantForBitacoras, setApplicantForBitacoras] = useState<Applicant | null>(null);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [applicantForDocuments, setApplicantForDocuments] = useState<Applicant | null>(null);
  const [estudioModalOpen, setEstudioModalOpen] = useState(false);
  const [applicantForEstudio, setApplicantForEstudio] = useState<Applicant | null>(null);
  const [receiptsModalOpen, setReceiptsModalOpen] = useState(false);
  const [applicantForReceipts, setApplicantForReceipts] = useState<Applicant | null>(null);
  const [genres, setGenres] = useState<Genres[]>([]);
  const [civilStatus, setCivilStatus] = useState<CivilStatus[]>([]);
  const [campus, setCampus] = useState<Campus[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [contactMethods, setContactMethods] = useState<ContactMethod[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [applicantStatus, setApplicantStatus] = useState<ApplicantStatus[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [applicantToEdit, setApplicantToEdit] = useState<Applicant | null>(null);
  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  const [applicantToHide, setApplicantToHide] = useState<Applicant | null>(null);
  const [hiding, setHiding] = useState(false);
  const { isAdmin, isSuperAdmin, primaryRole, permissions } = usePermissions();
  const canHideApplicants = isAdmin || primaryRole === "DIRECTOR";
  const ROLES_COMISIONES = ["admin", "superadmin", "director", "finanzas", "admisiones"];
  const canVerComisiones =
    isAdmin ||
    isSuperAdmin ||
    (permissions?.roles ?? []).some((r) => ROLES_COMISIONES.includes(r.toLowerCase())) ||
    (primaryRole ? ROLES_COMISIONES.includes(primaryRole.toLowerCase()) : false);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [counters, setCounters] = useState<Record<string, number>>({ total: 0, inscritos: 0, aceptados: 0, pendientes: 0 });
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [asesores, setAsesores] = useState<{ id: string; nombre: string }[]>([]);
  const [filtroAsesor, setFiltroAsesor] = useState<string>("");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("all");
  const [verOcultos, setVerOcultos] = useState(false);
  const [colEstatus, setColEstatus] = useState<string[]>([]);
  const [colFechaDesde, setColFechaDesde] = useState<string>("");
  const [colFechaHasta, setColFechaHasta] = useState<string>("");
  const [colPagos, setColPagos] = useState<string[]>([]);
  const [colDocs, setColDocs] = useState<string[]>([]);
  const [colPlanes, setColPlanes] = useState<number[]>([]);
  const [colAccion, setColAccion] = useState<string>("");
  const [resumenDocs, setResumenDocs] = useState<Record<number, {
    totalDocumentos: number;
    documentosCompletos: number;
    documentosConProrroga: number;
    prorrogasVencidas: number;
    estatusGeneral: string;
  }>>({});

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(filter);
    }, 500);
    return () => clearTimeout(handler);
  }, [filter]);

  const loadApplicants = () => {
    const filterToSend: string | undefined = debouncedFilter.trim() === "" ? undefined : debouncedFilter;
    setLoading(true);
    Promise.all([
      getApplicantsList({
        page: pageIndex + 1,
        pageSize,
        filter: filterToSend,
        createdBy: filtroAsesor || undefined,
        soloOcultos: verOcultos || undefined,
        soloSinPeriodo: filtroPeriodo === "sin",
        idPeriodoAcademico: filtroPeriodo !== "all" && filtroPeriodo !== "sin" ? parseInt(filtroPeriodo) : undefined,
        estatus: colEstatus.length > 0 ? colEstatus : undefined,
        fechaRegistroDesde: colFechaDesde || undefined,
        fechaRegistroHasta: colFechaHasta || undefined,
        estatusPago: colPagos.length > 0 ? colPagos : undefined,
        estatusDocumentos: colDocs.length > 0 ? colDocs : undefined,
        idPlan: colPlanes.length > 0 ? colPlanes : undefined,
        accionTipo: colAccion || undefined,
      }),
      getApplicantCounters(),
      documentacionAspirantesService.getResumenDocumentacion().catch(() => [] as DocumentacionAspiranteResumenDto[]),
    ])
      .then(([res, counts, resumenes]) => {
        setData(res.items);
        setTotalRows(res.totalItems ?? 0);
        setCounters(counts);
        const map: Record<number, typeof resumenDocs[number]> = {};
        for (const r of resumenes) {
          map[r.idAspirante] = {
            totalDocumentos: r.totalDocumentos,
            documentosCompletos: r.documentosCompletos,
            documentosConProrroga: r.documentosConProrroga,
            prorrogasVencidas: r.prorrogasVencidas,
            estatusGeneral: r.estatusGeneral,
          };
        }
        setResumenDocs(map);
      })
      .finally(() => setLoading(false));
  };

  const handleHideApplicant = async () => {
    if (!applicantToHide) return;
    setHiding(true);
    try {
      await hideApplicant(applicantToHide.idAspirante);
      toast.success(`Aspirante "${applicantToHide.nombreCompleto}" ocultado exitosamente`);
      setHideDialogOpen(false);
      setApplicantToHide(null);
      loadApplicants();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { Error?: string } }; message?: string };
      toast.error(err?.response?.data?.Error ?? err?.message ?? "Error al ocultar aspirante");
    } finally {
      setHiding(false);
    }
  };

  const handleRestoreApplicant = async (applicant: Applicant) => {
    try {
      await restoreApplicant(applicant.idAspirante);
      toast.success(`Aspirante "${applicant.nombreCompleto}" restaurado exitosamente`);
      loadApplicants();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { Error?: string } }; message?: string };
      toast.error(err?.response?.data?.Error ?? err?.message ?? "Error al restaurar aspirante");
    }
  };

  useEffect(() => {
    const handler: NodeJS.Timeout = setTimeout(() => {
      loadApplicants();
    }, 500);
    return () => clearTimeout(handler);
  }, [pageIndex, pageSize, debouncedFilter, filtroAsesor, filtroPeriodo, verOcultos, colEstatus, colFechaDesde, colFechaHasta, colPagos, colDocs, colPlanes, colAccion]);

  useEffect(() => {
    getApplicantAsesores().then(setAsesores).catch(() => {});
  }, []);

  useEffect(() => {
    const loadCatalogs = async () => {
      setLoading(true);
      try {
        const [genresData, civilStatusData, campusData, studyPlansData, contactMethodsData, schedulesData, applicantStatusData, statesData, modalidadesData, academicPeriodsData] = await Promise.all([
          getGenresList(),
          getCivilStatus(),
          getCampusList(),
          getStudyPlansList(),
          getContactMethods(),
          getSchedules(),
          getApplicantStatus(),
          getStates(),
          getModalidades(),
          getAcademicPeriods(),
        ]);

        setGenres(genresData);
        setCivilStatus(civilStatusData);
        setCampus(campusData.items);
        setStudyPlans(studyPlansData.items);
        setContactMethods(contactMethodsData);
        setSchedules(schedulesData);
        setApplicantStatus(applicantStatusData);
        setStates(statesData);
        setModalidades(modalidadesData);
        setAcademicPeriods(academicPeriodsData);
      } catch (error) {
        console.error("Error loading catalogs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCatalogs();
  }, []);

  const table: Table<Applicant> = useReactTable<Applicant>({
    data,
    columns,
    state: {
      pagination: { pageIndex, pageSize },
    },
    manualPagination: true,
    rowCount: totalRows,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater: Updater<PaginationState>) => {
      if (typeof updater === "function") {
        const next = updater({ pageIndex, pageSize });
        setPageIndex(next.pageIndex);
        setPageSize(next.pageSize);
      } else {
        setPageIndex(updater.pageIndex);
        setPageSize(updater.pageSize);
      }
    },
  });

  return (
    <div className="@container/main flex flex-col gap-4 space-y-4 md:gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ background: 'linear-gradient(to bottom right, rgba(20, 53, 111, 0.1), rgba(30, 74, 143, 0.1))' }}
              >
                <Users className="h-8 w-8" style={{ color: '#14356F' }} />
              </div>
              Aspirantes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona los aspirantes del proceso de admisión
            </p>
          </div>
          <div className="flex items-center gap-2">
          {canVerComisiones && (
            <Button variant="outline" asChild className="gap-1">
              <Link href="/dashboard/applicants/commissions">
                <DollarSign className="h-4 w-4" />
                Comisiones
              </Link>
            </Button>
          )}
          <Button
            onClick={() => setOpen(true)}
            className="text-white"
            style={{ background: 'linear-gradient(to right, var(--brand-surface), var(--brand-surface-2))' }}
          >
            Crear aspirante
          </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-white shadow-sm">
          <Input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por nombre, email, CURP o telefono..."
            className="flex-1 min-w-[200px]"
          />
          <Select value={filtroAsesor || "TODOS"} onValueChange={(v) => { setFiltroAsesor(v === "TODOS" ? "" : v); setPageIndex(0); }}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Registrado por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los asesores</SelectItem>
              {asesores.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroPeriodo} onValueChange={(v) => { setFiltroPeriodo(v); setPageIndex(0); }}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Periodo de ingreso..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los periodos</SelectItem>
              <SelectItem value="sin">Sin periodo asignado</SelectItem>
              {academicPeriods.map((p) => (
                <SelectItem key={p.idPeriodoAcademico} value={p.idPeriodoAcademico.toString()}>
                  {formatPeriodoLabel(p)}{p.esPeriodoActual ? " — Actual" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canHideApplicants && (
            <Button
              variant={verOcultos ? "default" : "outline"}
              size="sm"
              onClick={() => { setVerOcultos((v) => !v); setPageIndex(0); }}
              className="gap-2"
              style={verOcultos ? { backgroundColor: "#14356F" } : undefined}
            >
              {verOcultos ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {verOcultos ? "Viendo ocultos" : "Ver ocultos"}
            </Button>
          )}
          {(filter || filtroAsesor || filtroPeriodo !== "all" || colEstatus.length > 0 || colFechaDesde || colFechaHasta || colPagos.length > 0 || colDocs.length > 0 || colPlanes.length > 0 || colAccion) && (
            <Button variant="ghost" size="sm" onClick={() => {
              setFilter(""); setFiltroAsesor(""); setFiltroPeriodo("all");
              setColEstatus([]); setColFechaDesde(""); setColFechaHasta("");
              setColPagos([]); setColDocs([]);
              setColPlanes([]); setColAccion("");
              setPageIndex(0);
            }} className="text-muted-foreground hover:text-foreground">
              Limpiar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="border-2"
          style={{ borderColor: 'rgba(20, 53, 111, 0.2)', background: 'linear-gradient(to bottom right, rgba(20, 53, 111, 0.05), rgba(30, 74, 143, 0.1))' }}
        >
          <CardHeader className="pb-2">
            <CardDescription style={{ color: '#1e4a8f' }}>Total Aspirantes</CardDescription>
            <CardTitle className="text-4xl" style={{ color: '#14356F' }}>
              {counters.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-600 dark:text-green-400">Inscritos</CardDescription>
            <CardTitle className="text-4xl text-green-700 dark:text-green-300">
              {counters.inscritos}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-yellow-600 dark:text-yellow-400">Pendientes</CardDescription>
            <CardTitle className="text-4xl text-yellow-700 dark:text-yellow-300">
              {counters.pendientes}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <CreateApplicantModal
        open={open}
        genres={genres}
        civilStatus={civilStatus}
        campus={campus}
        studyPlans={studyPlans}
        contactMethods={contactMethods}
        schedules={schedules}
        applicantStatus={applicantStatus}
        states={states}
        modalidades={modalidades}
        academicPeriods={academicPeriods}
        onOpenChange={setOpen}
        onApplicantCreated={() => {
          loadApplicants();
        }}
      />

      <EditApplicantModal
        open={editModalOpen}
        applicantId={applicantToEdit?.idAspirante ?? null}
        genres={genres}
        civilStatus={civilStatus}
        campus={campus}
        studyPlans={studyPlans}
        contactMethods={contactMethods}
        schedules={schedules}
        applicantStatus={applicantStatus}
        states={states}
        modalidades={modalidades}
        academicPeriods={academicPeriods}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setApplicantToEdit(null);
        }}
        onApplicantUpdated={() => {
          loadApplicants();
        }}
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead
              className="border-b"
              style={{ background: 'linear-gradient(to right, var(--brand-surface), var(--brand-surface-2))' }}
            >
              <tr>
                <th className="px-2 py-3 text-left text-xs font-semibold text-white w-[50px]">ID</th>
                <th className="px-2 py-3 text-left text-xs font-semibold text-white min-w-[180px]">Nombre</th>
                <th className="px-2 py-3 text-left text-xs font-semibold text-white min-w-[150px]">
                  <div className="flex items-center gap-1">
                    <span>Plan de Estudios</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="hover:bg-white/20 rounded p-0.5" aria-label="Filtrar por plan de estudios">
                          <FilterIcon className={`h-3 w-3 ${colPlanes.length > 0 ? "text-yellow-300" : "text-white/70"}`} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-3" align="start">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Filtrar por plan</p>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {studyPlans.map((p) => (
                            <label key={p.idPlanEstudios} className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                              <Checkbox
                                checked={colPlanes.includes(p.idPlanEstudios)}
                                onCheckedChange={(checked) => {
                                  setColPlanes((prev) => checked ? [...prev, p.idPlanEstudios] : prev.filter((x) => x !== p.idPlanEstudios));
                                  setPageIndex(0);
                                }}
                              />
                              <span className="text-xs">{p.nombrePlanEstudios}</span>
                            </label>
                          ))}
                        </div>
                        {colPlanes.length > 0 && (
                          <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => { setColPlanes([]); setPageIndex(0); }}>Limpiar</Button>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </th>
                <th className="px-2 py-3 text-left text-xs font-semibold text-white w-[95px]">Teléfono</th>
                <th className="px-2 py-3 text-left text-xs font-semibold text-white w-[100px]">
                  <div className="flex items-center gap-1">
                    <span>Estatus</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="hover:bg-white/20 rounded p-0.5" aria-label="Filtrar por estatus">
                          <FilterIcon className={`h-3 w-3 ${colEstatus.length > 0 ? "text-yellow-300" : "text-white/70"}`} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-3" align="start">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Filtrar por estatus</p>
                        <div className="space-y-2 max-h-[260px] overflow-y-auto">
                          {applicantStatus.map((s) => (
                            <label key={s.idAspiranteEstatus} className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                              <Checkbox
                                checked={colEstatus.includes(s.descEstatus)}
                                onCheckedChange={(checked) => {
                                  setColEstatus((prev) => checked ? [...prev, s.descEstatus] : prev.filter((x) => x !== s.descEstatus));
                                  setPageIndex(0);
                                }}
                              />
                              <span>{s.descEstatus}</span>
                            </label>
                          ))}
                        </div>
                        {colEstatus.length > 0 && (
                          <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => { setColEstatus([]); setPageIndex(0); }}>Limpiar</Button>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </th>
                <th className="px-2 py-3 text-left text-xs font-semibold text-white w-[120px]">
                  <div className="flex items-center gap-1">
                    <span>Registrado Por</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="hover:bg-white/20 rounded p-0.5" aria-label="Filtrar por asesor">
                          <FilterIcon className={`h-3 w-3 ${filtroAsesor ? "text-yellow-300" : "text-white/70"}`} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="start">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Filtrar por asesor</p>
                        <div className="space-y-2 max-h-[260px] overflow-y-auto">
                          <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                            <input type="radio" name="asesor-pop" checked={!filtroAsesor} onChange={() => { setFiltroAsesor(""); setPageIndex(0); }} />
                            <span>Todos los asesores</span>
                          </label>
                          {asesores.map((a) => (
                            <label key={a.id} className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                              <input type="radio" name="asesor-pop" checked={filtroAsesor === a.id} onChange={() => { setFiltroAsesor(a.id); setPageIndex(0); }} />
                              <span>{a.nombre}</span>
                            </label>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </th>
                <th className="px-2 py-3 text-left text-xs font-semibold text-white w-[85px]">
                  <div className="flex items-center gap-1">
                    <span>Registro</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="hover:bg-white/20 rounded p-0.5" aria-label="Filtrar por fecha de registro">
                          <FilterIcon className={`h-3 w-3 ${(colFechaDesde || colFechaHasta) ? "text-yellow-300" : "text-white/70"}`} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-3" align="start">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Filtrar por fecha</p>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-gray-700">Desde</label>
                            <input type="date" value={colFechaDesde} onChange={(e) => { setColFechaDesde(e.target.value); setPageIndex(0); }} className="border rounded px-2 py-1 text-sm w-full text-gray-900" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-700">Hasta</label>
                            <input type="date" value={colFechaHasta} onChange={(e) => { setColFechaHasta(e.target.value); setPageIndex(0); }} className="border rounded px-2 py-1 text-sm w-full text-gray-900" />
                          </div>
                        </div>
                        {(colFechaDesde || colFechaHasta) && (
                          <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => { setColFechaDesde(""); setColFechaHasta(""); setPageIndex(0); }}>Limpiar</Button>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-white w-[90px]">
                  <div className="flex items-center justify-center gap-1">
                    <span>Pagos</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="hover:bg-white/20 rounded p-0.5" aria-label="Filtrar por pagos">
                          <FilterIcon className={`h-3 w-3 ${colPagos.length > 0 ? "text-yellow-300" : "text-white/70"}`} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-52 p-3" align="end">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Filtrar por pagos</p>
                        <div className="space-y-2">
                          {[
                            { key: "PAGADO", label: "Pagado" },
                            { key: "PARCIAL", label: "Parcial" },
                            { key: "PENDIENTE", label: "Pendiente" },
                            { key: "SIN_RECIBO", label: "Sin recibo" },
                          ].map((opt) => (
                            <label key={opt.key} className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                              <Checkbox
                                checked={colPagos.includes(opt.key)}
                                onCheckedChange={(checked) => {
                                  setColPagos((prev) => checked ? [...prev, opt.key] : prev.filter((x) => x !== opt.key));
                                  setPageIndex(0);
                                }}
                              />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                        {colPagos.length > 0 && (
                          <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => { setColPagos([]); setPageIndex(0); }}>Limpiar</Button>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-white w-[95px]">
                  <div className="flex items-center justify-center gap-1">
                    <span>Documentos</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="hover:bg-white/20 rounded p-0.5" aria-label="Filtrar por documentos">
                          <FilterIcon className={`h-3 w-3 ${colDocs.length > 0 ? "text-yellow-300" : "text-white/70"}`} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-52 p-3" align="end">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Filtrar por documentos</p>
                        <div className="space-y-2">
                          {[
                            { key: "VALIDADO", label: "Validado" },
                            { key: "COMPLETO", label: "Completo" },
                            { key: "INCOMPLETO", label: "Incompleto" },
                          ].map((opt) => (
                            <label key={opt.key} className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                              <Checkbox
                                checked={colDocs.includes(opt.key)}
                                onCheckedChange={(checked) => {
                                  setColDocs((prev) => checked ? [...prev, opt.key] : prev.filter((x) => x !== opt.key));
                                  setPageIndex(0);
                                }}
                              />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                        {colDocs.length > 0 && (
                          <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => { setColDocs([]); setPageIndex(0); }}>Limpiar</Button>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-white w-[180px]">
                  <div className="flex items-center justify-center gap-1">
                    <span>Acciones</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="hover:bg-white/20 rounded p-0.5" aria-label="Filtrar por acción pendiente">
                          <FilterIcon className={`h-3 w-3 ${colAccion ? "text-yellow-300" : "text-white/70"}`} />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-52 p-3" align="end">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Filtrar por acción</p>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                            <input type="radio" name="col-accion" checked={!colAccion} onChange={() => { setColAccion(""); setPageIndex(0); }} />
                            <span>Todos</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                            <input type="radio" name="col-accion" checked={colAccion === "pendientes"} onChange={() => { setColAccion("pendientes"); setPageIndex(0); }} />
                            <span>Por inscribir</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer">
                            <input type="radio" name="col-accion" checked={colAccion === "inscritos"} onChange={() => { setColAccion("inscritos"); setPageIndex(0); }} />
                            <span>Ya inscritos</span>
                          </label>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
            {data.filter(applicant => applicant.aspiranteEstatus !== "Admitido").map((applicant) => (
              <tr key={applicant.idAspirante} className="hover:bg-gray-50 transition-colors">
                <td className="px-2 py-2 text-gray-900 font-medium text-xs">{applicant.idAspirante}</td>
                <td className="px-2 py-2 text-gray-900">
                  <div className="font-medium text-xs leading-tight">{applicant.nombreCompleto}</div>
                  <div className="text-[10px] text-gray-500 leading-tight">{applicant.email}</div>
                </td>
                <td className="px-2 py-2 text-gray-700 text-xs">{applicant.planEstudios}</td>
                <td className="px-2 py-2 text-gray-700 text-xs">
                  <div>{applicant.telefono}</div>
                  {applicant.celular && (
                    <div className="text-[10px] text-gray-400">{applicant.celular}</div>
                  )}
                </td>
                <td className="px-2 py-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusBadgeClass(applicant.aspiranteEstatus)}`}>
                    {applicant.aspiranteEstatus}
                  </span>
                </td>
                <td className="px-2 py-2 text-gray-700 text-xs">
                  {applicant.usuarioRegistroNombre ? (
                    <span className="truncate block" title={applicant.usuarioRegistroNombre}>
                      {applicant.usuarioRegistroNombre}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic text-[10px]" title="No se tiene registro del usuario que creó este aspirante">
                      Sistema
                    </span>
                  )}
                </td>
                <td className="px-2 py-2 text-gray-700 text-[10px]">{new Date(applicant.fechaRegistro).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                <td className="px-2 py-2 text-center">
                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getPaymentStatusBadgeClass(applicant.estatusPago)}`}>
                    {applicant.estatusPago ?? "SIN"}
                  </span>
                </td>
                <td className="px-2 py-2 text-center">
                  {(() => {
                    const res = resumenDocs[applicant.idAspirante];
                    if (!res) {
                      return (
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getDocumentStatusBadgeClass(applicant.estatusDocumentos)}`}>
                          {applicant.estatusDocumentos ?? "INCOMP"}
                        </span>
                      );
                    }
                    const completos = res.documentosCompletos;
                    const total = res.totalDocumentos;
                    const vencidas = res.prorrogasVencidas;
                    const prorrogas = res.documentosConProrroga;
                    const clase = vencidas > 0
                      ? "bg-red-100 text-red-800 border-red-300"
                      : completos === total
                        ? "bg-green-100 text-green-800 border-green-300"
                        : prorrogas > 0
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-orange-100 text-orange-800 border-orange-300";
                    return (
                      <button
                        type="button"
                        title={vencidas > 0 ? `${vencidas} prórroga(s) vencida(s)` : prorrogas > 0 ? `${prorrogas} con prórroga vigente` : completos === total ? "Todos recibidos" : `${total - completos} pendientes`}
                        className={`inline-flex flex-col items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${clase} hover:opacity-80`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setApplicantForDocuments(applicant);
                          setDocumentsModalOpen(true);
                        }}
                      >
                        <span>{completos}/{total}</span>
                        {vencidas > 0 && <span className="text-[8px]">{vencidas} vencida{vencidas !== 1 ? 's' : ''}</span>}
                        {vencidas === 0 && prorrogas > 0 && <span className="text-[8px]">{prorrogas} prórroga{prorrogas !== 1 ? 's' : ''}</span>}
                      </button>
                    );
                  })()}
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center justify-center gap-1">
                    {applicant.aspiranteEstatus === "Inscrito" ? (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await downloadApplicantEnrollmentReceipt(applicant.idAspirante, true);
                          } catch {
                            toast.error("Error al generar el comprobante de inscripción");
                          }
                        }}
                        title="Imprimir comprobante de inscripción"
                        className="group inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 hover:bg-green-200 text-[10px] font-medium cursor-pointer transition-colors"
                      >
                        <CheckCircle className="h-3 w-3 group-hover:hidden" />
                        <Printer className="h-3 w-3 hidden group-hover:inline" />
                        <span className="group-hover:hidden">Inscrito</span>
                        <span className="hidden group-hover:inline">Comprobante</span>
                      </button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setApplicantToEdit(applicant);
                            setEditModalOpen(true);
                          }}
                          title="Editar aspirante"
                          className="h-6 px-1.5 text-[10px] gap-1"
                        >
                          <Pencil className="h-3 w-3" />
                          Editar
                        </Button>

                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setApplicantToEnroll(applicant);
                            setEnrollModalOpen(true);
                          }}
                          title="Inscribir como estudiante"
                          className="h-6 px-1.5 text-[10px] text-white gap-1"
                          style={{ background: 'linear-gradient(to right, var(--brand-surface), var(--brand-surface-2))' }}
                        >
                          <GraduationCap className="h-3 w-3" />
                          Inscribir
                        </Button>
                      </>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setApplicantForDocuments(applicant);
                          setDocumentsModalOpen(true);
                        }}>
                          <FileText className="mr-2 h-4 w-4" />
                          Documentos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setApplicantForReceipts(applicant);
                          setReceiptsModalOpen(true);
                        }}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pagos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setApplicantForBitacoras(applicant);
                          setBitacorasModalOpen(true);
                        }}>
                          <ClipboardList className="mr-2 h-4 w-4" />
                          Seguimiento
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setApplicantForEstudio(applicant);
                          setEstudioModalOpen(true);
                        }}>
                          <HeartHandshake className="mr-2 h-4 w-4" />
                          Estudio Socioeconómico
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={async () => {
                          try {
                            await downloadApplicantEnrollmentSheet(applicant.idAspirante, true);
                          } catch {
                            toast.error("Error al generar el formato");
                          }
                        }}>
                          <Printer className="mr-2 h-4 w-4" />
                          Formato del Aspirante
                        </DropdownMenuItem>
                        {canHideApplicants && (
                          <>
                            <DropdownMenuSeparator />
                            {verOcultos ? (
                              <DropdownMenuItem
                                onClick={() => handleRestoreApplicant(applicant)}
                                className="text-green-700 focus:text-green-700"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Restaurar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setApplicantToHide(applicant);
                                  setHideDialogOpen(true);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <EyeOff className="mr-2 h-4 w-4" />
                                Ocultar
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </Card>

      <EnrollStudentModal
        open={enrollModalOpen}
        applicant={applicantToEnroll}
        onClose={() => {
          setEnrollModalOpen(false);
          setApplicantToEnroll(null);
        }}
        onEnrollmentSuccess={() => {
          loadApplicants();
        }}
      />
      <ApplicantLogsModal
        open={bitacorasModalOpen}
        applicant={applicantForBitacoras}
        onClose={() => {
          setBitacorasModalOpen(false);
          setApplicantForBitacoras(null);
        }}
      />

      <EstudioSocioeconomicoModal
        open={estudioModalOpen}
        applicant={applicantForEstudio}
        onClose={() => {
          setEstudioModalOpen(false);
          setApplicantForEstudio(null);
        }}
      />

      <DocumentsManagementModal
        open={documentsModalOpen}
        applicant={applicantForDocuments}
        onClose={() => {
          setDocumentsModalOpen(false);
          setApplicantForDocuments(null);
        }}
      />

      <ReceiptsManagementModal
        open={receiptsModalOpen}
        applicant={applicantForReceipts}
        onClose={() => {
          setReceiptsModalOpen(false);
          setApplicantForReceipts(null);
        }}
        onPaymentRegistered={() => {
          loadApplicants();
        }}
      />

      <AlertDialog open={hideDialogOpen} onOpenChange={setHideDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ocultar aspirante</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea ocultar al aspirante <strong>{applicantToHide?.nombreCompleto}</strong>?
              El aspirante no se eliminará del sistema, solo dejará de aparecer en el listado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={hiding}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHideApplicant}
              disabled={hiding}
              className="bg-red-600 hover:bg-red-700"
            >
              {hiding ? "Ocultando..." : "Ocultar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DataTablePagination table={table} />
      {loading && <div className="text-center">Cargando...</div>}
    </div>
  );
}

export default Page;
