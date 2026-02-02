import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const maintenanceLogs = await db.toolMaintenance.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        tool: {
          select: {
            images: true,
          },
        },
      },
    });

    return NextResponse.json(maintenanceLogs);
  } catch (error) {
    console.log("[TOOL_MAINTENANCE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
