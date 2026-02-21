export interface DocumentoRequisito {
  idDocumentoRequisito: number;
  clave: string;
  descripcion: string;
  esObligatorio: boolean;
  orden: number;
  activo: boolean;
}

export interface PayloadCreateDocumentoRequisito {
  clave: string;
  descripcion: string;
  esObligatorio: boolean;
  orden: number;
}

export interface PayloadUpdateDocumentoRequisito extends PayloadCreateDocumentoRequisito {
  idDocumentoRequisito: number;
  activo: boolean;
}
