export interface EmpresaDto {
  idEmpresa: number;
  nombre: string;
  activo: boolean;
  cantidadAspirantes: number;
}

export interface CrearEmpresaDto {
  nombre: string;
  activo: boolean;
}

export interface ActualizarEmpresaDto {
  nombre: string;
  activo: boolean;
}
