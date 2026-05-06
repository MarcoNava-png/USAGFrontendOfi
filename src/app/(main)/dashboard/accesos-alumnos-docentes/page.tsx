"use client";

import { useEffect, useState } from "react";

import { Key, Search, Lock, Unlock, Copy, CheckCircle, AlertCircle, Users, GraduationCap, RefreshCcw, UserPlus, Ban } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { crearAcceso, desbloquearCuenta, listarAccesos, resetearPassword } from "@/services/acceso-alumno-docente-service";
import type { AccesoUsuario, AccesosLista } from "@/types/acceso-alumno-docente";

export default function AccesosAlumnosDocentesPage() {
  const [tipo, setTipo] = useState<"alumno" | "docente">("alumno");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [data, setData] = useState<AccesosLista | null>(null);
  const [loading, setLoading] = useState(false);

  const [openReset, setOpenReset] = useState(false);
  const [modoDialog, setModoDialog] = useState<"resetear" | "crear">("resetear");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<AccesoUsuario | null>(null);
  const [passwordPersonalizada, setPasswordPersonalizada] = useState("");
  const [emailPersonalizado, setEmailPersonalizado] = useState("");
  const [forzarCambio, setForzarCambio] = useState(true);
  const [passwordGenerada, setPasswordGenerada] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await listarAccesos({ tipo, busqueda: busqueda.trim() || undefined, pagina, tamanoPagina: 20 });
      setData(res);
    } catch {
      toast.error("Error al cargar la lista");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [tipo, pagina]);

  const onBuscar = () => {
    setPagina(1);
    cargar();
  };

  const abrirResetear = (usuario: AccesoUsuario) => {
    setModoDialog("resetear");
    setUsuarioSeleccionado(usuario);
    setPasswordPersonalizada("");
    setEmailPersonalizado("");
    setForzarCambio(true);
    setPasswordGenerada(null);
    setMensajeExito(null);
    setOpenReset(true);
  };

  const abrirCrear = (usuario: AccesoUsuario) => {
    setModoDialog("crear");
    setUsuarioSeleccionado(usuario);
    setPasswordPersonalizada("");
    const sugerido = usuario.email || (tipo === "alumno" && usuario.matricula ? `${usuario.matricula}@usaguanajuato.edu.mx` : "");
    setEmailPersonalizado(sugerido);
    setForzarCambio(true);
    setPasswordGenerada(null);
    setMensajeExito(null);
    setOpenReset(true);
  };

  const confirmarAccion = async () => {
    if (!usuarioSeleccionado) return;
    setResetLoading(true);
    try {
      if (modoDialog === "resetear") {
        if (!usuarioSeleccionado.userId) return;
        const res = await resetearPassword({
          userId: usuarioSeleccionado.userId,
          nuevaPassword: passwordPersonalizada.trim() || undefined,
          forzarCambio,
        });
        if (res.exito && res.passwordTemporal) {
          setPasswordGenerada(res.passwordTemporal);
          setMensajeExito(res.mensaje ?? "Contraseña restablecida");
          toast.success("Contraseña restablecida");
        } else {
          toast.error(res.mensaje ?? "No se pudo restablecer");
        }
      } else {
        const entidadId = tipo === "alumno" ? usuarioSeleccionado.idEstudiante : usuarioSeleccionado.idProfesor;
        if (!entidadId) return;
        const res = await crearAcceso({
          tipo,
          entidadId,
          emailPersonalizado: emailPersonalizado.trim() || undefined,
          passwordPersonalizada: passwordPersonalizada.trim() || undefined,
        });
        if (res.exito && res.passwordTemporal) {
          setPasswordGenerada(res.passwordTemporal);
          setMensajeExito(res.mensaje ?? "Acceso creado");
          toast.success("Acceso creado");
        } else {
          toast.error(res.mensaje ?? "No se pudo crear el acceso");
        }
      }
    } catch {
      toast.error("Error en la operación");
    } finally {
      setResetLoading(false);
    }
  };

  const cerrarDialog = () => {
    setOpenReset(false);
    setUsuarioSeleccionado(null);
    setPasswordGenerada(null);
    cargar();
  };

  const copiarPassword = () => {
    if (!passwordGenerada) return;
    navigator.clipboard.writeText(passwordGenerada);
    toast.success("Contraseña copiada al portapapeles");
  };

  const desbloquear = async (usuario: AccesoUsuario) => {
    if (!usuario.userId) return;
    try {
      await desbloquearCuenta(usuario.userId);
      toast.success(`Cuenta de ${usuario.nombreCompleto} desbloqueada`);
      cargar();
    } catch {
      toast.error("Error al desbloquear cuenta");
    }
  };

  const totalPaginas = data ? Math.ceil(data.total / data.tamanoPagina) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-sky-100 to-sky-200">
            <Key className="h-8 w-8 text-sky-700" />
          </div>
          Accesos de Alumnos y Docentes
        </h1>
        <p className="text-muted-foreground mt-1">
          Restablece contraseñas, desbloquea cuentas y gestiona accesos de alumnos y docentes
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Tabs value={tipo} onValueChange={(v) => { setTipo(v as "alumno" | "docente"); setPagina(1); }}>
              <TabsList>
                <TabsTrigger value="alumno" className="gap-2">
                  <Users className="w-4 h-4" /> Alumnos
                </TabsTrigger>
                <TabsTrigger value="docente" className="gap-2">
                  <GraduationCap className="w-4 h-4" /> Docentes
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={tipo === "alumno" ? "Matrícula, nombre o email..." : "No. empleado, nombre o email..."}
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onBuscar()}
                  className="pl-8 w-80"
                />
              </div>
              <Button onClick={onBuscar} disabled={loading}>Buscar</Button>
              <Button variant="outline" onClick={cargar} disabled={loading}>
                <RefreshCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-60">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {busqueda ? "No se encontraron resultados" : "No hay registros"}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tipo === "alumno" ? "Matrícula" : "No. Empleado"}</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    {tipo === "alumno" && <TableHead>Plan / Grupo</TableHead>}
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((u) => (
                    <TableRow key={u.userId}>
                      <TableCell className="font-mono text-xs">{u.matricula ?? "-"}</TableCell>
                      <TableCell className="font-medium">{u.nombreCompleto}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      {tipo === "alumno" && (
                        <TableCell className="text-xs">
                          {u.planEstudios ? (
                            <div>
                              <div className="truncate max-w-[260px]" title={u.planEstudios}>{u.planEstudios}</div>
                              <div className="text-muted-foreground">
                                {u.grupoActual ? `Grupo ${u.grupoActual}` : "Sin grupo"}
                                {u.cuatrimestre ? ` · Cuatri ${u.cuatrimestre}` : ""}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin plan</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {!u.tieneCuenta && (
                            <Badge className="bg-gray-100 text-gray-700 gap-1">
                              <Ban className="w-3 h-3" /> Sin acceso
                            </Badge>
                          )}
                          {u.tieneCuenta && u.cuentaBloqueada && (
                            <Badge className="bg-red-100 text-red-700 gap-1">
                              <Lock className="w-3 h-3" /> Bloqueada
                            </Badge>
                          )}
                          {u.tieneCuenta && u.intentosFallidos > 0 && !u.cuentaBloqueada && (
                            <Badge className="bg-amber-100 text-amber-700">
                              {u.intentosFallidos} intento(s)
                            </Badge>
                          )}
                          {u.tieneCuenta && u.debeCambiarPassword && (
                            <Badge className="bg-blue-100 text-blue-700 gap-1">
                              <AlertCircle className="w-3 h-3" /> Debe cambiar
                            </Badge>
                          )}
                          {u.tieneCuenta && !u.cuentaBloqueada && u.intentosFallidos === 0 && !u.debeCambiarPassword && (
                            <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                              <CheckCircle className="w-3 h-3" /> Activa
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {u.tieneCuenta && u.cuentaBloqueada && (
                            <Button size="sm" variant="outline" onClick={() => desbloquear(u)}>
                              <Unlock className="w-3 h-3 mr-1" /> Desbloquear
                            </Button>
                          )}
                          {u.tieneCuenta ? (
                            <Button size="sm" onClick={() => abrirResetear(u)}>
                              <Key className="w-3 h-3 mr-1" /> Resetear
                            </Button>
                          ) : (
                            <Button size="sm" variant="default" onClick={() => abrirCrear(u)} className="bg-emerald-600 hover:bg-emerald-700">
                              <UserPlus className="w-3 h-3 mr-1" /> Crear acceso
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPaginas > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(pagina - 1) * data.tamanoPagina + 1} - {Math.min(pagina * data.tamanoPagina, data.total)} de {data.total}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
                      Anterior
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Página {pagina} de {totalPaginas}
                    </span>
                    <Button size="sm" variant="outline" disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)}>
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={openReset} onOpenChange={(v) => { if (!v) cerrarDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modoDialog === "crear" ? <UserPlus className="w-5 h-5" /> : <Key className="w-5 h-5" />}
              {modoDialog === "crear" ? "Crear acceso" : "Restablecer contraseña"}
            </DialogTitle>
            <DialogDescription>
              {usuarioSeleccionado?.nombreCompleto}
              {usuarioSeleccionado?.matricula ? ` · ${usuarioSeleccionado.matricula}` : ""}
            </DialogDescription>
          </DialogHeader>

          {passwordGenerada ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                {mensajeExito && <p className="text-sm font-medium text-emerald-900 mb-2">{mensajeExito}</p>}
                <p className="text-sm font-medium text-emerald-900 mb-2">Contraseña temporal:</p>
                <div className="flex items-center gap-2 bg-white border rounded-md p-3">
                  <code className="flex-1 font-mono text-lg">{passwordGenerada}</code>
                  <Button size="sm" variant="outline" onClick={copiarPassword}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-emerald-700 mt-2">
                  Guárdala o cópiala ahora. Por seguridad no se mostrará de nuevo.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={cerrarDialog}>Cerrar</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {modoDialog === "crear" && (
                <div>
                  <Label>Email de la cuenta</Label>
                  <Input
                    type="email"
                    value={emailPersonalizado}
                    onChange={(e) => setEmailPersonalizado(e.target.value)}
                    placeholder="correo@usaguanajuato.edu.mx"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Este será el usuario con el que iniciará sesión.
                  </p>
                </div>
              )}

              <div>
                <Label>Contraseña personalizada (opcional)</Label>
                <Input
                  type="text"
                  placeholder="Dejar vacío para generar automática"
                  value={passwordPersonalizada}
                  onChange={(e) => setPasswordPersonalizada(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Si lo dejas vacío, se generará una contraseña segura automáticamente.
                </p>
              </div>

              {modoDialog === "resetear" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="forzar-cambio"
                    checked={forzarCambio}
                    onCheckedChange={(v) => setForzarCambio(v === true)}
                  />
                  <Label htmlFor="forzar-cambio" className="cursor-pointer">
                    Forzar cambio en el próximo inicio de sesión
                  </Label>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={cerrarDialog} disabled={resetLoading}>
                  Cancelar
                </Button>
                <Button onClick={confirmarAccion} disabled={resetLoading}>
                  {resetLoading
                    ? "Procesando..."
                    : modoDialog === "crear"
                      ? "Crear acceso"
                      : "Restablecer"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
