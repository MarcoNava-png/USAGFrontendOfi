"use client";

import { useCallback, useMemo, useState } from "react";

import { BookOpen, Search, Info, ChevronRight, Compass, ListChecks, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePermissions } from "@/hooks/use-permissions";

type Rol = "admin" | "dir" | "coord" | "ce" | "adm" | "fin" | "doc" | "al" | "sa";
type Tag = "new" | "soon" | "usag";

interface Modulo {
  t: string;
  d: string;
  a?: string;
  tag?: Tag;
  roles: Rol[];
  features?: string[];
}
interface Seccion {
  id: string;
  title: string;
  who: string;
  mods: Modulo[];
}

const ROLES: Record<Rol, string> = {
  admin: "Administrador",
  dir: "Dirección",
  coord: "Coordinación",
  ce: "Control Escolar",
  adm: "Admisiones",
  fin: "Caja / Finanzas",
  doc: "Docente",
  al: "Alumno",
  sa: "SuperAdmin",
};

const SECTIONS: Seccion[] = [
  {
    id: "inicio",
    title: "Inicio",
    who: "Todos los roles",
    mods: [
      {
        t: "Dashboard",
        d: "Pantalla de entrada con indicadores clave: matrícula, aspirantes por campus, cobranza y cartera vencida. Los directores y coordinadores ven solo la información de su campus asignado.",
        a: "Consultar KPIs, gráficas y accesos rápidos",
        roles: ["admin", "dir", "coord"],
        features: [
          "Ver totales de alumnos, grupos y aspirantes del periodo actual.",
          "Revisar la cobranza del mes y la cartera vencida de un vistazo.",
          "Consultar aspirantes por campus (los directores ven solo su plantel).",
          "Usar los accesos rápidos para saltar a los módulos más frecuentes.",
        ],
      },
    ],
  },
  {
    id: "admisiones",
    title: "Admisiones",
    who: "Admisiones · Dirección",
    mods: [
      {
        t: "Aspirantes",
        d: "Registro y seguimiento de aspirantes durante el proceso de admisión, con sus estatus (En Proceso / Inscrito), documentos y pagos. Desde aquí un aspirante se convierte en alumno inscrito.",
        a: "Alta de aspirante, cambio de estatus, conversión a alumno",
        roles: ["adm", "dir"],
        features: [
          "Registrar un nuevo aspirante con sus datos y plan de interés.",
          "Dar seguimiento a su estatus: En Proceso → Inscrito.",
          "Adjuntar y revisar sus documentos y pagos de admisión.",
          "Convertir al aspirante en alumno inscrito cuando cumple requisitos.",
        ],
      },
      {
        t: "Comisiones",
        d: "Gestión de comisiones de asesores o promotores según los aspirantes captados, para el cálculo de incentivos.",
        a: "Configurar y consultar comisiones por asesor",
        roles: ["adm", "dir"],
        features: [
          "Asignar aspirantes a un asesor o promotor.",
          "Calcular las comisiones generadas por captación.",
          "Consultar reportes de comisiones por asesor y periodo.",
        ],
      },
      {
        t: "Promociones",
        d: "Convenios y campañas de promoción (descuentos, becas de captación) que se aplican a los aspirantes.",
        a: "Crear convenios y asignarlos a aspirantes",
        roles: ["adm", "dir"],
        features: [
          "Crear convenios y campañas con descuentos.",
          "Aplicar la promoción a los aspirantes que califiquen.",
          "Consultar qué aspirantes tienen promoción vigente.",
        ],
      },
      {
        t: "Documentación",
        d: "Checklist de documentos requeridos por cada aspirante, según el plan de estudios. Permite subir, revisar y validar cada documento (Pendiente / Subido / Validado / Rechazado).",
        a: "Subir, validar o rechazar documentos del aspirante",
        roles: ["adm", "ce"],
        features: [
          "Ver la lista de documentos que pide el plan del aspirante.",
          "Subir el archivo de cada documento.",
          "Validar o rechazar cada documento con su motivo.",
          "Seguir el estatus: Pendiente, Subido, Validado o Rechazado.",
        ],
      },
    ],
  },
  {
    id: "catalogos",
    title: "Catálogos",
    who: "Administrador · Control Escolar",
    mods: [
      {
        t: "Campus",
        d: "Alta y administración de los planteles/campus de la institución. Grupos, aspirantes y alumnos derivan su campus del plan de estudios.",
        a: "Crear y editar campus",
        roles: ["admin", "ce"],
        features: ["Registrar cada plantel/campus.", "Editar sus datos y estatus.", "Base para aislar la información por campus."],
      },
      {
        t: "Materias",
        d: "Catálogo de asignaturas que después se asocian a los planes de estudio por cuatrimestre.",
        a: "Alta y edición de materias",
        roles: ["admin", "ce", "coord"],
        features: ["Crear asignaturas con su clave y créditos.", "Editarlas o darlas de baja.", "Usarlas al armar los planes de estudio."],
      },
      {
        t: "Planes de Estudio",
        d: "Definición de cada carrera/plan: sus materias por cuatrimestre, RVOE y los documentos requisito que se solicitarán a sus aspirantes.",
        a: "Configurar materias por periodo y documentos del plan",
        roles: ["admin", "ce", "coord"],
        features: [
          "Crear la carrera/plan con su RVOE.",
          "Asignar las materias de cada cuatrimestre.",
          "Elegir qué documentos requisito pide ese plan (si no eliges ninguno, se piden todos).",
        ],
      },
      {
        t: "Periodos Académicos",
        d: "Ciclos escolares (cuatrimestres/semestres). Cada periodo define sus fechas de captura de calificaciones.",
        a: "Crear periodos y definir ventanas de captura",
        roles: ["admin", "ce"],
        features: ["Crear cada periodo/ciclo.", "Definir las fechas de captura de calificaciones.", "Marcar el periodo vigente."],
      },
      {
        t: "Periodicidades",
        d: "Configuración de la frecuencia/estructura de los periodos que usa la institución.",
        a: "Definir periodicidades",
        roles: ["admin", "ce"],
        features: ["Definir la estructura de periodos (cuatrimestral, semestral, etc.)."],
      },
      {
        t: "Días de Impartición",
        d: "Catálogo de días en que se imparten clases, usado por horarios y grupos.",
        a: "Configurar días de clase",
        roles: ["admin", "ce"],
        features: ["Configurar los días hábiles de clase.", "Se usan al armar horarios y grupos."],
      },
      {
        t: "Documentos Requisito",
        d: "Catálogo maestro de documentos (Acta, CURP, INE, certificados…). Desde Planes de Estudio se elige cuáles pide cada carrera; si un plan no configura ninguno, se solicitan todos.",
        a: "Alta de documentos y su clave",
        roles: ["admin", "ce"],
        features: [
          "Dar de alta cada documento con su clave y descripción.",
          "Marcarlo activo/obligatorio.",
          "Después se seleccionan por plan desde Planes de Estudio.",
        ],
      },
      {
        t: "Empresas",
        d: "Catálogo de empresas para convenios, prácticas o vinculación.",
        a: "Registrar empresas y convenios",
        roles: ["admin", "adm"],
        features: ["Registrar empresas.", "Vincularlas a convenios o prácticas."],
      },
    ],
  },
  {
    id: "control",
    title: "Control Escolar",
    who: "Control Escolar · Dirección · Coordinación",
    mods: [
      {
        t: "Estudiantes por Grupo",
        d: "Vista de los alumnos inscritos en cada grupo, con acceso a su expediente y movimientos.",
        a: "Consultar y gestionar alumnos del grupo",
        roles: ["ce", "coord"],
        features: ["Ver los alumnos de cada grupo.", "Entrar al expediente de un alumno.", "Realizar movimientos (baja, cambio) desde el grupo."],
      },
      {
        t: "Inscripción a Grupos",
        d: "Inscribe alumnos a los grupos del periodo, incluyendo alumnos irregulares y cambios de grupo (que mueven sus materias).",
        a: "Inscribir, cambiar de grupo, agregar irregular",
        roles: ["ce"],
        features: [
          "Inscribir alumnos al grupo del periodo.",
          "Agregar alumnos irregulares con materias específicas.",
          "Cambiar de grupo a un alumno (mueve sus materias automáticamente).",
        ],
      },
      {
        t: "Diagnóstico de Inscripciones",
        d: "Herramienta de verificación que detecta inscripciones partidas o inconsistentes y ayuda a corregirlas.",
        tag: "new",
        a: "Detectar y resolver inscripciones inconsistentes",
        roles: ["ce"],
        features: ["Detectar inscripciones partidas o duplicadas.", "Ver el detalle del problema.", "Corregir la inconsistencia."],
      },
      {
        t: "Calificaciones",
        d: "Consulta y administración de calificaciones por grupo y materia, con filtro por periodo. Permite captura directa de la calificación final cuando aplica.",
        a: "Consultar/ajustar calificaciones por periodo",
        roles: ["ce", "coord", "doc"],
        features: [
          "Filtrar por periodo, grupo y materia.",
          "Consultar las calificaciones de los alumnos.",
          "Capturar directamente la calificación final cuando aplica.",
        ],
      },
      {
        t: "Captura de Calificaciones",
        d: "Registro de calificaciones por parcial dentro de las ventanas de captura del periodo, con control de prórrogas y avance.",
        tag: "new",
        a: "Capturar parciales por alumno dentro de la ventana",
        roles: ["doc", "ce"],
        features: [
          "Capturar la calificación de cada parcial por alumno.",
          "Solo dentro de la ventana de captura del periodo.",
          "Ver el avance de captura y solicitar prórroga si se requiere.",
        ],
      },
      {
        t: "Asistencias",
        d: "Registro y consulta de asistencia de los alumnos por grupo y sesión.",
        a: "Tomar y consultar asistencia",
        roles: ["doc", "ce"],
        features: ["Tomar asistencia por grupo y sesión.", "Consultar el historial de asistencia de cada alumno."],
      },
      {
        t: "Documentos (del estudiante)",
        d: "Expediente documental de cada alumno ya inscrito: carga y validación de sus documentos.",
        a: "Administrar documentos del alumno",
        roles: ["ce"],
        features: ["Cargar los documentos del alumno.", "Validarlos o rechazarlos.", "Ver el estatus del expediente."],
      },
      {
        t: "Panel de Solicitudes",
        d: "Bandeja de solicitudes de documentos (constancias, kardex, etc.) para su atención y seguimiento.",
        a: "Atender solicitudes de documentos",
        roles: ["ce"],
        features: ["Ver las solicitudes de documentos pendientes.", "Atenderlas y marcarlas como resueltas."],
      },
      {
        t: "Importar Estudiantes",
        d: "Alta masiva de alumnos desde un archivo Excel, con validación de datos.",
        a: "Cargar alumnos por Excel",
        roles: ["ce", "admin"],
        features: ["Descargar la plantilla Excel.", "Cargar el archivo con los alumnos.", "Revisar la validación antes de confirmar."],
      },
      {
        t: "Inscribir a Grupos",
        d: "Flujo dedicado para inscribir estudiantes a grupos de forma guiada, incluyendo generación de acceso.",
        a: "Inscripción guiada + acceso del alumno",
        roles: ["ce"],
        features: ["Inscripción paso a paso a un grupo.", "Generar el acceso (usuario/contraseña) del alumno en el mismo flujo."],
      },
      {
        t: "Reportes Académicos",
        d: "Kardex, actas y reportes escolares oficiales, exportables (incluye kardex en Excel).",
        a: "Generar kardex, actas y reportes",
        roles: ["ce", "coord", "dir"],
        features: ["Generar el kardex del alumno.", "Emitir actas de calificaciones.", "Exportar a Excel/PDF."],
      },
      {
        t: "Constructor de Reportes",
        d: "Diseñador de reportes configurables: eliges fuente (estudiantes, aspirantes, calificaciones, grupos, recibos, pagos), columnas, filtros, orden y agrupación; guardas la definición y exportas a Excel o PDF.",
        tag: "new",
        a: "Crear, guardar y exportar reportes a medida",
        roles: ["ce", "dir", "admin"],
        features: [
          "Elegir la fuente de datos (alumnos, pagos, calificaciones, etc.).",
          "Seleccionar columnas, filtros, orden y agrupación con subtotales.",
          "Guardar la definición para reutilizarla.",
          "Exportar a Excel o PDF.",
        ],
      },
      {
        t: "Egresados y Titulados",
        d: "Registro y consulta de egresados y alumnos titulados de la institución.",
        a: "Consultar egresados y titulados",
        roles: ["ce", "dir"],
        features: ["Consultar el listado de egresados.", "Ver los alumnos ya titulados."],
      },
      {
        t: "Accesos de Alumnos / Docentes",
        d: "Genera las credenciales de acceso (usuario y contraseña) para alumnos y docentes, con la opción de crear su correo institucional.",
        a: "Crear/reestablecer accesos y correos",
        roles: ["ce", "admin"],
        features: [
          "Generar usuario y contraseña de alumnos y docentes.",
          "Reestablecer una contraseña.",
          "Crear su correo institucional (Microsoft 365) cuando aplica.",
        ],
      },
    ],
  },
  {
    id: "academico",
    title: "Académico",
    who: "Coordinación · Dirección",
    mods: [
      {
        t: "Grupos",
        d: "Administración de grupos: creación, turnos, materias asignadas y generación de cuatrimestres anteriores para cohortes.",
        a: "Crear grupos y generar cuatrimestres previos",
        roles: ["coord", "ce"],
        features: ["Crear grupos con su turno y materias.", "Asignar el periodo y plan.", "Generar hacia atrás los cuatrimestres anteriores de una cohorte."],
      },
      {
        t: "Promoción",
        d: "Promoción de alumnos al siguiente periodo, de forma individual o masiva por cohorte.",
        tag: "new",
        a: "Promover alumnos al siguiente cuatrimestre",
        roles: ["coord", "ce"],
        features: ["Promover un alumno al siguiente cuatrimestre.", "Promoción masiva por cohorte/grupo."],
      },
      {
        t: "Horarios",
        d: "Definición de horarios de clase por grupo, materia y docente.",
        a: "Armar horarios por grupo",
        roles: ["coord"],
        features: ["Asignar materias, docentes y horas a cada grupo.", "Ver el horario armado del grupo."],
      },
      {
        t: "Docentes",
        d: "Catálogo y asignación de docentes a los grupos y materias.",
        a: "Alta de docentes y asignación a grupos",
        roles: ["coord", "admin"],
        features: ["Dar de alta docentes.", "Asignarlos a grupos y materias."],
      },
      {
        t: "Solicitudes de Plan",
        d: "Gestión de solicitudes relacionadas con los planes de estudio.",
        tag: "new",
        a: "Revisar y atender solicitudes de plan",
        roles: ["coord", "ce"],
        features: ["Revisar solicitudes relacionadas con el plan.", "Aprobarlas o rechazarlas."],
      },
    ],
  },
  {
    id: "titulacion",
    title: "Titulación",
    who: "Control Escolar · Dirección",
    mods: [
      {
        t: "Titulación Directa",
        d: "Proceso de titulación electrónica ante la SEP: genera el XML v3.0, lo sella (SHA256/RSA) y lo envía por el servicio web oficial.",
        a: "Generar, sellar y enviar títulos a la SEP",
        roles: ["ce", "dir"],
        features: ["Generar el XML del título (v3.0).", "Sellarlo digitalmente.", "Enviarlo a la SEP por el servicio oficial."],
      },
      {
        t: "Titulación Escolarizada",
        d: "Módulo de titulación por vía escolarizada.",
        tag: "soon",
        roles: ["ce", "dir"],
        features: ["Función en desarrollo — aún no disponible."],
      },
      {
        t: "Catálogos SEP",
        d: "Catálogos oficiales de carreras y asignaturas de la SEP usados para la titulación electrónica.",
        a: "Consultar catálogos de carreras/asignaturas SEP",
        roles: ["ce"],
        features: ["Consultar las carreras y asignaturas oficiales de la SEP.", "Se usan para armar el XML de titulación."],
      },
      {
        t: "Configuración SEP",
        d: "Parámetros de la institución para el envío a la SEP (identificadores, credenciales del servicio).",
        a: "Configurar datos de conexión con la SEP",
        roles: ["admin", "ce"],
        features: ["Capturar los identificadores de la institución.", "Configurar las credenciales del servicio de la SEP."],
      },
    ],
  },
  {
    id: "finanzas",
    title: "Finanzas",
    who: "Caja · Finanzas · Dirección",
    mods: [
      {
        t: "Caja",
        d: "Punto de cobro: registra pagos de colegiaturas, inscripciones y otros conceptos, y emite el recibo correspondiente.",
        a: "Cobrar y emitir recibos",
        roles: ["fin"],
        features: ["Buscar al alumno y sus adeudos.", "Registrar el pago del concepto.", "Emitir el recibo."],
      },
      {
        t: "Recibos",
        d: "Administración de recibos emitidos y, para el alumno, la consulta de sus propios recibos.",
        a: "Consultar/administrar recibos",
        roles: ["fin", "al"],
        features: ["Consultar los recibos emitidos.", "El alumno ve sus propios recibos.", "Reimprimir o cancelar (según permiso)."],
      },
      {
        t: "Corte de Caja",
        d: "Cierre de caja por turno/cajero con el resumen de movimientos del periodo.",
        tag: "new",
        a: "Realizar corte de caja",
        roles: ["fin"],
        features: ["Ver el resumen de movimientos del turno.", "Realizar el corte por cajero.", "Cerrar la caja del día."],
      },
      {
        t: "Plantillas de Cobro",
        d: "Define los planes de pago (mensualidades por mes y descripción). Genera solo los meses faltantes para no duplicar.",
        tag: "new",
        a: "Configurar y generar mensualidades",
        roles: ["fin", "admin"],
        features: ["Definir el plan de mensualidades (mes y monto).", "Generar los recibos por mes.", "Solo crea los meses faltantes (no duplica)."],
      },
      {
        t: "Conceptos de Pago",
        d: "Catálogo de conceptos cobrables (colegiatura, inscripción, exámenes, etc.).",
        tag: "new",
        a: "Alta de conceptos de pago",
        roles: ["fin", "admin"],
        features: ["Dar de alta cada concepto cobrable.", "Definir su monto por defecto."],
      },
      {
        t: "Tarifas de Admisión",
        d: "Configuración de las tarifas asociadas al proceso de admisión.",
        tag: "new",
        a: "Definir tarifas de admisión",
        roles: ["fin", "adm"],
        features: ["Configurar las tarifas del proceso de admisión."],
      },
      {
        t: "Becas",
        d: "Administración de becas y descuentos aplicados a los alumnos.",
        tag: "new",
        a: "Otorgar y administrar becas",
        roles: ["fin", "dir"],
        features: ["Otorgar becas o descuentos a un alumno.", "Definir el porcentaje o monto.", "Consultar las becas vigentes."],
      },
      {
        t: "Pagos",
        d: "Consulta y control de los pagos realizados por los alumnos, aplicados a recibos y periodos.",
        a: "Consultar y conciliar pagos",
        roles: ["fin"],
        features: ["Consultar los pagos por alumno y periodo.", "Ver a qué recibo se aplicó cada pago."],
      },
      {
        t: "Reportes (Finanzas)",
        d: "Reportes financieros: ingresos, cartera y estados de cuenta.",
        a: "Generar reportes financieros",
        roles: ["fin", "dir"],
        features: ["Reporte de ingresos por periodo.", "Cartera vencida.", "Estado de cuenta del alumno."],
      },
      {
        t: "Solicitudes de Baja",
        d: "Gestión de solicitudes de baja de alumnos y su impacto financiero.",
        tag: "new",
        a: "Atender solicitudes de baja",
        roles: ["fin", "ce"],
        features: ["Ver las solicitudes de baja.", "Revisar el impacto financiero.", "Autorizar o rechazar la baja."],
      },
    ],
  },
  {
    id: "auditoria",
    title: "Auditoría",
    who: "Administrador · Dirección",
    mods: [
      {
        t: "Bitácora",
        d: "Registro de acciones realizadas en el sistema (quién, qué y cuándo) para trazabilidad y auditoría.",
        a: "Consultar el historial de acciones",
        roles: ["admin", "dir"],
        features: ["Ver quién hizo cada acción y cuándo.", "Filtrar por usuario, fecha o módulo.", "Trazabilidad para auditoría."],
      },
    ],
  },
  {
    id: "soporte",
    title: "Soporte",
    who: "Todos los roles",
    mods: [
      {
        t: "Manual de Usuario",
        d: "Esta guía: referencia de todas las funcionalidades del sistema, por módulo, con quién las usa y sus acciones principales.",
        a: "Consultar y buscar módulos",
        roles: ["admin", "dir", "coord", "ce", "adm", "fin", "doc", "al"],
        features: ["Buscar cualquier módulo.", "Abrir el detalle de cada uno.", "Ver quién lo usa y cómo llegar."],
      },
      {
        t: "Tickets",
        d: "Levantamiento y seguimiento de incidencias o solicitudes internas. Genera alertas por correo a los responsables.",
        a: "Crear y dar seguimiento a tickets",
        roles: ["admin", "ce", "adm", "fin"],
        features: ["Crear un ticket con su prioridad.", "Dar seguimiento hasta cerrarlo.", "Recibir alertas por correo."],
      },
    ],
  },
  {
    id: "config",
    title: "Configuración",
    who: "Administrador",
    mods: [
      {
        t: "Usuarios",
        d: "Alta y administración de usuarios del sistema, con su rol y campus asignado (que aísla lo que ven).",
        a: "Crear usuarios y asignar rol/campus",
        roles: ["admin"],
        features: ["Crear un usuario con su correo y contraseña.", "Asignar su rol.", "Asignar campus (limita lo que ve)."],
      },
      {
        t: "Roles y Permisos",
        d: "Definición de roles y de los módulos/acciones que cada uno puede usar.",
        a: "Configurar permisos por rol",
        roles: ["admin"],
        features: ["Crear o editar roles.", "Definir qué módulos ve cada rol.", "Controlar las acciones permitidas."],
      },
      {
        t: "Bitácora",
        d: "Acceso a la bitácora de auditoría desde Configuración.",
        a: "Consultar auditoría",
        roles: ["admin"],
        features: ["Mismo registro de auditoría, accesible desde Configuración."],
      },
      {
        t: "Usuarios Azure AD",
        d: "Administración de usuarios/buzones de Microsoft 365 sobre el directorio corporativo.",
        tag: "usag",
        a: "Crear/consultar usuarios M365",
        roles: ["admin"],
        features: ["Consultar los usuarios de Microsoft 365.", "Crear buzones.", "Asignar licencias.", "Exclusivo de la institución con M365 propio."],
      },
      {
        t: "Correos Azure",
        d: "Bandeja y envío de correos institucionales vía Microsoft 365.",
        tag: "usag",
        a: "Consultar y enviar correos M365",
        roles: ["admin"],
        features: ["Ver la bandeja de correos institucionales.", "Enviar correos vía Microsoft 365."],
      },
      {
        t: "Plantillas de Reportes",
        d: "Gestión de las definiciones de reporte guardadas del Constructor de Reportes.",
        a: "Administrar plantillas guardadas",
        roles: ["admin", "ce"],
        features: ["Ver las plantillas de reporte guardadas.", "Editarlas o eliminarlas."],
      },
      {
        t: "Configuración de Calificaciones",
        d: "Parámetros de evaluación de la institución: escala, mínima aprobatoria, decimales, redondeo y los parciales.",
        a: "Definir escala, mínima aprobatoria y parciales",
        roles: ["admin", "coord"],
        features: [
          "Definir la escala (por ejemplo, 0–10).",
          "Fijar la calificación mínima aprobatoria.",
          "Configurar decimales y redondeo.",
          "Administrar los parciales del ciclo.",
        ],
      },
    ],
  },
  {
    id: "portal-docente",
    title: "Mi Portal — Docente",
    who: "Docente",
    mods: [
      { t: "Mi Portal", d: "Página de inicio del docente con sus pendientes y accesos rápidos.", a: "Ver resumen del docente", roles: ["doc"], features: ["Ver pendientes de captura y accesos rápidos."] },
      { t: "Mi Perfil", d: "Datos personales del docente y su actualización.", a: "Editar perfil", roles: ["doc"], features: ["Consultar y actualizar sus datos."] },
      { t: "Mis Grupos", d: "Los grupos y materias asignados al docente en el periodo.", a: "Consultar grupos asignados", roles: ["doc"], features: ["Ver sus grupos y materias del periodo."] },
      { t: "Asistencia", d: "Toma de asistencia del docente para sus grupos.", a: "Registrar asistencia", roles: ["doc"], features: ["Tomar asistencia de su grupo por sesión."] },
      { t: "Calificaciones", d: "Captura de calificaciones del docente para sus grupos, dentro de las ventanas.", a: "Capturar calificaciones", roles: ["doc"], features: ["Capturar calificaciones de sus alumnos dentro de la ventana."] },
      { t: "Planeaciones", d: "Registro de las planeaciones didácticas del docente.", a: "Subir planeaciones", roles: ["doc"], features: ["Subir y consultar sus planeaciones."] },
      { t: "Tareas", d: "Gestión de tareas/actividades del docente con sus grupos.", a: "Asignar y revisar tareas", roles: ["doc"], features: ["Asignar tareas y revisar entregas."] },
    ],
  },
  {
    id: "portal-alumno",
    title: "Mi Portal — Alumno",
    who: "Alumno",
    mods: [
      { t: "Mi Perfil", d: "Datos personales del alumno.", a: "Consultar/actualizar perfil", roles: ["al"], features: ["Consultar y actualizar sus datos."] },
      { t: "Mis Materias", d: "Las materias en que está inscrito el alumno.", a: "Ver materias del periodo", roles: ["al"], features: ["Ver las materias del periodo."] },
      { t: "Mis Formatos", d: "Formatos y documentos oficiales disponibles para el alumno.", a: "Descargar formatos", roles: ["al"], features: ["Descargar formatos y documentos oficiales."] },
      { t: "Mis Calificaciones", d: "Consulta de calificaciones del alumno por materia y parcial.", a: "Ver calificaciones", roles: ["al"], features: ["Consultar sus calificaciones por materia y parcial."] },
      { t: "Mi Asistencia", d: "Consulta del historial de asistencia del alumno.", a: "Ver asistencia", roles: ["al"], features: ["Ver su historial de asistencia."] },
      { t: "Mis Pagos", d: "Estado de cuenta y recibos del alumno.", a: "Consultar pagos y recibos", roles: ["al"], features: ["Ver su estado de cuenta y descargar recibos."] },
      { t: "Mis Tareas", d: "Tareas y actividades asignadas al alumno.", a: "Ver y entregar tareas", roles: ["al"], features: ["Ver las tareas asignadas y entregarlas."] },
    ],
  },
  {
    id: "agremiados",
    title: "Agremiados",
    who: "SuperAdmin",
    mods: [
      { t: "Panel de Agremiados", d: "Tablero global de todas las instituciones agremiadas: altas, estatus y actividad reciente.", a: "Supervisar todas las escuelas", roles: ["sa"], features: ["Ver todas las escuelas y su estatus.", "Actividad y último acceso de cada una."] },
      { t: "Instituciones Agremiadas", d: "Alta y edición de cada escuela: nombre, subdominio, logo, color, plan, estado y último acceso.", a: "Crear/editar escuelas y su branding", roles: ["sa"], features: ["Dar de alta una escuela.", "Editar su logo, color y plan.", "Suspender o activar."] },
      { t: "Importar Agremiados", d: "Alta masiva de escuelas desde una plantilla Excel, con aprovisionamiento automático de su base de datos y admin.", a: "Importar escuelas por Excel", roles: ["sa"], features: ["Cargar la plantilla de escuelas.", "Se crea su base de datos y su admin automáticamente."] },
    ],
  },
];

// Mapeo a los mismos "requiredModule" que usa el menú (sidebar-items.ts),
// para que el manual respete exactamente lo que cada rol puede ver.
const SECTION_MODULE: Record<string, string | undefined> = {
  inicio: "Dashboard",
  admisiones: "Admisiones",
  catalogos: "Catalogos",
  control: "Estudiantes",
  academico: "Academico",
  titulacion: "TitulacionDirecta",
  finanzas: "Finanzas",
  auditoria: "Bitacora",
  soporte: undefined, // visible para todos
  config: "Configuracion",
  "portal-docente": "PortalDocente",
  "portal-alumno": "PortalAlumno",
  agremiados: "SuperAdmin",
};
const SECTION_ROLE: Record<string, string | undefined> = {
  "portal-docente": "docente",
  "portal-alumno": "alumno",
};

function moduloRequerido(sectionId: string, titulo: string): string | undefined {
  if (sectionId === "control") {
    return ["Calificaciones", "Captura de Calificaciones", "Asistencias"].includes(titulo) ? "Academico" : "Estudiantes";
  }
  if (sectionId === "titulacion") {
    return titulo === "Titulación Escolarizada" ? "TitulacionEscolarizada" : "TitulacionDirecta";
  }
  return SECTION_MODULE[sectionId];
}

function TagBadge({ tag }: { tag: Tag }) {
  if (tag === "new") return <Badge className="text-[10px] px-1.5 py-0">Nuevo</Badge>;
  if (tag === "soon") return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Próximamente</Badge>;
  return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Solo USAG</Badge>;
}

export default function ManualPage() {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<{ mod: Modulo; section: Seccion } | null>(null);
  const { accessibleModules, isAdmin, isSuperAdmin, primaryRole, isLoading } = usePermissions();

  const puedeVerModulo = useCallback(
    (req?: string) => {
      if (!req) return true;
      if (req === "SuperAdmin") return isSuperAdmin;
      if (isAdmin || isSuperAdmin) return true;
      return (accessibleModules ?? []).includes(req);
    },
    [accessibleModules, isAdmin, isSuperAdmin],
  );

  const puedeVerSeccion = useCallback(
    (s: Seccion) => {
      const rol = SECTION_ROLE[s.id];
      if (rol) return primaryRole === rol; // portales: solo su rol
      return true;
    },
    [primaryRole],
  );

  const filtered = useMemo(() => {
    const v = q.trim().toLowerCase();
    return SECTIONS.filter(puedeVerSeccion)
      .map((s) => ({
        ...s,
        mods: s.mods.filter((m) => {
          if (!puedeVerModulo(moduloRequerido(s.id, m.t))) return false;
          if (!v) return true;
          return (m.t + " " + m.d + " " + (m.a ?? "") + " " + (m.features ?? []).join(" ") + " " + m.roles.map((r) => ROLES[r]).join(" "))
            .toLowerCase()
            .includes(v);
        }),
      }))
      .filter((s) => s.mods.length > 0);
  }, [q, puedeVerSeccion, puedeVerModulo]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          Manual de Usuario
        </h1>
        <p className="text-muted-foreground mt-1">
          Todas las funcionalidades del sistema, por módulo. Haz clic en cualquier tarjeta para ver su detalle.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar módulo…"
          className="pl-9"
          type="search"
        />
      </div>

      <Card className="border-primary/30">
        <CardContent className="flex gap-3 pt-6">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            El sistema es multi-institución: cada escuela ve solo su información. Los módulos disponibles dependen del{" "}
            <span className="font-medium text-foreground">plan contratado</span> y del{" "}
            <span className="font-medium text-foreground">rol</span> de cada usuario, así que no todos verán todas las
            secciones de este manual.
          </p>
        </CardContent>
      </Card>

      {isLoading && (
        <p className="text-center text-muted-foreground py-10">Cargando…</p>
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-10">
          {q ? "Sin resultados para tu búsqueda." : "No hay módulos disponibles para tu rol."}
        </p>
      )}

      {!isLoading && filtered.map((s) => (
        <section key={s.id} className="space-y-4 scroll-mt-20" id={s.id}>
          <div className="flex items-baseline justify-between gap-3 border-b pb-2">
            <h2 className="text-xl font-semibold tracking-tight">{s.title}</h2>
            <span className="text-xs text-muted-foreground">{s.who}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {s.mods.map((m) => (
              <Card
                key={m.t}
                onClick={() => setSel({ mod: m, section: s })}
                className="flex flex-col cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSel({ mod: m, section: s });
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                    {m.t}
                    {m.tag && <TagBadge tag={m.tag} />}
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                  </CardTitle>
                  <CardDescription className="leading-relaxed line-clamp-3">{m.d}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {m.roles.map((r) => (
                      <Badge key={r} variant="outline" className="text-[10px] font-normal">
                        {ROLES[r]}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 flex-wrap text-xl">
                  {sel.mod.t}
                  {sel.mod.tag && <TagBadge tag={sel.mod.tag} />}
                </SheetTitle>
                <SheetDescription className="text-sm leading-relaxed">{sel.mod.d}</SheetDescription>
              </SheetHeader>

              <div className="px-4 pb-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <ListChecks className="h-4 w-4 text-primary" /> Qué puedes hacer aquí
                  </div>
                  <ul className="space-y-2">
                    {(sel.mod.features ?? (sel.mod.a ? [sel.mod.a] : [])).map((f, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <Users className="h-4 w-4 text-primary" /> Quién lo usa
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sel.mod.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="font-normal">
                        {ROLES[r]}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <Compass className="h-4 w-4 text-primary" /> Cómo llegar
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Menú lateral → <span className="text-foreground font-medium">{sel.section.title}</span> →{" "}
                    <span className="text-foreground font-medium">{sel.mod.t}</span>
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
