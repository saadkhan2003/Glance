import { NextResponse } from "next/server";
export function GET() { return NextResponse.json({status:"ok",app:"jev-interfaces",version:"0.2.0"}); }
