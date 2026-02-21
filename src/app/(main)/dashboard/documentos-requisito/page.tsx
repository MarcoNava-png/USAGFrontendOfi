"use client";

import { useEffect, useState } from "react";

import {
  CheckCircle,
  Edit,
  FileText,
  Plus,
  Power,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { TablePagination } from "@/components/shared/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  deleteDocumentoRequisito,
  getDocumentosRequisito,
  toggleDocumentoRequisito,
} from "@/services/documento-requisito-service";
import type { DocumentoRequisito } from "@/types/documento-requisito";

import { CreateDocumentoModal } from "./_components/create-documento-modal";
import { EditDocumentoModal } from "./_components/edit-documento-modal";

export default function DocumentosRequisitoPage() {
  const [documentos, setDocumentos] = useState<DocumentoRequisito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [docToEdit, setDocToEdit] = useState<DocumentoRequisito | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentoRequisito | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDocumentosRequisito();
      setDocumentos(data);
    } catch {
      setError("Error al cargar datos");
      toast.error("Error al cargar los documentos requisito");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (doc: DocumentoRequisito) => {
    setDocumentos((prev) => [...prev, doc]);
    toast.success("Documento requisito creado exitosamente");
  };

  const openDeleteDialog = (doc: DocumentoRequisito) => {
    setDocToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!docToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDocumentoRequisito(docToDelete.idDocumentoRequisito);
      setDocumentos((prev) =>
        prev.filter(
          (d) =>
            d.idDocumentoRequisito !== docToDelete.idDocumentoRequisito
        )
      );
      toast.success("Documento requisito eliminado exitosamente");
      setDeleteDialogOpen(false);
      setDocToDelete(null);
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as {
          response?: { data?: { message?: string } };
        };
        if (axiosErr.response?.data?.message) {
          toast.error(axiosErr.response.data.message);
          return;
        }
      }
      toast.error("Error al eliminar el documento requisito");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggle = async (doc: DocumentoRequisito) => {
    try {
      const updated = await toggleDocumentoRequisito(
        doc.idDocumentoRequisito
      );
      setDocumentos((prev) =>
        prev.map((d) =>
          d.idDocumentoRequisito === updated.idDocumentoRequisito
            ? updated
            : d
        )
      );
      toast.success(
        updated.activo
          ? "Documento activado exitosamente"
          : "Documento desactivado exitosamente"
      );
    } catch {
      toast.error("Error al cambiar estado del documento");
    }
  };

  const filteredDocs =
    documentos.filter(
      (d) =>
        d.clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    ) ?? [];

  const totalPages = Math.ceil(filteredDocs.length / pageSize);
  const paginatedDocs = filteredDocs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const activos = documentos.filter((d) => d.activo).length;
  const obligatorios = documentos.filter((d) => d.esObligatorio).length;

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <span className="text-muted-foreground">
            Cargando documentos requisito...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">{error}</div>
            <Button onClick={loadData} className="mt-4 w-full">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <div
              className="rounded-lg p-2"
              style={{
                background:
                  "linear-gradient(to bottom right, rgba(20, 53, 111, 0.1), rgba(30, 74, 143, 0.1))",
              }}
            >
              <FileText className="h-8 w-8" style={{ color: "#14356F" }} />
            </div>
            Documentos Requisito
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gestiona los documentos requeridos para admisión
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Documento
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="border-2"
          style={{
            borderColor: "rgba(20, 53, 111, 0.2)",
            background:
              "linear-gradient(to bottom right, rgba(20, 53, 111, 0.05), rgba(30, 74, 143, 0.1))",
          }}
        >
          <CardHeader className="pb-2">
            <CardDescription style={{ color: "#1e4a8f" }}>
              Total Documentos
            </CardDescription>
            <CardTitle className="text-4xl" style={{ color: "#14356F" }}>
              {documentos.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:border-green-800 dark:from-green-950 dark:to-green-900">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-600 dark:text-green-400">
              Activos
            </CardDescription>
            <CardTitle className="text-4xl text-green-700 dark:text-green-300">
              {activos}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:border-orange-800 dark:from-orange-950 dark:to-orange-900">
          <CardHeader className="pb-2">
            <CardDescription className="text-orange-600 dark:text-orange-400">
              Obligatorios
            </CardDescription>
            <CardTitle className="text-4xl text-orange-700 dark:text-orange-300">
              {obligatorios}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b bg-muted/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Listado de Documentos</CardTitle>
              <CardDescription>
                {filteredDocs.length} documentos encontrados
              </CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por clave, descripción..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow
                className="hover:bg-transparent"
                style={{
                  background: "linear-gradient(to right, #14356F, #1e4a8f)",
                }}
              >
                <TableHead className="font-semibold text-white">
                  Clave
                </TableHead>
                <TableHead className="font-semibold text-white">
                  Descripción
                </TableHead>
                <TableHead className="text-center font-semibold text-white">
                  Obligatorio
                </TableHead>
                <TableHead className="text-center font-semibold text-white">
                  Orden
                </TableHead>
                <TableHead className="text-center font-semibold text-white">
                  Estado
                </TableHead>
                <TableHead className="text-center font-semibold text-white">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="h-8 w-8" />
                      <span>No se encontraron documentos</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDocs.map((doc, index) => (
                  <TableRow
                    key={doc.idDocumentoRequisito}
                    className={
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-950"
                        : "bg-muted/30"
                    }
                  >
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-mono"
                        style={{
                          background: "rgba(20, 53, 111, 0.05)",
                          color: "#14356F",
                          borderColor: "rgba(20, 53, 111, 0.2)",
                        }}
                      >
                        {doc.clave}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="rounded p-1.5"
                          style={{ background: "rgba(20, 53, 111, 0.1)" }}
                        >
                          <FileText
                            className="h-4 w-4"
                            style={{ color: "#14356F" }}
                          />
                        </div>
                        <span className="font-medium">{doc.descripcion}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {doc.esObligatorio ? (
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Obligatorio
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          Opcional
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {doc.orden}
                    </TableCell>
                    <TableCell className="text-center">
                      {doc.activo ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          Activo
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-red-500 border-red-200"
                        >
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                onClick={() => {
                                  setDocToEdit(doc);
                                  setEditModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-8 w-8 p-0 ${
                                  doc.activo
                                    ? "hover:bg-yellow-100 hover:text-yellow-600"
                                    : "hover:bg-green-100 hover:text-green-600"
                                }`}
                                onClick={() => handleToggle(doc)}
                              >
                                {doc.activo ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <Power className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {doc.activo ? "Desactivar" : "Activar"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                onClick={() => openDeleteDialog(doc)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredDocs.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>

      <CreateDocumentoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />

      {docToEdit && (
        <EditDocumentoModal
          open={editModalOpen}
          documento={docToEdit}
          onClose={() => {
            setEditModalOpen(false);
            setDocToEdit(null);
          }}
          onUpdate={(updated) => {
            setDocumentos((prev) =>
              prev.map((d) =>
                d.idDocumentoRequisito === updated.idDocumentoRequisito
                  ? updated
                  : d
              )
            );
            setEditModalOpen(false);
            setDocToEdit(null);
            toast.success("Documento actualizado exitosamente");
          }}
        />
      )}

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar Documento Requisito"
        description="Esta acción no se puede deshacer. Se eliminará permanentemente el documento:"
        itemName={docToDelete?.descripcion}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
