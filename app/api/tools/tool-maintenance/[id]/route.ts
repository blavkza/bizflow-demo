import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { MaintenanceStatus } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
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
  { params }: { params: Promise<{ id: string }> },
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

    const { condition, ...otherValues } = values;
    let updateData = { ...otherValues };

    if (values.status === "COMPLETED" && !values.completionDate) {
      updateData.completionDate = new Date();
      // Also potentially update the tool status back to AVAILABLE if it was linked?
      // For now, we just track maintenance status.
    }

    if (values.status === "IN_PROGRESS" && !values.startDate) {
      updateData.startDate = new Date();
    }

    const maintenanceLog = await db.$transaction(async (tx) => {
      const updatedLog = await tx.toolMaintenance.update({
        where: { id },
        data: updateData,
      });

      // If status is completed and there's an associated tool, return it to stock
      if (updatedLog.toolId) {
        const toolUpdate: any = {};

        if (values.status === "COMPLETED") {
          toolUpdate.status = "AVAILABLE";
        }

        if (values.condition) {
          toolUpdate.condition = values.condition;
        }

        if (Object.keys(toolUpdate).length > 0) {
          await tx.tool.update({
            where: { id: updatedLog.toolId },
            data: toolUpdate,
          });
        }

        // Create a movement record for returning from maintenance or updating state if status changed
        if (values.status === "COMPLETED") {
          await tx.toolMovement.create({
            data: {
              toolId: updatedLog.toolId,
              type: "MAINTENANCE_IN",
              quantity: updatedLog.quantity || 1,
              notes: `Auto-returned to stock upon maintenance completion: ${id}. Condition set to: ${values.condition || "unchanged"}`,
              createdBy: userId,
            },
          });
        }
      }

      return updatedLog;
    });

    return NextResponse.json(maintenanceLog);
  } catch (error) {
    console.log("[MAINTENANCE_LOG_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
