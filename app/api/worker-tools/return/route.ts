import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { WorkerToolStatus, ToolCondition } from "@prisma/client";
import { sendPushNotification } from "@/lib/expo";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      toolId,
      quantity,
      status,
      condition,
      damageDescription,
      damageCost,
    } = body;

    if (!toolId || !quantity || quantity <= 0) {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    const assignedTool = await db.employeeTool.findUnique({
      where: { id: toolId },
      include: {
        employee: true,
        freelancer: true,
      },
    });

    if (!assignedTool) {
      return new NextResponse("Tool not found", { status: 404 });
    }

    if (assignedTool.quantity < quantity) {
      return new NextResponse("Return quantity exceeds assigned quantity", {
        status: 400,
      });
    }

    const user = await db.user.findUnique({
      where: { userId: userId },
    });

    // Start Transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Update the assigned tool record status to show it's awaiting return approval
      const updatedAssignedTool = await tx.employeeTool.update({
        where: { id: toolId },
        data: {
          status: "PENDING_RETURN" as WorkerToolStatus,
        },
      });

      // 2. Create the pending return log
      const toolReturn = await tx.toolReturn.create({
        data: {
          toolId,
          employeeId: assignedTool.employeeId,
          freelancerId: assignedTool.freelancerId,
          quantity,
          status: "PENDING_RETURN" as WorkerToolStatus,
          condition: condition || ("GOOD" as ToolCondition),
          damageDescription,
          isApproved: false,
          processedById: null,
        } as any,
      });

      // 3. Create Employee Notification
      if (assignedTool.employeeId) {
        await tx.employeeNotification.create({
          data: {
            employeeId: assignedTool.employeeId,
            title: "Tool Return Initiated",
            message: `Return request sent for: ${quantity}x ${assignedTool.name}. Awaiting admin approval.`,
            type: "TOOLS",
            priority: "LOW",
            channels: ["IN_APP"],
          },
        });
      }

      return toolReturn;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.log("[TOOL_RETURN_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
