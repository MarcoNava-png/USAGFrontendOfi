export interface AccesoUsuario {
  userId?: string;
  idEstudiante?: number;
  idProfesor?: number;
  email: string;
  userName?: string;
  nombreCompleto: string;
  rol: string;
  matricula?: string;
  planEstudios?: string;
  grupoActual?: string;
  cuatrimestre?: number;
  tieneCuenta: boolean;
  cuentaBloqueada: boolean;
  bloqueadaHasta?: string;
  intentosFallidos: number;
  debeCambiarPassword: boolean;
  nuncaHaIngresado: boolean;
  activo: boolean;
}

export interface CrearAccesoRequest {
  tipo: "alumno" | "docente";
  entidadId: number;
  emailPersonalizado?: string;
  passwordPersonalizada?: string;
}

export interface AccesosLista {
  total: number;
  pagina: number;
  tamanoPagina: number;
  items: AccesoUsuario[];
}

export interface ResetearPasswordRequest {
  userId: string;
  nuevaPassword?: string;
  forzarCambio?: boolean;
}

export interface ResetearPasswordResponse {
  exito: boolean;
  passwordTemporal?: string;
  mensaje?: string;
}
