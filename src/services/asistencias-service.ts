import apiClient from "./api-client";
import type {
  ResumenAsistencias,
  RegistrarAsistenciaRequest,
  AsistenciaEstudiante,
  ValidacionFechaClase,
  DiasClaseMateria,
} from "@/types/asistencia";
import type { DiaSemana } from "@/types/group";

const BASE = "/Asistencia";

export async function getDiasClaseMateria(idGrupoMateria: number): Promise<DiasClaseMateria> {
  const { data } = await apiClient.get<DiasClaseMateria>(`${BASE}/grupo-materia/${idGrupoMateria}/dias-clase`);
  return data;
}

export function validarFechaClase(
  fecha: string,
  diasClase: string[]
): ValidacionFechaClase {
  const [year, month, day] = fecha.split("-").map(Number);
  const fechaObj = new Date(year, month - 1, day);
  const diasSemana: DiaSemana[] = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const diaSemanaNombre = diasSemana[fechaObj.getDay()];

  const esDiaDeClase = diasClase.includes(diaSemanaNombre);

  return {
    esFechaValida: true,
    esDiaDeClase,
    diaSemanaNombre,
    mensaje: esDiaDeClase
      ? `${diaSemanaNombre} es un día de clase válido`
      : `${diaSemanaNombre} NO es un día de clase. Los días de clase son: ${diasClase.join(", ")}`,
  };
}

export async function registrarAsistencias(request: RegistrarAsistenciaRequest): Promise<void> {
  await apiClient.post(`${BASE}/registrar`, {
    idGrupoMateria: request.idGrupoMateria,
    fecha: request.fecha,
    asistencias: request.asistencias.map((a) => ({
      idInscripcion: a.idInscripcion,
      presente: a.presente,
      justificada: a.justificada,
      motivoJustificacion: a.motivoJustificacion || "",
    })),
  });
}

export async function getAsistenciasPorFecha(
  idGrupoMateria: number,
  fecha: string
): Promise<AsistenciaEstudiante[]> {
  const { data } = await apiClient.get<AsistenciaEstudiante[]>(
    `${BASE}/grupo-materia/${idGrupoMateria}/fecha/${fecha}`
  );
  return data;
}

export async function getResumenAsistencias(idGrupoMateria: number): Promise<ResumenAsistencias[]> {
  const { data } = await apiClient.get<ResumenAsistencias[]>(
    `${BASE}/grupo-materia/${idGrupoMateria}/resumen`
  );
  return data;
}

export async function justificarFalta(
  idAsistencia: number,
  motivo: string
): Promise<void> {
  await apiClient.put(`${BASE}/${idAsistencia}`, {
    idAsistencia,
    estadoAsistencia: 3,
    observaciones: motivo,
  });
}
