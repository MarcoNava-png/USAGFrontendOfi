"use client";

import { useEffect, useMemo, useState } from "react";

import { Building2, LifeBuoy, Loader2, MessageSquare, RefreshCw, Search, Send, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  cambiarEstatusTicket,
  getComentariosTicket,
  getTicketsAgremiados,
  responderTicket,
  TicketAgremiado,
  TicketComentarioAgremiado,
  TicketsAgremiadosResumen,
} from "@/services/tickets-agremiados-service";

const prioridadStyle: Record<number, string> = {
  3: "bg-red-100 text-red-800 border-red-300",
  2: "bg-orange-100 text-orange-800 border-orange-300",
  1: "bg-yellow-100 text-yellow-800 border-yellow-300",
  0: "bg-gray-100 text-gray-700 border-gray-300",
};
const estatusStyle: Record<number, string> = {
  0: "bg-blue-100 text-blue-800 border-blue-300",
  1: "bg-indigo-100 text-indigo-800 border-indigo-300",
  4: "bg-purple-100 text-purple-800 border-purple-300",
  2: "bg-green-100 text-green-800 border-green-300",
  3: "bg-gray-100 text-gray-600 border-gray-300",
};
const ESTATUS = [
  { valor: 1, label: "En progreso" },
  { valor: 4, label: "En validación" },
  { valor: 2, label: "Resuelto" },
  { valor: 3, label: "Cerrado" },
  { valor: 0, label: "Reabrir" },
];

export default function TicketsAgremiadosPage() {
  const [data, setData] = useState<TicketsAgremiadosResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [soloAbiertos, setSoloAbiertos] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const [sel, setSel] = useState<TicketAgremiado | null>(null);
  const [comentarios, setComentarios] = useState<TicketComentarioAgremiado[]>([]);
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);

  const load = async (abiertos: boolean) => {
    setLoading(true);
    try {
      setData(await getTicketsAgremiados(abiertos));
    } catch {
      toast.error("No se pudieron cargar los tickets de los agremiados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(soloAbiertos);
  }, [soloAbiertos]);

  const filtrados = useMemo(() => {
    const t = data?.tickets ?? [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return t;
    return t.filter(
      (x) =>
        x.tenantNombre.toLowerCase().includes(q) ||
        x.tenantCodigo.toLowerCase().includes(q) ||
        x.titulo.toLowerCase().includes(q) ||
        x.folio.toLowerCase().includes(q),
    );
  }, [data, busqueda]);

  const fmt = (s: string) =>
    new Date(s).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const abrir = async (t: TicketAgremiado) => {
    setSel(t);
    setRespuesta("");
    setComentarios([]);
    setCargandoComentarios(true);
    try {
      setComentarios(await getComentariosTicket(t.tenantCodigo, t.idTicket));
    } catch {
      toast.error("No se pudieron cargar los comentarios");
    } finally {
      setCargandoComentarios(false);
    }
  };

  const enviarRespuesta = async () => {
    if (!sel || !respuesta.trim()) return;
    setEnviando(true);
    try {
      await responderTicket(sel.tenantCodigo, sel.idTicket, respuesta.trim());
      toast.success("Comentario enviado");
      setRespuesta("");
      setComentarios(await getComentariosTicket(sel.tenantCodigo, sel.idTicket));
      load(soloAbiertos);
    } catch {
      toast.error("No se pudo enviar el comentario");
    } finally {
      setEnviando(false);
    }
  };

  const cambiarEstatus = async (nuevo: number) => {
    if (!sel) return;
    setEnviando(true);
    try {
      await cambiarEstatusTicket(sel.tenantCodigo, sel.idTicket, nuevo);
      toast.success("Estatus actualizado");
      setSel(null);
      load(soloAbiertos);
    } catch {
      toast.error("No se pudo actualizar el estatus");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <LifeBuoy className="w-7 h-7" style={{ color: "#4f46e5" }} />
            Tickets de Escuelas Agremiadas
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tickets de soporte generados por cada escuela, identificados por institución. Puedes responder y cambiar su estatus.
          </p>
        </div>
        <Button variant="outline" onClick={() => load(soloAbiertos)} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Escuelas con tickets</div>
          <div className="text-3xl font-bold mt-1 text-indigo-700">{data?.totalEscuelasConTickets ?? 0}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Tickets mostrados</div>
          <div className="text-3xl font-bold mt-1 text-indigo-700">{data?.totalTickets ?? 0}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Abiertos / en curso</div>
          <div className="text-3xl font-bold mt-1 text-orange-600">{data?.totalAbiertos ?? 0}</div>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por escuela, folio o título..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button variant={soloAbiertos ? "default" : "outline"} size="sm" onClick={() => setSoloAbiertos(true)}>Solo abiertos</Button>
          <Button variant={!soloAbiertos ? "default" : "outline"} size="sm" onClick={() => setSoloAbiertos(false)}>Todos</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Cargando tickets de todas las escuelas...
            </div>
          ) : filtrados.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">No hay tickets para mostrar.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Escuela</TableHead>
                    <TableHead>Folio</TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead>Creador</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((t) => (
                    <TableRow key={`${t.tenantCodigo}-${t.idTicket}`}>
                      <TableCell>
                        <div className="font-medium flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          {t.tenantNombre}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">{t.tenantCodigo}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">{t.folio}</TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="font-medium">{t.titulo}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{t.descripcion}</div>
                        {t.totalComentarios > 0 && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {t.totalComentarios}
                          </div>
                        )}
                      </TableCell>
                      <TableCell><Badge variant="outline" className={prioridadStyle[t.prioridadValor] ?? ""}>{t.prioridad}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className={estatusStyle[t.estatusValor] ?? ""}>{t.estatus}</Badge></TableCell>
                      <TableCell className="text-sm">{t.nombreCreador}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{fmt(t.fechaCreacion)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => abrir(t)}>
                          <Settings2 className="w-4 h-4 mr-1" /> Gestionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {sel && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{sel.folio}</span> {sel.titulo}
                </DialogTitle>
              </DialogHeader>
              <div className="text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-4 h-4" /> {sel.tenantNombre} ({sel.tenantCodigo})
                </div>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline" className={prioridadStyle[sel.prioridadValor] ?? ""}>{sel.prioridad}</Badge>
                  <Badge variant="outline" className={estatusStyle[sel.estatusValor] ?? ""}>{sel.estatus}</Badge>
                  <Badge variant="outline">{sel.categoria}</Badge>
                </div>
                <p className="mt-3 whitespace-pre-wrap">{sel.descripcion}</p>
                <p className="mt-1 text-xs text-muted-foreground">Creado por {sel.nombreCreador} · {fmt(sel.fechaCreacion)}</p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="text-sm font-semibold">Conversación</div>
                {cargandoComentarios ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Cargando...</div>
                ) : comentarios.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Sin respuestas todavía.</div>
                ) : (
                  <div className="space-y-2">
                    {comentarios.map((c) => (
                      <div key={c.idComentario} className={`rounded-lg p-3 text-sm ${c.esAdmin ? "bg-indigo-50 border border-indigo-100" : "bg-gray-50 border"}`}>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span className="font-medium">{c.nombreUsuario}{c.esAdmin ? " · Soporte" : ""}</span>
                          <span>{fmt(c.fechaCreacion)}</span>
                        </div>
                        <div className="whitespace-pre-wrap">{c.contenido}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Textarea placeholder="Escribe una respuesta para la escuela..." value={respuesta} onChange={(e) => setRespuesta(e.target.value)} rows={3} />
                <div className="flex justify-end">
                  <Button onClick={enviarRespuesta} disabled={enviando || !respuesta.trim()}>
                    {enviando ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />} Responder
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-semibold">Cambiar estatus</div>
                <div className="flex flex-wrap gap-2">
                  {ESTATUS.filter((e) => e.valor !== sel.estatusValor).map((e) => (
                    <Button key={e.valor} size="sm" variant="outline" disabled={enviando} onClick={() => cambiarEstatus(e.valor)}>
                      {e.label}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
