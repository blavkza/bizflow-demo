import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { MaintenanceStatus } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const maintenanceLog = await db.toolMaintenance.findUnique({
      where: {
        id: id,
      },
      include: {
        tool: {
          select: {
            images: true,
            name: true,
            serialNumber: true,
          },
        },
      },
    });

    if (!maintenanceLog) {
      return new NextResponse("Maintenance log not found", { status: 404 });
    }

    return NextResponse.json(maintenanceLog);
  } catch (error) {
    console.log("[MAINTENANCE_LOG_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    const values = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // If status is changing to COMPLETED, ensure completionDate is set
    // If status is changing to IN_PROGRESS, ensure startDate is set (if not already)

    let updateData = { ...values };

    if (values.status === "COMPLETED" && !values.completionDate) {
      updateData.completionDate = new Date();
      // Also potentially update the tool status back to AVAILABLE if it was linked?
      // For now, we just track maintenance status.
    }

    if (values.status === "IN_PROGRESS" && !values.startDate) {
      updateData.startDate = new Date();
    }

    const maintenanceLog = await db.toolMaintenance.update({
      where: {
        id: id,
      },
      data: {
        ...updateData,
      },
    });

    // Optional: If maintenance is completed, we might want to update the tool's status back to AVAILABLE
    // efficiently if that is the workflow. For now, assuming manual return to stock via another process or just tracking maintenance.
    // But if the tool was returned solely for maintenance, it might still be "in maintenance" or "available" depending on business logic.
    // Let's keep it simple: just update the log for now.

    return NextResponse.json(maintenanceLog);
  } catch (error) {
    console.log("[MAINTENANCE_LOG_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
