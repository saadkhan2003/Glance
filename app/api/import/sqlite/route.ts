import { NextResponse } from "next/server";
import { importFromSqlite } from "@/lib/dashboard/sqlite-import";
import { parseImport } from "@/lib/dashboard/data";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a SQLite file." }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const data = importFromSqlite(bytes);
    parseImport(JSON.stringify(data));
    return NextResponse.json({ data });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Could not read this database.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
