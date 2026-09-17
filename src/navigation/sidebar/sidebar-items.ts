import {
  Award,
  Banknote,
  BookOpen,
  BriefcaseBusiness,
  Building,
  Building2,
  Calendar,
  CalendarDays,
  CalendarRange,
  ScrollText,
  ClipboardList,
  DollarSign,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  HandCoins,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  Medal,
  Receipt,
  Settings,
  Shield,
  UserCircle,
  UserPlus,
  Users,
  School,
  Upload,
  NotebookPen,
  User,
  CalendarCheck,
  Key,
  SlidersHorizontal,
  Hash,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  requiredModule?: string;
  requiredPermission?: string;
  badgeKey?: string;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  requiredModule?: string;
  requiredPermission?: string;
  badgeKey?: string;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
  requiredModule?: string;
  requiredRole?: string;
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    requiredModule: "Dashboard",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard/default",
        icon: LayoutDashboard,
        requiredModule: "Dashboard",
      },
    ],
  },
  {
    id: 10,
    label: "MI PORTAL",
    requiredModule: "PortalDocente",
    requiredRole: "docente",
    items: [
      {
        title: "Mi Portal",
        url: "/dashboard/portal-docente",
        icon: LayoutDashboard,
        requiredModule: "PortalDocente",
      },
      {
        title: "Mi Perfil",
        url: "/dashboard/portal-docente/perfil",
        icon: UserCircle,
        requiredModule: "PortalDocente",
      },
      {
        title: "Mis Grupos",
        url: "/dashboard/portal-docente/mis-grupos",
        icon: Users,
        requiredModule: "PortalDocente",
      },
      {
        title: "Asistencia",
        url: "/dashboard/portal-docente/asistencia",
        icon: ClipboardList,
        requiredModule: "PortalDocente",
      },
      {
        title: "Calificaciones",
        url: "/dashboard/portal-docente/calificaciones",
        icon: GraduationCap,
        requiredModule: "PortalDocente",
      },
      {
        title: "Planeaciones",
        url: "/dashboard/portal-docente/planeaciones",
        icon: FileText,
        requiredModule: "PortalDocente",
      },
      {
        title: "Tareas",
        url: "/dashboard/portal-docente/tareas",
        icon: NotebookPen,
        requiredModule: "PortalDocente",
      },
    ],
  },
  {
    id: 2,
    label: "ADMISIONES",
    requiredModule: "Admisiones",
    items: [
      {
        title: "Aspirantes",
        url: "/dashboard/applicants",
        icon: BriefcaseBusiness,
        requiredModule: "Admisiones",
        requiredPermission: "menu.adm.aspirantes",
      },
      {
        title: "Comisiones",
        url: "/dashboard/applicants/commissions",
        icon: HandCoins,
        requiredModule: "Admisiones",
        requiredPermission: "menu.adm.comisiones",
      },
      {
        title: "Promociones",
        url: "/dashboard/convenios",
        icon: HandCoins,
        requiredModule: "Admisiones",
        requiredPermission: "menu.adm.promociones",
        isNew: true,
      },
      {
        title: "Documentacion",
        url: "/dashboard/documentacion-aspirantes",
        icon: ClipboardList,
        requiredModule: "Admisiones",
        requiredPermission: "menu.adm.documentacion",
        isNew: true,
        badgeKey: "prorrogasVencidas",
      },
    ],
  },
  {
    id: 3,
    label: "CATÁLOGOS",
    requiredModule: "Catalogos",
    items: [
      {
        title: "Campus",
        url: "/dashboard/campus",
        icon: Building2,
        requiredModule: "Catalogos",
        requiredPermission: "menu.cat.campus",
      },
      {
        title: "Materias",
        url: "/dashboard/subjects",
        icon: BookOpen,
        requiredModule: "Catalogos",
        requiredPermission: "menu.cat.materias",
      },
      {
        title: "Planes de Estudio",
        url: "/dashboard/study-plans",
        icon: FileText,
        requiredModule: "Catalogos",
        requiredPermission: "menu.cat.planes",
      },
      {
        title: "Periodos Académicos",
        url: "/dashboard/academic-periods",
        icon: Calendar,
        requiredModule: "Catalogos",
        requiredPermission: "menu.cat.periodos",
      },
      {
        title: "Periodicidades",
        url: "/dashboard/periodicities",
        icon: CalendarRange,
        requiredModule: "Catalogos",
        requiredPermission: "menu.cat.periodicidades",
      },
      {
        title: "Días de Impartición",
        url: "/dashboard/dias-imparticion",
        icon: CalendarDays,
        requiredModule: "Catalogos",
        requiredPermission: "menu.cat.dias",
      },
      {
        title: "Documentos Requisito",
        url: "/dashboard/documentos-requisito",
        icon: ClipboardList,
        requiredModule: "Catalogos",
        requiredPermission: "menu.cat.documentos-requisito",
      },
      {
        title: "Empresas",
        url: "/dashboard/empresas",
        icon: Building,
        requiredModule: "Catalogos",
        requiredPermission: "menu.cat.empresas",
        isNew: true,
      },
    ],
  },
  {
    id: 4,
    label: "CONTROL ESCOLAR",
    requiredModule: "Estudiantes",
    items: [
      {
        title: "Gestión Estudiantil",
        url: "/students",
        icon: Users,
        requiredModule: "Estudiantes",
        subItems: [
          { title: "Estudiantes por Grupo", url: "/dashboard/students", newTab: false, requiredModule: "Estudiantes", requiredPermission: "menu.ce.estudiantes-grupo" },
          { title: "Inscripción a Grupos", url: "/dashboard/group-enrollment", newTab: false, requiredModule: "Estudiantes", requiredPermission: "menu.ce.inscripcion-grupos" },
          { title: "Diagnóstico de Inscripciones", url: "/dashboard/diagnostico-inscripcion", newTab: false, requiredModule: "Estudiantes", requiredPermission: "menu.ce.diagnostico", isNew: true },
          { title: "Calificaciones", url: "/dashboard/grades", newTab: false, requiredModule: "Academico", requiredPermission: "menu.ce.calificaciones" },
          { title: "Captura de Calificaciones", url: "/dashboard/captura-calificaciones", newTab: false, requiredModule: "Academico", requiredPermission: "menu.ce.captura-calificaciones", isNew: true },
          { title: "Asistencias", url: "/dashboard/attendances", newTab: false, requiredModule: "Academico", requiredPermission: "menu.ce.asistencias" },
        ],
      },
      {
        title: "Documentos",
        url: "/dashboard/documentos-estudiante",
        icon: Award,
        requiredModule: "Estudiantes",
        requiredPermission: "menu.ce.documentos",
        isNew: true,
      },
      {
        title: "Panel de Solicitudes",
        url: "/dashboard/documentos-solicitudes",
        icon: ClipboardList,
        requiredModule: "Estudiantes",
        requiredPermission: "menu.ce.solicitudes",
        isNew: true,
        badgeKey: "solicitudesDocumentos",
      },
      {
        title: "Importar Estudiantes",
        url: "/dashboard/importar-estudiantes",
        icon: FileSpreadsheet,
        requiredModule: "Estudiantes",
        requiredPermission: "menu.ce.importar",
        isNew: true,
      },
      {
        title: "Inscribir a Grupos",
        url: "/dashboard/inscribir-estudiantes-grupo",
        icon: UserPlus,
        requiredModule: "Estudiantes",
        requiredPermission: "menu.ce.inscribir",
        isNew: true,
      },
      {
        title: "Reportes Académicos",
        url: "/dashboard/reportes-academicos",
        icon: FileBarChart,
        requiredModule: "Estudiantes",
        requiredPermission: "menu.ce.reportes-academicos",
      },
      {
        title: "Constructor de Reportes",
        url: "/dashboard/reportes-builder",
        icon: FileBarChart,
        requiredModule: "Estudiantes",
        requiredPermission: "menu.ce.constructor-reportes",
        isNew: true,
      },
      {
        title: "Egresados y Titulados",
        url: "/dashboard/egresados",
        icon: GraduationCap,
        requiredModule: "Estudiantes",
        requiredPermission: "menu.ce.egresados",
        isNew: true,
      },
      {
        title: "Accesos de Alumnos / Docentes",
        url: "/dashboard/accesos-alumnos-docentes",
        icon: Key,
        requiredModule: "Estudiantes",
        requiredPermission: "menu.ce.accesos",
        isNew: true,
      },
    ],
  },
  {
    id: 13,
    label: "TITULACIÓN",
    items: [
      {
        title: "Titulación Directa",
        url: "/dashboard/titulacion-directa",
        icon: Medal,
        requiredModule: "TitulacionDirecta",
        requiredPermission: "menu.tit.directa",
        isNew: true,
      },
      {
        title: "Titulación Escolarizada",
        url: "/dashboard/titulacion-escolarizada",
        icon: GraduationCap,
        requiredModule: "TitulacionEscolarizada",
        requiredPermission: "menu.tit.escolarizada",
        isNew: true,
        comingSoon: true,
      },
      {
        title: "Catálogos SEP",
        url: "/dashboard/titulacion-catalogos",
        icon: BookOpen,
        requiredModule: "TitulacionDirecta",
        requiredPermission: "menu.tit.catalogos-sep",
        isNew: true,
      },
      {
        title: "Configuración SEP",
        url: "/dashboard/titulacion-configuracion",
        icon: Settings,
        requiredModule: "TitulacionDirecta",
        requiredPermission: "menu.tit.configuracion-sep",
        isNew: true,
      },
    ],
  },
  {
    id: 5,
    label: "ACADÉMICO",
    requiredModule: "Academico",
    items: [
      {
        title: "Gestión Académica",
        url: "/academic",
        icon: GraduationCap,
        requiredModule: "Academico",
        subItems: [
          { title: "Grupos", url: "/dashboard/academic-management", newTab: false, requiredModule: "Academico", requiredPermission: "menu.aca.grupos" },
          { title: "Promoción", url: "/dashboard/promotions", newTab: false, requiredModule: "Academico", requiredPermission: "menu.aca.promocion", isNew: true },
          { title: "Horarios", url: "/dashboard/schedules", newTab: false, requiredModule: "Academico", requiredPermission: "menu.aca.horarios" },
          { title: "Docentes", url: "/dashboard/teachers", newTab: false, requiredModule: "Academico", requiredPermission: "menu.aca.docentes" },
          { title: "Solicitudes de Plan", url: "/dashboard/solicitudes-plan", newTab: false, requiredModule: "Academico", requiredPermission: "menu.aca.solicitudes-plan", isNew: true },
        ],
      },
    ],
  },
  {
    id: 6,
    label: "FINANZAS",
    requiredModule: "Finanzas",
    items: [
      {
        title: "Caja",
        url: "/dashboard/cashier",
        icon: DollarSign,
        isNew: true,
        requiredModule: "Finanzas",
        requiredPermission: "menu.fin.caja",
      },
      {
        title: "Recibos",
        url: "/receipts",
        icon: Receipt,
        requiredModule: "Finanzas",
        subItems: [
          { title: "Administración", url: "/dashboard/receipts", newTab: false, requiredModule: "Finanzas", requiredPermission: "menu.fin.recibos-admin" },
          { title: "Mis Recibos", url: "/dashboard/receipts/my-receipts", newTab: false, isNew: true },
        ],
      },
      {
        title: "Gestión Financiera",
        url: "/financial",
        icon: Banknote,
        requiredModule: "Finanzas",
        subItems: [
          { title: "Corte de Caja", url: "/dashboard/cashier/corte", newTab: false, isNew: true, requiredModule: "Finanzas", requiredPermission: "menu.fin.corte" },
          { title: "Plantillas de Cobro", url: "/dashboard/payment-templates", newTab: false, isNew: true, requiredModule: "Finanzas", requiredPermission: "menu.fin.plantillas" },
          { title: "Conceptos de Pago", url: "/dashboard/payment-concepts", newTab: false, isNew: true, requiredModule: "Finanzas", requiredPermission: "menu.fin.conceptos" },
          { title: "Tarifas de Admisión", url: "/dashboard/tarifas-admision", newTab: false, isNew: true, requiredModule: "Finanzas", requiredPermission: "menu.fin.tarifas" },
          { title: "Becas", url: "/dashboard/scholarships", newTab: false, isNew: true, requiredModule: "Finanzas", requiredPermission: "menu.fin.becas" },
          { title: "Pagos", url: "/dashboard/payments", newTab: false, requiredModule: "Finanzas", requiredPermission: "menu.fin.pagos" },
          { title: "Reportes", url: "/dashboard/reports", newTab: false, requiredModule: "Finanzas", requiredPermission: "menu.fin.reportes" },
          { title: "Solicitudes de Baja", url: "/dashboard/solicitudes-baja", newTab: false, isNew: true, requiredModule: "Finanzas", requiredPermission: "menu.fin.solicitudes-baja", badgeKey: "solicitudesBaja" },
        ],
      },
    ],
  },
  {
    id: 9,
    label: "AUDITORÍA",
    requiredModule: "Bitacora",
    items: [
      {
        title: "Bitácora",
        url: "/dashboard/bitacora",
        icon: ScrollText,
        requiredModule: "Bitacora",
      },
    ],
  },
  {
    id: 12,
    label: "SOPORTE",
    items: [
      {
        title: "Manual de Usuario",
        url: "/dashboard/manual",
        icon: BookOpen,
      },
      {
        title: "Tickets",
        url: "/dashboard/tickets",
        icon: LifeBuoy,
      },
    ],
  },
  {
    id: 7,
    label: "CONFIGURACIÓN",
    requiredModule: "Configuracion",
    items: [
      {
        title: "Usuarios",
        url: "/dashboard/users",
        icon: UserCircle,
        requiredModule: "Configuracion",
        requiredPermission: "menu.cfg.usuarios",
      },
      {
        title: "Roles y Permisos",
        url: "/dashboard/roles",
        icon: Shield,
        requiredModule: "Configuracion",
        requiredPermission: "menu.cfg.roles",
        isNew: true,
      },
      {
        title: "Bitácora",
        url: "/dashboard/bitacora",
        icon: ScrollText,
        requiredModule: "Configuracion",
        requiredPermission: "menu.cfg.bitacora",
        isNew: true,
      },
      {
        title: "Usuarios Azure AD",
        url: "/dashboard/usuarios-azure",
        icon: Users,
        requiredModule: "Configuracion",
        requiredPermission: "menu.cfg.usuarios-azure",
        isNew: true,
      },
      {
        title: "Correos Azure",
        url: "/dashboard/correos-azure",
        icon: Mail,
        requiredModule: "Configuracion",
        requiredPermission: "menu.cfg.correos-azure",
        isNew: true,
      },
      {
        title: "Plantillas de Reportes",
        url: "/dashboard/plantillas-reporte",
        icon: FileText,
        requiredModule: "Configuracion",
        requiredPermission: "menu.cfg.plantillas-reporte",
        isNew: true,
      },
      {
        title: "Configuración de Calificaciones",
        url: "/dashboard/configuracion-calificaciones",
        icon: SlidersHorizontal,
        requiredModule: "Configuracion",
        requiredPermission: "menu.cfg.config-calificaciones",
        isNew: true,
      },
      {
        title: "Configuración de Matrículas",
        url: "/dashboard/configuracion-matriculas",
        icon: Hash,
        requiredModule: "Configuracion",
        requiredPermission: "menu.cfg.config-matriculas",
        isNew: true,
      },
    ],
  },
  {
    id: 8,
    label: "AGREMIADOS",
    requiredModule: "SuperAdmin",
    items: [
      {
        title: "Panel de Agremiados",
        url: "/dashboard/super-admin",
        icon: School,
        requiredModule: "SuperAdmin",
        isNew: true,
      },
      {
        title: "Instituciones Agremiadas",
        url: "/dashboard/super-admin/tenants",
        icon: Building2,
        requiredModule: "SuperAdmin",
      },
      {
        title: "Importar Agremiados",
        url: "/dashboard/super-admin/tenants/import",
        icon: Upload,
        requiredModule: "SuperAdmin",
        isNew: true,
      },
    ],
  },
  {
    id: 11,
    label: "MI PORTAL",
    requiredModule: "PortalAlumno",
    requiredRole: "alumno",
    items: [
      {
        title: "Mi Perfil",
        url: "/dashboard/portal-alumno/mi-perfil",
        icon: User,
        requiredModule: "PortalAlumno",
      },
      {
        title: "Mis Materias",
        url: "/dashboard/portal-alumno/mis-materias",
        icon: BookOpen,
        requiredModule: "PortalAlumno",
      },
      {
        title: "Mis Formatos",
        url: "/dashboard/portal-alumno/mis-formatos",
        icon: FileText,
        requiredModule: "PortalAlumno",
      },
      {
        title: "Mis Calificaciones",
        url: "/dashboard/portal-alumno/mis-calificaciones",
        icon: GraduationCap,
        requiredModule: "PortalAlumno",
      },
      {
        title: "Mi Asistencia",
        url: "/dashboard/portal-alumno/mi-asistencia",
        icon: CalendarCheck,
        requiredModule: "PortalAlumno",
      },
      {
        title: "Mis Pagos",
        url: "/dashboard/portal-alumno/mis-pagos",
        icon: DollarSign,
        requiredModule: "PortalAlumno",
      },
      {
        title: "Mis Tareas",
        url: "/dashboard/portal-alumno/tareas",
        icon: NotebookPen,
        requiredModule: "PortalAlumno",
      },
    ],
  },
];

export function filterSidebarByModules(
  accessibleModules: string[],
  userRole?: string,
  viewablePermissions?: Set<string>,
): NavGroup[] {
  const puedeVer = (requiredModule?: string, requiredPermission?: string): boolean => {
    if (requiredModule && !accessibleModules.includes(requiredModule)) return false;
    if (requiredPermission && viewablePermissions && !viewablePermissions.has(requiredPermission)) return false;
    return true;
  };

  return sidebarItems
    .filter((group) => {
      if (group.requiredRole && userRole !== group.requiredRole) return false;
      if (!group.requiredModule) return true;
      return accessibleModules.includes(group.requiredModule);
    })
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => puedeVer(item.requiredModule, item.requiredPermission))
        .map((item) => ({
          ...item,
          subItems: item.subItems?.filter((subItem) => puedeVer(subItem.requiredModule, subItem.requiredPermission)),
        }))
        .filter((item) => !item.subItems || item.subItems.length > 0),
    }))
    .filter((group) => group.items.length > 0);
}
