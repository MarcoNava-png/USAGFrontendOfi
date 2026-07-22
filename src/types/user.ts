export interface User {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string | null;
  biografia?: string | null;
  photoUrl?: string | null;
  roles?: string[];
  idCampusAsignado?: number | null;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  biografia?: string;
  photoUrl?: string;
  roles: string[];
  idCampusAsignado?: number | null;
  crearCorreoAzure?: boolean;
}

export interface UpdateUserRequest {
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  biografia?: string;
  roles?: string[];
  idCampusAsignado?: number | null;
}

export interface UsersResponse {
  data: User[];
  isSuccess: boolean;
  messageError: string | null;
}

export interface UserResponse {
  data: User;
  isSuccess: boolean;
  messageError: string | null;
}

export interface PayloadCreateUser {
  email: string;
  password: string;
  roles: [string];
}

export interface PayloadUpdateUser {
  email: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  biografia: string;
  photoFile: string;
}
