"use client";

import { useEffect, useState } from "react";

import { GraduationCap, Upload } from "lucide-react";

import { CreateTeacherDialog } from "@/app/(main)/dashboard/teachers/_components/create-teacher-dialog";
import { ImportTeachersModal } from "@/app/(main)/dashboard/teachers/_components/import-teachers-modal";
import { UpdateTeacherDialog } from "@/app/(main)/dashboard/teachers/_components/update-teacher-dialog";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { getCampusList } from "@/services/campus-service";
import { getCivilStatus, getGenresList } from "@/services/catalogs-service";
import { getStates } from "@/services/location-service";
import { getAllTeachers } from "@/services/teacher-service";
import { Campus } from "@/types/campus";
import { CivilStatus, Genres } from "@/types/catalog";
import { State } from "@/types/location";
import { Teacher } from "@/types/teacher";

import { teachersColumns } from "./_components/columns";
import { EmptyTeachers } from "./_components/empty";

export default function TeachersPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [civilStatus, setCivilStatus] = useState<CivilStatus[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [genres, setGenres] = useState<Genres[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const loadTeachers = () => {
    setLoading(true);
    setError(null);
    getAllTeachers()
      .then((res) => setTeachers(res.items ?? []))
      .catch(() => setError("Error de red"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTeachers();
    getCampusList().then((res) => setCampuses(res.items ?? []));
  }, []);

  useEffect(() => {
    getCivilStatus().then((res) => {
      setCivilStatus(res);
    });

    getStates().then((res) => {
      setStates(res);
    });

    getGenresList().then((res) => {
      setGenres(res);
    });
  }, []);

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setOpenUpdateDialog(true);
  };

  const table = useDataTableInstance({
    data: teachers,
    columns: teachersColumns(handleEdit),
    getRowId: (row: Teacher) => row.idProfesor.toString(),
  });

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ background: 'linear-gradient(to bottom right, rgba(20, 53, 111, 0.1), rgba(30, 74, 143, 0.1))' }}
            >
              <GraduationCap className="h-8 w-8" style={{ color: '#14356F' }} />
            </div>
            Docentes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión del personal docente
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpenImportModal(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Importar Excel
          </Button>
          <Button
            type="button"
            onClick={() => setOpenCreateDialog(true)}
            className="text-white"
            style={{ background: 'linear-gradient(to right, #14356F, #1e4a8f)' }}
          >
            Nuevo Docente
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className="border-2"
          style={{ borderColor: 'rgba(20, 53, 111, 0.2)', background: 'linear-gradient(to bottom right, rgba(20, 53, 111, 0.05), rgba(30, 74, 143, 0.1))' }}
        >
          <CardHeader className="pb-2">
            <CardDescription style={{ color: '#1e4a8f' }}>Total Docentes</CardDescription>
            <CardTitle className="text-4xl" style={{ color: '#14356F' }}>
              {teachers.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-600 dark:text-green-400">Campus Disponibles</CardDescription>
            <CardTitle className="text-4xl text-green-700 dark:text-green-300">
              {campuses.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-muted-foreground">Cargando docentes...</div>
        </div>
      ) : error ? (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-destructive">{error}</div>
        </div>
      ) : teachers.length === 0 ? (
        <EmptyTeachers />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border">
            <DataTable table={table} columns={teachersColumns(handleEdit)} />
          </div>
          <DataTablePagination table={table} />
        </>
      )}
      <CreateTeacherDialog
        open={openCreateDialog}
        genres={genres}
        states={states}
        civilStatus={civilStatus}
        onClose={() => setOpenCreateDialog(false)}
        onCreate={() => {
          setOpenCreateDialog(false);
          loadTeachers();
        }}
      />
      <UpdateTeacherDialog
        open={openUpdateDialog}
        teacher={selectedTeacher}
        genres={genres}
        states={states}
        civilStatus={civilStatus}
        onClose={() => {
          setOpenUpdateDialog(false);
          setSelectedTeacher(null);
        }}
        onUpdate={() => {
          setOpenUpdateDialog(false);
          setSelectedTeacher(null);
          loadTeachers();
        }}
      />
      <ImportTeachersModal
        open={openImportModal}
        onOpenChange={setOpenImportModal}
        onImportSuccess={loadTeachers}
      />
    </div>
  );
}
