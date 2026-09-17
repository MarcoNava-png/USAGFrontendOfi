"use client";

import { useMemo, useState } from "react";

import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface TeacherOption {
  idProfesor: number;
  nombreCompleto: string;
  noEmpleado?: string;
}

interface TeacherComboboxProps {
  teachers: TeacherOption[];
  value: string; // idProfesor como string; "0" o "" = sin asignar
  onChange: (value: string) => void;
  disabled?: boolean;
  incluirSinAsignar?: boolean;
  placeholder?: string;
  className?: string;
}

export function TeacherCombobox({
  teachers,
  value,
  onChange,
  disabled,
  incluirSinAsignar = true,
  placeholder = "Selecciona un profesor",
  className,
}: TeacherComboboxProps) {
  const [open, setOpen] = useState(false);

  const ordenados = useMemo(
    () => [...teachers].sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, "es", { sensitivity: "base" })),
    [teachers],
  );

  const seleccionado = teachers.find((t) => t.idProfesor.toString() === value);
  const label =
    value === "0" || value === ""
      ? incluirSinAsignar
        ? "Sin asignar"
        : placeholder
      : seleccionado
        ? `${seleccionado.nombreCompleto}${seleccionado.noEmpleado ? ` — ${seleccionado.noEmpleado}` : ""}`
        : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar profesor por nombre…" />
          <CommandList>
            <CommandEmpty>No se encontró ningún profesor.</CommandEmpty>
            <CommandGroup>
              {incluirSinAsignar && (
                <CommandItem
                  value="Sin asignar"
                  onSelect={() => {
                    onChange("0");
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === "0" ? "opacity-100" : "opacity-0")} />
                  Sin asignar
                </CommandItem>
              )}
              {ordenados.map((t) => (
                <CommandItem
                  key={t.idProfesor}
                  value={`${t.nombreCompleto} ${t.noEmpleado ?? ""}`}
                  onSelect={() => {
                    onChange(t.idProfesor.toString());
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === t.idProfesor.toString() ? "opacity-100" : "opacity-0")}
                  />
                  <span className="truncate">
                    {t.nombreCompleto}
                    {t.noEmpleado ? ` — ${t.noEmpleado}` : ""}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
