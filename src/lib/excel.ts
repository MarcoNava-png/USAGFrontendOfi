import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "object" && value !== null) {
    if ("richText" in value) {
      return (
        (value as { richText: { text: string }[] }).richText || []
      )
        .map((r) => r.text)
        .join("");
    }
    if ("text" in value) {
      return (value as { text: string }).text;
    }
    if ("result" in value) {
      return normalizeValue((value as { result: unknown }).result);
    }
  }
  return value;
}

export async function readExcelAsArrays(file: File): Promise<unknown[][]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const rows: unknown[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const values = row.values as unknown[];
    rows.push(values.slice(1).map(normalizeValue));
  });

  return rows;
}

export async function readExcelAsObjects(
  file: File,
): Promise<Record<string, unknown>[]> {
  const rows = await readExcelAsArrays(file);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => String(h ?? ""));
  const data: Record<string, unknown>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((cell) => !cell)) continue;

    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      if (header && row[index] !== undefined && row[index] !== null) {
        obj[header] = row[index];
      }
    });
    if (Object.keys(obj).length > 0) {
      data.push(obj);
    }
  }

  return data;
}

export function excelDateToString(serial: number): string {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const date = new Date(excelEpoch.getTime() + serial * 86400000);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface SheetData {
  name: string;
  data: unknown[][];
  columnWidths?: number[];
}

export async function createAndDownloadExcel(
  sheets: SheetData[],
  filename: string,
): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);

    for (const row of sheet.data) {
      worksheet.addRow(row);
    }

    if (sheet.columnWidths) {
      sheet.columnWidths.forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width;
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, filename);
}
