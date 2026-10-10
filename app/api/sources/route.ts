import { NextRequest, NextResponse } from "next/server";
import { emptySnapshot } from "@/lib/dashboard/data";
import { SOURCE_IDS, type SourceId } from "@/lib/sources/types";
export async function GET(request: NextRequest) {
  const snapshot=emptySnapshot();
  const source=request.nextUrl.searchParams.get("source") ?? "workspace";
  snapshot.focus=SOURCE_IDS.includes(source as SourceId)?source as SourceId:"workspace";
  return NextResponse.json({snapshot},{headers:{"Cache-Control":"public, max-age=60"}});
}
