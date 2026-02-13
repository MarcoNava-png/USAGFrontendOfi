"use client";

import { useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Search, User, MapPin, Briefcase, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getMunicipalities, getTownships } from "@/services/location-service";
import { updateTeacher } from "@/services/teacher-service";
import { CivilStatus, Genres } from "@/types/catalog";
import { State, Municipality, Township } from "@/types/location";
import { Teacher } from "@/types/teacher";

const updateTeacherSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellidoPaterno: z.string().min(2, "El apellido paterno debe tener al menos 2 caracteres"),
  apellidoMaterno: z.string().min(2, "El apellido materno debe tener al menos 2 caracteres"),
  fechaNacimiento: z.string().min(1, "La fecha de nacimiento es requerida"),
  generoId: z.number().min(1, "Selecciona un genero"),
  idEstadoCivil: z.number().min(1, "Selecciona un estado civil"),
  curp: z.string().optional(),
  correo: z.string().email("Ingresa un correo valido"),
  telefono: z.string().min(10, "El telefono debe tener al menos 10 digitos"),
  emailInstitucional: z.string().email("Ingresa un correo institucional valido"),
  calle: z.string().optional(),
  numeroExterior: z.string().optional(),
  numeroInterior: z.string().optional(),
  stateId: z.string().optional(),
  municipalityId: z.string().optional(),
  codigoPostalId: z.number().optional(),
  noEmpleado: z.string().min(1, "El numero de empleado es requerido"),
  rfc: z.string().optional(),
});

type UpdateTeacherFormData = z.infer<typeof updateTeacherSchema>;

export interface UpdateTeacherDialogProps {
  open: boolean;
  teacher: Teacher | null;
  genres: Genres[];
  states: State[];
  civilStatus: CivilStatus[];
  onClose: () => void;
  onUpdate: (data: any) => void;
}

export const UpdateTeacherDialog: React.FC<UpdateTeacherDialogProps> = ({
  open,
  teacher,
  genres,
  states,
  civilStatus,
  onClose,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [townships, setTownships] = useState<Township[]>([]);
  const [openColoniaPopover, setOpenColoniaPopover] = useState(false);
  const [coloniaSearch, setColoniaSearch] = useState("");

  const form = useForm<UpdateTeacherFormData>({
    resolver: zodResolver(updateTeacherSchema),
    defaultValues: {
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      fechaNacimiento: "",
      generoId: 0,
      idEstadoCivil: 0,
      curp: "",
      correo: "",
      telefono: "",
      emailInstitucional: "",
      calle: "",
      numeroExterior: "",
      numeroInterior: "",
      stateId: "",
      municipalityId: "",
      codigoPostalId: 0,
      noEmpleado: "",
      rfc: "",
    },
  });

  const watchedStateId = form.watch("stateId");
  const watchedMunicipalityId = form.watch("municipalityId");
  const watchedCodigoPostalId = form.watch("codigoPostalId");

  // Populate form when teacher changes
  useEffect(() => {
    if (open && teacher) {
      form.reset({
        nombre: teacher.nombre || "",
        apellidoPaterno: teacher.apellidoPaterno || "",
        apellidoMaterno: teacher.apellidoMaterno || "",
        fechaNacimiento: teacher.fechaNacimiento || "",
        generoId: teacher.generoId || 0,
        idEstadoCivil: teacher.idEstadoCivil || 0,
        curp: teacher.curp || "",
        correo: teacher.correo || "",
        telefono: teacher.telefono || "",
        emailInstitucional: teacher.emailInstitucional || "",
        calle: teacher.calle || "",
        numeroExterior: teacher.numeroExterior || "",
        numeroInterior: teacher.numeroInterior || "",
        stateId: "",
        municipalityId: "",
        codigoPostalId: teacher.codigoPostalId || 0,
        noEmpleado: teacher.noEmpleado || "",
        rfc: teacher.rfc || "",
      });
      setMunicipalities([]);
      setTownships([]);
    }
  }, [open, teacher, form]);

  useEffect(() => {
    if (watchedStateId) {
      getMunicipalities(watchedStateId).then(setMunicipalities);
      form.setValue("municipalityId", "", { shouldValidate: false });
      form.setValue("codigoPostalId", 0, { shouldValidate: false });
    } else {
      setMunicipalities([]);
    }
  }, [watchedStateId]);

  useEffect(() => {
    if (watchedMunicipalityId) {
      getTownships(watchedMunicipalityId).then(setTownships);
      form.setValue("codigoPostalId", 0, { shouldValidate: false });
    } else {
      setTownships([]);
    }
  }, [watchedMunicipalityId]);

  const filteredTownships = useMemo(() => {
    return townships.filter((t) => t.municipioId === watchedMunicipalityId);
  }, [townships, watchedMunicipalityId]);

  const searchedTownships = useMemo(() => {
    if (!coloniaSearch) return filteredTownships;
    return filteredTownships.filter((t) =>
      t.asentamiento.toLowerCase().includes(coloniaSearch.toLowerCase())
    );
  }, [filteredTownships, coloniaSearch]);

  const selectedColoniaName = useMemo(() => {
    const found = townships.find((t) => t.id === watchedCodigoPostalId);
    return found?.asentamiento || "";
  }, [townships, watchedCodigoPostalId]);

  const onSubmit = async (data: UpdateTeacherFormData) => {
    if (!teacher) return;

    setLoading(true);
    try {
      const payload = {
        ...data,
        idProfesor: teacher.idProfesor,
        campusId: teacher.campusId || 1,
        status: 1,
      };

      await updateTeacher(payload as any);
      toast.success("Docente actualizado correctamente");
      onUpdate(payload);
      onClose();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.response?.data || "Error al actualizar el docente";
      toast.error("Error al actualizar docente", { description: String(errorMessage) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-h-[90vh] w-full !max-w-5xl overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-900">
            Actualizar Docente
          </DialogTitle>
          <DialogDescription>
            Modifique los campos necesarios. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seccion: Datos Personales */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Datos Personales</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre(s)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apellidoPaterno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido Paterno <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Apellido paterno" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apellidoMaterno"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido Materno <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Apellido materno" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fechaNacimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Nacimiento <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="generoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genero <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value ? String(field.value) : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona genero" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {genres.map((genre) => (
                            <SelectItem key={genre.idGenero} value={String(genre.idGenero)}>
                              {genre.descGenero}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idEstadoCivil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Civil <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value ? String(field.value) : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona estado civil" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {civilStatus.map((status) => (
                            <SelectItem key={status.idEstadoCivil} value={String(status.idEstadoCivil)}>
                              {status.descEstadoCivil}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="curp"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>CURP</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="CURP (18 caracteres)"
                          maxLength={18}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seccion: Contacto */}
            <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-900">Informacion de Contacto</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="correo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Personal <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="10 digitos" maxLength={10} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailInstitucional"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Institucional <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="docente@universidad.edu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seccion: Direccion */}
            <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-orange-900">Direccion</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="calle"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Calle</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la calle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numeroExterior"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. Exterior</FormLabel>
                      <FormControl>
                        <Input placeholder="No. ext" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numeroInterior"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. Interior</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state.id} value={state.id}>
                              {state.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="municipalityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Municipio</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        disabled={!watchedStateId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona municipio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {municipalities
                            .filter((m) => m.estadoId === watchedStateId)
                            .map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.nombre}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Buscador de Colonia */}
                <FormField
                  control={form.control}
                  name="codigoPostalId"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Colonia/Localidad</FormLabel>
                      <Popover open={openColoniaPopover} onOpenChange={setOpenColoniaPopover}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={!watchedMunicipalityId}
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Search className="h-4 w-4 shrink-0 opacity-50" />
                                <span className="truncate">
                                  {selectedColoniaName || "Buscar colonia..."}
                                </span>
                              </div>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Escribe para buscar colonia..."
                              value={coloniaSearch}
                              onValueChange={setColoniaSearch}
                            />
                            <CommandList>
                              <CommandEmpty>No se encontraron colonias</CommandEmpty>
                              <CommandGroup className="max-h-[300px] overflow-y-auto">
                                {searchedTownships.map((township) => (
                                  <CommandItem
                                    key={township.id}
                                    value={township.asentamiento}
                                    onSelect={() => {
                                      field.onChange(township.id);
                                      setOpenColoniaPopover(false);
                                      setColoniaSearch("");
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === township.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span>{township.asentamiento}</span>
                                      <span className="text-xs text-muted-foreground">
                                        CP: {township.codigo}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seccion: Informacion Laboral */}
            <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-purple-900">Informacion Laboral</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="noEmpleado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. Empleado <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Numero de empleado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rfc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RFC</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="RFC (12-13 caracteres)"
                          maxLength={13}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Botones de accion */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? "Actualizando..." : "Actualizar Docente"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
