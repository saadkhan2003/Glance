import { MAX_IMPORT_BYTES } from "@/lib/dashboard/data";
import type { ImportTable } from "@/lib/sources/types";

function normalizeRows(rows: string[][]) {
  return rows
    .map((row) => row.map((cell) => String(cell ?? "").trim()))
    .filter((row) => row.some((cell) => cell.length > 0));
}

function uniqueColumns(header: string[]) {
  const seen = new Set<string>();
  return header.map((cell, index) => {
    const base = cell.trim() || `Column ${index + 1}`;
    let name = base;
    let suffix = 2;
    while (seen.has(name)) {
      name = `${base} (${suffix++})`;
    }
    seen.add(name);
    return name;
  });
}

function slug(value: string) {
  const slugged = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slugged || "sheet";
}

export function buildDynamicTable(title: string, headerRow: string[], dataRows: string[][]): ImportTable {
  const columns = uniqueColumns(headerRow.map((cell) => String(cell ?? "")));
  const rows = normalizeRows(dataRows).map((row) => {
    const record: Record<string, string | number> = {};
    columns.forEach((column, index) => {
      const raw = row[index] ?? "";
      const numeric = Number(raw);
      record[column] = raw !== "" && Number.isFinite(numeric) && /^-?\d/.test(raw) ? numeric : raw;
    });
    return record;
  });
  return { id: slug(title), title: title.trim() || "Imported sheet", columns, rows };
}

/** Optional structured layouts used by curated revenue and customer widgets. */
export function parseTabularImport(headerRow: string[], dataRows: string[][]) {
  const header = headerRow.map((cell) => String(cell ?? "").trim().toLowerCase());
  const rows = normalizeRows(dataRows);
  const key = header.join(",");
  if (key === "id,name,region,amount,status") {
    return {
      customers: {
        rows: rows.map((row) => ({
          id: row[0],
          name: row[1],
          region: row[2],
          amount: Number(row[3]),
          status: row[4],
        })),
      },
    };
  }
  if (key === "month,revenue,costs") {
    return {
      revenue: {
        labels: rows.map((row) => row[0]),
        values: rows.map((row) => Number(row[1])),
        costs: rows.map((row) => Number(row[2])),
        goal: 100000,
      },
    };
  }
  throw new Error("No structured layout detected for this header.");
}

function cells(line: string) {
  return line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

export function importFromCsv(text: string) {
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) throw new Error("CSV must be smaller than 500 KB");
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV needs a header row and at least one data row.");
  const header = cells(lines[0]);
  const rows = lines.slice(1).map(cells);
  const table = buildDynamicTable("CSV", header, rows);
  let structured: Record<string, unknown> = {};
  try {
    structured = parseTabularImport(header, rows);
  } catch {
    /* keep dynamic table only */
  }
  return { ...structured, tables: { items: [table] } };
}

export function mergeStructured(parts: Record<string, unknown>[]) {
  const merged: Record<string, unknown> = {};
  for (const part of parts) {
    for (const [key, value] of Object.entries(part)) {
      if (!merged[key]) {
        merged[key] = value;
        continue;
      }
      if (key === "customers" && typeof value === "object" && value && "rows" in value) {
        const existing = merged.customers as { rows: unknown[] };
        const next = value as { rows: unknown[] };
        merged.customers = { rows: [...existing.rows, ...next.rows] };
        continue;
      }
      throw new Error(`More than one "${key}" table was found. Import one sheet at a time for structured metrics.`);
    }
  }
  return merged;
}
