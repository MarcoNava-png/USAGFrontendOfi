"use client";

import { useEffect, useState } from "react";
import { Building, Edit, Plus, Power, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listarEmpresas, eliminarEmpresa, cambiarEstadoEmpresa } from "@/services/empresas-service";
import { EmpresaDto } from "@/types/empresa";

import { EmpresaModal } from "./_components/empresa-modal";

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<EmpresaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [empresaToEdit, setEmpresaToEdit] = useState<EmpresaDto | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [empresaToDelete, setEmpresaToDelete] = useState<EmpresaDto | null>(null);

  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    setLoading(true);
    try {
      const data = await listarEmpresas();
      setEmpresas(data);
    } catch {
      toast.error("Error al cargar empresas");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstado = async (empresa: EmpresaDto) => {
    try {
      await cambiarEstadoEmpresa(empresa.idEmpresa, !empresa.activo);
      toast.success(`Empresa ${!empresa.activo ? "activada" : "desactivada"}`);
      loadEmpresas();
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  const handleDelete = async () => {
    if (!empresaToDelete) return;
    setConfirmDeleteOpen(false);
    try {
      await eliminarEmpresa(empresaToDelete.idEmpresa);
      toast.success("Empresa eliminada");
      loadEmpresas();
    } catch {
      toast.error("Error al eliminar empresa");
    } finally {
      setEmpresaToDelete(null);
    }
  };

  const filtered = empresas.filter((e) =>
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalActivas = empresas.filter((e) => e.activo).length;
  const totalAspirantes = empresas.reduce((sum, e) => sum + e.cantidadAspirantes, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground">
            Catálogo de empresas para aspirantes con promoción empresarial
          </p>
        </div>
        <Button onClick={() => { setEmpresaToEdit(null); setModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Empresa
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Empresas</CardDescription>
            <CardTitle className="text-3xl">{empresas.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Activas</CardDescription>
            <CardTitle className="text-3xl text-green-600">{totalActivas}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aspirantes Vinculados</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{totalAspirantes}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Listado de Empresas
            </CardTitle>
            <Input
              placeholder="Buscar empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchTerm ? "No se encontraron resultados" : "No hay empresas registradas"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow style={{ background: "linear-gradient(to right, #14356F, #1e4a8f)" }}>
                  <TableHead className="text-white font-semibold">ID</TableHead>
                  <TableHead className="text-white font-semibold">Nombre</TableHead>
                  <TableHead className="text-white font-semibold text-center">Aspirantes</TableHead>
                  <TableHead className="text-white font-semibold text-center">Estado</TableHead>
                  <TableHead className="text-white font-semibold text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((empresa, index) => (
                  <TableRow key={empresa.idEmpresa} className={index % 2 === 0 ? "bg-white" : "bg-muted/30"}>
                    <TableCell>
                      <Badge variant="outline">{empresa.idEmpresa}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{empresa.nombre}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {empresa.cantidadAspirantes}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={empresa.activo ? "default" : "secondary"}>
                        {empresa.activo ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEmpresaToEdit(empresa); setModalOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleEstado(empresa)}
                        >
                          <Power className={`h-4 w-4 ${empresa.activo ? "text-green-600" : "text-gray-400"}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEmpresaToDelete(empresa); setConfirmDeleteOpen(true); }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EmpresaModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEmpresaToEdit(null); }}
        empresaToEdit={empresaToEdit}
        onSaved={loadEmpresas}
      />

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar &quot;{empresaToDelete?.nombre}&quot;? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEmpresaToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
