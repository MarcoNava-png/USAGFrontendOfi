import apiClient from "@/services/api-client";

export interface MiFormato {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  origen: string | null;
  categoria: string;
}

export async function getMisFormatos(): Promise<MiFormato[]> {
  const { data } = await apiClient.get<MiFormato[]>("/mis-formatos");
  return data;
}

export async function generarMiFormato(codigo: string): Promise<Blob> {
  const { data } = await apiClient.post(`/mis-formatos/${codigo}/generar`, null, { responseType: "blob" });
  return data as Blob;
}
