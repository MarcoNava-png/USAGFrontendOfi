"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Pencil, Trash2 } from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Teacher } from "@/types/teacher";

export const teachersColumns = (
  onEdit: (teacher: Teacher) => void,
  onDelete: (teacher: Teacher) => void,
): ColumnDef<Teacher>[] => [
  {
    accessorKey: "idProfesor",
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    cell: ({ row }) => <div className="font-medium">{row.getValue("idProfesor")}</div>,
  },
  {
    accessorKey: "noEmpleado",
    header: ({ column }) => <DataTableColumnHeader column={column} title="No. Empleado" />,
    cell: ({ row }) => <div>{row.getValue("noEmpleado")}</div>,
  },
  {
    accessorKey: "nombreCompleto",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
    cell: ({ row }) => <div>{row.getValue("nombreCompleto")}</div>,
  },
  {
    accessorKey: "emailInstitucional",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email institucional" />,
    cell: ({ row }) => <div>{row.getValue("emailInstitucional")}</div>,
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const teacher = row.original;
      return (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(teacher)}>
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(teacher)}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Eliminar
          </Button>
        </div>
      );
    },
  },
];
