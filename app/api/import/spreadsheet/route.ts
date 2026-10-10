import { NextResponse } from "next/server";
import { importFromCsv } from "@/lib/dashboard/csv-import";
import { importFromXlsx, type XlsxSheetChoice } from "@/lib/dashboard/xlsx-import";
import { parseImport } from "@/lib/dashboard/data";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a spreadsheet file." }, { status: 400 });
    const name = file.name.toLowerCase();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const sheet = form.get("sheet");
    const choice = sheet === "all" || typeof sheet === "string" && sheet.length ? (sheet as XlsxSheetChoice) : undefined;

    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const result = importFromXlsx(bytes, choice);
      if ("needsChoice" in result) return NextResponse.json(result);
      parseImport(JSON.stringify(result.data));
      return NextResponse.json({ data: result.data });
    }

    if (name.endsWith(".csv")) {
      const data = importFromCsv(new TextDecoder().decode(bytes));
      parseImport(JSON.stringify(data));
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "Use a .csv, .xlsx, or .xls file." }, { status: 400 });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Could not read this spreadsheet.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
