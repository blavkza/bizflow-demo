import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Cron test endpoint is working",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cronSecret: process.env.CRON_SECRET ? "Set" : "Not set",
    databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set",
  });
}
