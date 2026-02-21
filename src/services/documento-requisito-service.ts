import type {
  DocumentoRequisito,
  PayloadCreateDocumentoRequisito,
  PayloadUpdateDocumentoRequisito,
} from "@/types/documento-requisito";

import apiClient from "./api-client";

const baseUrl = "/DocumentoRequisito";

export async function getDocumentosRequisito(): Promise<DocumentoRequisito[]> {
  const { data } = await apiClient.get<DocumentoRequisito[]>(baseUrl);
  return data;
}

export async function getDocumentoRequisitoById(
  id: number
): Promise<DocumentoRequisito> {
  const { data } = await apiClient.get<DocumentoRequisito>(`${baseUrl}/${id}`);
  return data;
}

export async function createDocumentoRequisito(
  payload: PayloadCreateDocumentoRequisito
): Promise<DocumentoRequisito> {
  const { data } = await apiClient.post<DocumentoRequisito>(baseUrl, payload);
  return data;
}

export async function updateDocumentoRequisito(
  payload: PayloadUpdateDocumentoRequisito
): Promise<DocumentoRequisito> {
  const { data } = await apiClient.put<DocumentoRequisito>(baseUrl, payload);
  return data;
}

export async function deleteDocumentoRequisito(
  id: number
): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(
    `${baseUrl}/${id}`
  );
  return data;
}

export async function toggleDocumentoRequisito(
  id: number
): Promise<DocumentoRequisito> {
  const { data } = await apiClient.put<DocumentoRequisito>(
    `${baseUrl}/${id}/toggle`
  );
  return data;
}
