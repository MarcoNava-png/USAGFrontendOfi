"use client";

import { useState, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Loader2, ShieldCheck, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createUser } from "@/services/users-service";
import microsoftGraphService from "@/services/microsoft-graph-service";
import type { CreateUserRequest } from "@/types/user";

const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "director", label: "Director" },
  { value: "coordinador", label: "Coordinador" },
  { value: "controlescolar", label: "Control Escolar" },
  { value: "finanzas", label: "Finanzas" },
  { value: "admisiones", label: "Admisiones" },
  { value: "academico", label: "Académico" },
  { value: "cajero", label: "Cajero" },
  { value: "docente", label: "Docente/Profesor" },
  { value: "alumno", label: "Alumno/Estudiante" },
] as const;

const formSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(7, "La contrasena debe tener al menos 7 caracteres"),
  nombres: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellidos: z.string().min(2, "Los apellidos deben tener al menos 2 caracteres"),
  roles: z.array(z.string()).min(1, "Debes seleccionar al menos un rol"),
  telefono: z.string().optional(),
  biografia: z.string().optional(),
  crearCorreoAzure: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  existingEmails?: string[];
}

const DEFAULT_DOMAIN = "usaguanajuato.edu.mx";

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

function generateEmail(nombres: string, apellidos: string, existingEmails: string[], domain: string): string {
  if (!nombres.trim() || !apellidos.trim()) return "";

  const primerNombre = normalizeText(nombres.trim().split(/\s+/)[0]);
  const partsApellido = apellidos.trim().split(/\s+/);
  const primerApellido = normalizeText(partsApellido[0]);
  const segundoApellido = partsApellido[1] ? normalizeText(partsApellido[1]) : "";

  const emailCorto = `${primerNombre}.${primerApellido}@${domain}`;

  if (!existingEmails.includes(emailCorto.toLowerCase())) {
    return emailCorto;
  }

  if (segundoApellido) {
    return `${primerNombre}.${primerApellido}${segundoApellido}@${domain}`;
  }

  return emailCorto;
}

export function CreateUserModal({ open, onOpenChange, onSuccess, existingEmails = [] }: CreateUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain] = useState(DEFAULT_DOMAIN);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      nombres: "",
      apellidos: "",
      roles: [],
      telefono: "",
      biografia: "",
      crearCorreoAzure: true,
    },
  });

  const nombres = form.watch("nombres");
  const apellidos = form.watch("apellidos");
  const crearCorreoAzure = form.watch("crearCorreoAzure");

  useEffect(() => {
    if (open) {
      microsoftGraphService.getDomains().then((d) => {
        setDomains(d);
        if (d.length > 0 && !d.includes(selectedDomain)) {
          setSelectedDomain(d[0]);
        }
      }).catch(() => {});
    }
  }, [open]);

  const suggestedEmail = generateEmail(nombres || "", apellidos || "", existingEmails, selectedDomain);

  useEffect(() => {
    if (!suggestedEmail) return;
    const currentEmail = form.getValues("email");
    const domainSuffix = domains.length > 0
      ? domains.some(d => currentEmail.endsWith(`@${d}`))
      : currentEmail.endsWith(`@${DEFAULT_DOMAIN}`);
    if (!currentEmail || domainSuffix) {
      form.setValue("email", suggestedEmail);
    }
  }, [suggestedEmail, form, selectedDomain]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      const userData: CreateUserRequest = {
        email: values.email,
        password: values.password,
        nombres: values.nombres,
        apellidos: values.apellidos,
        telefono: values.telefono || undefined,
        biografia: values.biografia || undefined,
        roles: values.roles,
        crearCorreoAzure: values.crearCorreoAzure,
      };

      await createUser(userData);

      toast.success("Usuario creado exitosamente", {
        description: `${values.nombres} ${values.apellidos} ha sido agregado al sistema`,
      });

      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Error al crear usuario", {
        description: error?.response?.data?.message || "No se pudo crear el usuario",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div
              className="p-2 rounded-lg text-white"
              style={{ background: 'linear-gradient(to bottom right, #14356F, #1e4a8f)' }}
            >
              <UserPlus className="h-5 w-5" />
            </div>
            Crear Nuevo Usuario
          </DialogTitle>
          <DialogDescription>
            Completa el formulario para agregar un nuevo usuario al sistema
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge style={{ background: '#1e4a8f' }}>Informacion Personal</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nombre(s) <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Juan Carlos"
                          className="focus-visible:ring-[#14356F]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apellidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Apellidos <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Perez Garcia"
                          className="focus-visible:ring-[#14356F]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="5551234567"
                        className="focus-visible:ring-[#14356F]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Opcional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="biografia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biografia</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informacion adicional sobre el usuario..."
                        className="resize-none focus-visible:ring-[#14356F]"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Opcional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge style={{ background: '#14356F' }}>Informacion de Cuenta</Badge>
              </div>

              <FormField
                control={form.control}
                name="crearCorreoAzure"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950 p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        Crear correo institucional en Microsoft 365
                      </FormLabel>
                      <FormDescription>
                        Se creara automaticamente una cuenta de correo en Azure AD con las credenciales ingresadas
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {crearCorreoAzure && domains.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dominio</label>
                  <Select value={selectedDomain} onValueChange={(val) => setSelectedDomain(val)}>
                    <SelectTrigger className="focus-visible:ring-[#14356F]">
                      <SelectValue placeholder="Selecciona dominio" />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Correo institucional sugerido</label>
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Mail className="h-4 w-4 text-blue-500 shrink-0" />
                  {suggestedEmail ? (
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {suggestedEmail}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      Escribe nombre y apellido para generar el correo
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Correo Electronico <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="usuario@ejemplo.com"
                          className="focus-visible:ring-[#14356F]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Contrasena <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="********"
                          className="focus-visible:ring-[#14356F]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Minimo 7 caracteres</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="roles"
                render={() => (
                  <FormItem>
                    <FormLabel>
                      Roles del Usuario <span className="text-red-500">*</span>
                    </FormLabel>
                    <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                      {ROLES.map((role) => (
                        <FormField
                          key={role.value}
                          control={form.control}
                          name="roles"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(role.value)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    field.onChange(
                                      checked
                                        ? [...current, role.value]
                                        : current.filter((v: string) => v !== role.value)
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 text-[#14356F]" />
                                {role.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormDescription>
                      Puedes asignar uno o varios roles. Los permisos se combinan automaticamente.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="text-white"
                style={{ background: 'linear-gradient(to right, #14356F, #1e4a8f)' }}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Creando..." : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
