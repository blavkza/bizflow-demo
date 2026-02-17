import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    const maintenances = await db.maintenance.findMany({
      where: clientId ? { clientId } : {},
      select: {
        id: true,
        task: true,
        client: {
          select: {
            name: true,
          },
        },
        status: true,
        date: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(maintenances);
  } catch (error) {
    console.error("[MAINTENANCE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
