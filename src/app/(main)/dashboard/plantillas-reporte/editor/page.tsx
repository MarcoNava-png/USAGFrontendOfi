"use client";

import { useEffect, useRef, useState } from "react";

import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import apiClient from "@/services/api-client";

export default function EditorPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (!id) {
      setError("ID de plantilla no proporcionado");
      setLoading(false);
      return;
    }

    loadEditor(parseInt(id));

    return () => {
      if (editorRef.current) {
        try { editorRef.current.destroyEditor(); } catch {}
      }
    };
  }, [id]);

  const loadEditor = async (plantillaId: number) => {
    try {
      const { data: config } = await apiClient.get(`/onlyoffice/config/${plantillaId}`);

      const script = document.createElement("script");
      script.src = `${window.location.origin}/onlyoffice/web-apps/apps/api/documents/api.js`;
      script.onload = () => {
        if (containerRef.current && (window as any).DocsAPI) {
          editorRef.current = new (window as any).DocsAPI.DocEditor("onlyoffice-editor", config);
          setLoading(false);
        } else {
          setError("No se pudo cargar el editor de OnlyOffice");
          setLoading(false);
        }
      };
      script.onerror = () => {
        setError("Error al cargar OnlyOffice. Verifica que el servicio esté activo.");
        setLoading(false);
      };
      document.head.appendChild(script);
    } catch (err) {
      setError("Error al obtener la configuración del editor");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center gap-4 p-4 border-b bg-white">
        <Link href="/dashboard/plantillas-reporte">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver a plantillas
          </Button>
        </Link>
        <h2 className="font-semibold">Editor de Plantilla</h2>
        <p className="text-sm text-gray-500">Los cambios se guardan automáticamente al cerrar el editor</p>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-gray-400" />
            <p className="mt-4 text-gray-500">Cargando editor...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 font-medium">{error}</p>
            <Link href="/dashboard/plantillas-reporte">
              <Button variant="outline" className="mt-4">Volver</Button>
            </Link>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1"
        style={{ display: loading || error ? "none" : "block" }}
      >
        <div id="onlyoffice-editor" style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
