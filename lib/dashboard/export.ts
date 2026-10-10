import { widgetById } from "@/lib/widgets/definitions";
import { readModel } from "@/lib/widgets/model";
import type { WorkspaceSnapshot } from "@/lib/sources/types";

export function csvCell(value: unknown): string {
  let s = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(s) && typeof value !== "number") s = `'${s}`;
  return `"${s.replaceAll('"', '""')}"`;
}
export function dashboardCsv(snapshot: WorkspaceSnapshot, ids: string[]): string {
  const output: unknown[][] = [["Widget", "Field", "Value", "Row"]];
  for (const id of ids) {
    const spec = widgetById(id); if (!spec) continue;
    const model = readModel(snapshot, spec);
    if (["stat", "delta", "progress", "gauge"].includes(spec.kind)) {
      output.push([spec.label, "value", model.value, ""], [spec.label, "unit", model.unit, ""]);
      if (spec.kind === "delta") output.push([spec.label,"previous",model.previous,""]);
    } else {
      model.rows.forEach((row,i)=>Object.entries(row).forEach(([key,value])=>output.push([spec.label,key,value,i+1])));
    }
  }
  return output.map(row=>row.map(csvCell).join(",")).join("\r\n");
}
export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
