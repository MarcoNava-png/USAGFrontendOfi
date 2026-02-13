"use client";

import { useCallback, useState } from "react";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import importacionService, {
  type ImportarProfesorDto,
  type ImportarProfesoresResponse,
} from "@/services/importacion-service";

interface ImportTeachersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

const COLUMN_MAPPING: Record<string, keyof ImportarProfesorDto> = {
  // Clave / No. Empleado
  clave: "noEmpleado",
  "no. empleado": "noEmpleado",
  "no empleado": "noEmpleado",
  noempleado: "noEmpleado",
  "numero empleado": "noEmpleado",
  "número empleado": "noEmpleado",
  "num empleado": "noEmpleado",
  "* clave": "noEmpleado",
  // Apellido Paterno
  paterno: "apellidoPaterno",
  "apellido paterno": "apellidoPaterno",
  apellidopaterno: "apellidoPaterno",
  // Apellido Materno
  materno: "apellidoMaterno",
  "apellido materno": "apellidoMaterno",
  apellidomaterno: "apellidoMaterno",
  // Nombre
  "nombre (s)": "nombre",
  "nombre(s)": "nombre",
  nombre: "nombre",
  nombres: "nombre",
  "* nombre (s)": "nombre",
  "* nombre(s)": "nombre",
  // Genero
  genero: "genero",
  género: "genero",
  "* genero": "genero",
  "* género": "genero",
  sexo: "genero",
  // RFC
  rfc: "rfc",
  // CURP
  curp: "curp",
  // Fecha Nacimiento
  "fecha nacimiento": "fechaNacimiento",
  fechanacimiento: "fechaNacimiento",
  "fecha de nacimiento": "fechaNacimiento",
  "fecha nacimiento\n(2014-12-25)": "fechaNacimiento",
  // Domicilio
  domicilio: "domicilio",
  domiclio: "domicilio", // typo comun en el excel
  direccion: "domicilio",
  dirección: "domicilio",
  // Telefono
  "telefono(s)": "telefono",
  "teléfono(s)": "telefono",
  telefono: "telefono",
  teléfono: "telefono",
  telefonos: "telefono",
  tel: "telefono",
  // Email
  email: "email",
  correo: "email",
  "correo electronico": "email",
  "correo electrónico": "email",
  mail: "email",
  "e-mail": "email",
  // Estado
  "estado federativo": "estadoFederativo",
  estadofederativo: "estadoFederativo",
  estado: "estadoFederativo",
  // Cedula
  "cedula profesional": "cedulaProfesional",
  "cédula profesional": "cedulaProfesional",
  cedulaprofesional: "cedulaProfesional",
  cedula: "cedulaProfesional",
  cédula: "cedulaProfesional",
};

type Step = "upload" | "preview" | "importing" | "results";

export function ImportTeachersModal({
  open,
  onOpenChange,
  onImportSuccess,
}: ImportTeachersModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [profesores, setProfesores] = useState<ImportarProfesorDto[]>([]);
  const [resultado, setResultado] = useState<ImportarProfesoresResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actualizarExistentes, setActualizarExistentes] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, []);

  const processFile = async (selectedFile: File) => {
    setLoading(true);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        toast.error("El archivo no contiene datos");
        return;
      }

      const headers = (jsonData[0] as unknown[]).map((h) =>
        String(h).toLowerCase().trim().replace(/\*/g, "").trim()
      );
      const rows = jsonData.slice(1);

      const mapped: ImportarProfesorDto[] = [];

      for (const row of rows) {
        const rowArr = row as unknown[];
        if (!rowArr || rowArr.every((cell) => !cell)) continue;

        const prof: Partial<ImportarProfesorDto> = {};

        headers.forEach((header, index) => {
          // Intentar mapeo directo
          let mappedKey = COLUMN_MAPPING[header];

          // Si no hay mapeo directo, buscar si alguna key del mapping esta contenida en el header
          if (!mappedKey) {
            for (const [key, value] of Object.entries(COLUMN_MAPPING)) {
              if (header.includes(key)) {
                mappedKey = value;
                break;
              }
            }
          }

          if (mappedKey && rowArr[index] !== undefined && rowArr[index] !== null) {
            let value = String(rowArr[index]).trim();

            // Para fechas, formatear si viene como numero de Excel
            if (mappedKey === "fechaNacimiento" && !isNaN(Number(value)) && Number(value) > 10000) {
              const date = XLSX.SSF.parse_date_code(Number(value));
              if (date) {
                value = `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
              }
            }

            (prof as Record<string, string>)[mappedKey] = value;
          }
        });

        // Validar campos minimos
        if (prof.noEmpleado && prof.apellidoPaterno && prof.nombre) {
          mapped.push(prof as ImportarProfesorDto);
        }
      }

      if (mapped.length === 0) {
        toast.error("No se encontraron docentes validos en el archivo. Verifica que tenga columnas: Clave, Paterno, Nombre(s)");
        return;
      }

      setProfesores(mapped);
      setStep("preview");
      toast.success(`Se cargaron ${mapped.length} docentes`);
    } catch (error) {
      console.error("Error al procesar archivo:", error);
      toast.error("Error al procesar el archivo Excel");
    } finally {
      setLoading(false);
    }
  };

  const handleImportar = async () => {
    setLoading(true);
    setStep("importing");

    try {
      const result = await importacionService.importarProfesores({
        profesores,
        actualizarExistentes,
      });

      setResultado(result);
      setStep("results");

      if (result.fallidos === 0) {
        toast.success(`Se importaron ${result.exitosos} docentes exitosamente`);
        onImportSuccess();
      } else {
        toast.warning(
          `Importacion completada: ${result.exitosos} creados, ${result.actualizados} actualizados, ${result.fallidos} fallidos`
        );
        if (result.exitosos > 0 || result.actualizados > 0) {
          onImportSuccess();
        }
      }
    } catch (error) {
      console.error("Error al importar:", error);
      toast.error("Error al importar los docentes");
      setStep("preview");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setProfesores([]);
    setResultado(null);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = [
      [
        "* Clave",
        "* Paterno",
        "Materno",
        "* Nombre (s)",
        "* Genero",
        "RFC",
        "CURP",
        "Fecha Nacimiento\n(2014-12-25)",
        "Domicilio",
        "Telefono(s)",
        "Email",
        "Estado Federativo",
        "Cedula Profesional",
      ],
      [
        "L00001",
        "Garcia",
        "Lopez",
        "Juan Carlos",
        "Masculino",
        "GALJ800101ABC",
        "GALJ800101HGTRPN04",
        "1980-01-01",
        "Av. Universidad 123 Col Centro",
        "4771234567",
        "jgarcia@email.com",
        "GUANAJUATO",
        "1234567",
      ],
      [
        "L00002",
        "Martinez",
        "Hernandez",
        "Maria Elena",
        "Femenino",
        "MAHM900215",
        "MAHM900215MGTRRR08",
        "1990-02-15",
        "Calle Reforma 456 Col Moderna",
        "4779876543",
        "mmartinez@email.com",
        "GUANAJUATO",
        "",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);

    // Ajustar anchos de columna
    ws["!cols"] = [
      { wch: 10 }, // Clave
      { wch: 15 }, // Paterno
      { wch: 15 }, // Materno
      { wch: 20 }, // Nombre
      { wch: 12 }, // Genero
      { wch: 15 }, // RFC
      { wch: 20 }, // CURP
      { wch: 18 }, // Fecha Nacimiento
      { wch: 35 }, // Domicilio
      { wch: 15 }, // Telefono
      { wch: 25 }, // Email
      { wch: 18 }, // Estado
      { wch: 18 }, // Cedula
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Docentes");
    XLSX.writeFile(wb, "plantilla_importacion_docentes.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Docentes desde Archivo
          </DialogTitle>
          <DialogDescription>
            Carga masiva de docentes desde archivo Excel (.xlsx)
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Descargar Plantilla
              </Button>
            </div>

            <div
              className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 p-8 transition-colors hover:border-primary/50 hover:bg-muted/20"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById("teachers-file-input")?.click()}
            >
              {loading ? (
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              ) : (
                <>
                  <FileSpreadsheet className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-2 font-medium">Arrastra tu archivo Excel aqui</p>
                  <p className="text-sm text-muted-foreground">o haz clic para seleccionar</p>
                </>
              )}
              <input
                id="teachers-file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Formato esperado</AlertTitle>
              <AlertDescription>
                <p className="mb-1">
                  Columnas requeridas: <strong>Clave</strong>, <strong>Paterno</strong>, <strong>Nombre(s)</strong>
                </p>
                <p>
                  Opcionales: Materno, Genero, RFC, CURP, Fecha Nacimiento, Domicilio, Telefono, Email, Estado Federativo, Cedula Profesional
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* STEP 2: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{profesores.length} docentes a importar</Badge>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="actualizar-docentes"
                  checked={actualizarExistentes}
                  onCheckedChange={(checked) => setActualizarExistentes(checked === true)}
                />
                <Label htmlFor="actualizar-docentes" className="cursor-pointer text-sm">
                  Actualizar existentes (por clave)
                </Label>
              </div>
            </div>

            <div className="max-h-[350px] overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Clave</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Paterno</TableHead>
                    <TableHead>Materno</TableHead>
                    <TableHead>Genero</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefono</TableHead>
                    <TableHead>RFC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profesores.slice(0, 100).map((prof, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{prof.noEmpleado}</TableCell>
                      <TableCell>{prof.nombre}</TableCell>
                      <TableCell>{prof.apellidoPaterno}</TableCell>
                      <TableCell>{prof.apellidoMaterno ?? "-"}</TableCell>
                      <TableCell>{prof.genero ?? "-"}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-xs">{prof.email ?? "-"}</TableCell>
                      <TableCell className="text-xs">{prof.telefono ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{prof.rfc ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {profesores.length > 100 && (
              <p className="text-center text-sm text-muted-foreground">
                Mostrando 100 de {profesores.length} registros
              </p>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Informacion</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 text-sm space-y-1">
                  <li>Los titulos del nombre (Lic., Ing., Dr., etc.) se eliminan automaticamente</li>
                  <li>Se creara una cuenta de usuario por cada docente que tenga email (password = clave de empleado)</li>
                  <li>El domicilio se guarda como texto libre</li>
                  <li>La cedula profesional se registra como informativa</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleImportar} disabled={loading}>
                <Upload className="mr-2 h-4 w-4" />
                Importar {profesores.length} Docentes
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Importing */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg font-medium">Importando docentes...</p>
            <p className="text-sm text-muted-foreground">
              Procesando {profesores.length} registros, por favor espera
            </p>
          </div>
        )}

        {/* STEP 4: Results */}
        {step === "results" && resultado && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border bg-muted/50 p-3 text-center">
                <p className="text-sm text-muted-foreground">Procesados</p>
                <p className="text-2xl font-bold">{resultado.totalProcesados}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center dark:border-green-800 dark:bg-green-950">
                <p className="text-sm text-green-600">Creados</p>
                <p className="text-2xl font-bold text-green-600">{resultado.exitosos}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center dark:border-blue-800 dark:bg-blue-950">
                <p className="text-sm text-blue-600">Actualizados</p>
                <p className="text-2xl font-bold text-blue-600">{resultado.actualizados}</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center dark:border-red-800 dark:bg-red-950">
                <p className="text-sm text-red-600">Fallidos</p>
                <p className="text-2xl font-bold text-red-600">{resultado.fallidos}</p>
              </div>
            </div>

            {resultado.fallidos === 0 ? (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Importacion Exitosa</AlertTitle>
                <AlertDescription>
                  Todos los docentes fueron importados correctamente.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Importacion con Errores</AlertTitle>
                <AlertDescription>
                  Algunos docentes no pudieron ser importados. Revisa los detalles abajo.
                </AlertDescription>
              </Alert>
            )}

            <div className="max-h-[300px] overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-12">Fila</TableHead>
                    <TableHead>Clave</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Advertencias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.resultados.slice(0, 100).map((res) => (
                    <TableRow key={res.fila}>
                      <TableCell>{res.fila}</TableCell>
                      <TableCell className="font-mono text-xs">{res.noEmpleado}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{res.nombreCompleto}</TableCell>
                      <TableCell>
                        {res.exito ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <Check className="mr-1 h-3 w-3" />
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <X className="mr-1 h-3 w-3" />
                            Error
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={`text-xs ${res.exito ? "text-green-600" : "text-red-600"}`}>
                        {res.mensaje}
                      </TableCell>
                      <TableCell className="text-xs text-yellow-600 max-w-[200px]">
                        {res.advertencias.length > 0
                          ? res.advertencias.join("; ")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {resultado.resultados.length > 100 && (
              <p className="text-center text-sm text-muted-foreground">
                Mostrando 100 de {resultado.resultados.length} resultados
              </p>
            )}

            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={handleReset}>
                <Upload className="mr-2 h-4 w-4" />
                Nueva Importacion
              </Button>
              <Button onClick={handleClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
