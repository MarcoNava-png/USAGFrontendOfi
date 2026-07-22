"use client";

import { useEffect, useState } from "react";

import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMisFormatos, generarMiFormato, type MiFormato } from "@/services/mis-formatos-service";

export default function MisFormatosPage() {
  const [formatos, setFormatos] = useState<MiFormato[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState<string | null>(null);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setLoading(true);
    try {
      setFormatos(await getMisFormatos());
    } catch {
      toast.error("No se pudieron cargar tus formatos");
    } finally {
      setLoading(false);
    }
  }

  async function generar(f: MiFormato) {
    setGenerando(f.codigo);
    try {
      const blob = await generarMiFormato(f.codigo);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${f.codigo}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Documento generado");
    } catch (err: any) {
      const data = err?.response?.data;
      let msg = "No se pudo generar el documento";
      if (data instanceof Blob) {
        try {
          msg = JSON.parse(await data.text())?.error || msg;
        } catch {
          /* noop */
        }
      }
      toast.error(msg);
    } finally {
      setGenerando(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          Mis Formatos
        </h1>
        <p className="mt-1 text-muted-foreground">Genera y descarga tus documentos oficiales en PDF.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentos disponibles</CardTitle>
          <CardDescription>{formatos.length} formato(s) disponible(s) para ti</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : formatos.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="font-medium">No tienes formatos disponibles por ahora</p>
              <p className="mt-1 text-sm">Cuando Control Escolar habilite formatos para alumnos, aparecerán aquí.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formatos.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg border p-4 hover:shadow-sm">
                  <div>
                    <h4 className="font-semibold">{f.nombre}</h4>
                    {f.descripcion && <p className="mt-0.5 text-sm text-muted-foreground">{f.descripcion}</p>}
                  </div>
                  <Button onClick={() => generar(f)} disabled={generando === f.codigo} className="gap-2">
                    {generando === f.codigo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Descargar PDF
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
