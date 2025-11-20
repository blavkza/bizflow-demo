import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "BizFlow API",
    environment: process.env.NODE_ENV,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
