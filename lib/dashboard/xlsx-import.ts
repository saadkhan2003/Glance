import * as XLSX from "xlsx";
import { MAX_IMPORT_BYTES } from "@/lib/dashboard/data";
import { buildDynamicTable, mergeStructured, parseTabularImport } from "@/lib/dashboard/sheet-import";
import type { ImportTable } from "@/lib/sources/types";

export type XlsxSheetChoice = "all" | string;

function readWorkbook(bytes: Uint8Array) {
  if (bytes.byteLength > MAX_IMPORT_BYTES) throw new Error("Excel file must be smaller than 500 KB");
  const workbook = XLSX.read(bytes, { type: "array" });
  if (!workbook.SheetNames.length) throw new Error("This Excel file has no worksheets.");
  return workbook;
}

function rawSheet(workbook: XLSX.WorkBook, sheetName: string) {
  const table = XLSX.utils.sheet_to_json<(string | number)[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: "",
    blankrows: false,
  });
  if (table.length < 2) return null;
  const [header, ...rows] = table.map((row) => (Array.isArray(row) ? row : []).map((cell) => String(cell ?? "")));
  return { header, rows };
}

function importSheets(workbook: XLSX.WorkBook, names: string[], skipEmpty: boolean) {
  const structured: Record<string, unknown>[] = [];
  const tables: ImportTable[] = [];
  for (const name of names) {
    const sheet = rawSheet(workbook, name);
    if (!sheet) {
      if (skipEmpty) continue;
      throw new Error(`"${name}" needs a header row and at least one data row.`);
    }
    tables.push(buildDynamicTable(name, sheet.header, sheet.rows));
    try {
      structured.push(parseTabularImport(sheet.header, sheet.rows));
    } catch {
      /* dynamic-only sheet */
    }
  }
  if (!tables.length) {
    throw new Error(
      skipEmpty
        ? "No worksheets with data were found."
        : "This worksheet is empty or missing a header row.",
    );
  }
  const merged = structured.length ? mergeStructured(structured) : {};
  return { ...merged, tables: { items: tables } };
}

export function importFromXlsx(bytes: Uint8Array, choice?: XlsxSheetChoice) {
  const workbook = readWorkbook(bytes);
  const names = workbook.SheetNames;
  if (!choice) {
    if (names.length === 1) return { data: importSheets(workbook, names, false) };
    return { needsChoice: true as const, sheets: names };
  }
  if (choice === "all") return { data: importSheets(workbook, names, true) };
  if (!names.includes(choice)) throw new Error(`Worksheet "${choice}" was not found in this file.`);
  return { data: importSheets(workbook, [choice], false) };
}
