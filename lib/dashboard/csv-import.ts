import { MAX_IMPORT_BYTES } from "@/lib/dashboard/data";

function cells(line: string) {
  return line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

/** One CSV becomes one dataset: customers, or monthly revenue. */
export function importFromCsv(text: string) {
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) throw new Error("CSV must be smaller than 500 KB");
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const header = cells(lines[0] ?? "").map((cell) => cell.toLowerCase());
  const rows = lines.slice(1).map(cells);
  if (header.join(",") === "id,name,region,amount,status") {
    return { customers: { rows: rows.map((row) => ({ id: row[0], name: row[1], region: row[2], amount: Number(row[3]), status: row[4] })) } };
  }
  if (header.join(",") === "month,revenue,costs") {
    return { revenue: { labels: rows.map((row) => row[0]), values: rows.map((row) => Number(row[1])), costs: rows.map((row) => Number(row[2])), goal: 100000 } };
  }
  throw new Error("CSV header must be id,name,region,amount,status or month,revenue,costs. Use JSON or SQLite for the full workspace.");
}
