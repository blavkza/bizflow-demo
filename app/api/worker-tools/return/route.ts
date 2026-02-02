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
      // 1. Update the assigned tool record
      const updatedAssignedTool = await tx.employeeTool.update({
        where: { id: toolId },
        data: {
          quantity: assignedTool.quantity - quantity,
          status:
            assignedTool.quantity - quantity === 0 ? "AVAILABLE" : "ASSIGNED",
          returnDate:
            assignedTool.quantity - quantity === 0 ? new Date() : undefined,
          condition: condition || assignedTool.condition,
          damageDescription:
            damageDescription || assignedTool.damageDescription,
          damageCost: damageCost ? Number(damageCost) : assignedTool.damageCost,
        },
      });

      // 2. Create the return log
      await tx.toolReturn.create({
        data: {
          toolId: toolId,
          employeeId: assignedTool.employeeId,
          freelancerId: assignedTool.freelancerId,
          quantity: quantity,
          status: status || "AVAILABLE",
          condition: condition || "GOOD",
          damageDescription: damageDescription,
          damageCost: damageCost ? Number(damageCost) : 0,
          processedById: user?.id,
        },
      });

      // 3. Create Employee Notification
      if (assignedTool.employeeId) {
        await tx.employeeNotification.create({
          data: {
            employeeId: assignedTool.employeeId,
            title: "Tool Return Processed",
            message: `Returned: ${quantity}x ${assignedTool.name}. Condition: ${condition || "GOOD"}.`,
            type: "TOOLS",
            priority: "MEDIUM",
            channels: ["PUSH", "IN_APP"],
          },
        });
      }

      // 4. If it has a parent tool, return the quantity to it
      if (assignedTool.parentToolId) {
        await tx.employeeTool.update({
          where: { id: assignedTool.parentToolId },
          data: {
            quantity: {
              increment: quantity,
            },
          },
        });
      } else {
        // If no parent tool, maybe this tool was assigned directly from "AVAILABLE" status
        if (assignedTool.quantity - quantity === 0) {
          await tx.employeeTool.update({
            where: { id: toolId },
            data: {
              status: status || "AVAILABLE",
              employeeId: null,
              freelancerId: null,
              assignedDate: null,
            },
          });
        }
      }

      // 5. Create Maintenance Record if status is MAINTENANCE
      if (status === "MAINTENANCE") {
        const reporterName = assignedTool.employee
          ? `${assignedTool.employee.firstName} ${assignedTool.employee.lastName}`
          : assignedTool.freelancer
            ? `${assignedTool.freelancer.firstName} ${assignedTool.freelancer.lastName}`
            : "Unknown Worker";

        await tx.toolMaintenance.create({
          data: {
            toolId: toolId,
            toolName: assignedTool.name,
            serialNumber: assignedTool.serialNumber,
            quantity: quantity,
            issueDescription:
              damageDescription || "Return maintenance check required",
            status: "PENDING",
            priority: damageDescription ? "HIGH" : "MEDIUM",
            reportedBy: reporterName,
          },
        });
      }

      return updatedAssignedTool;
    });

    // Send Push Notification if employee
    if (assignedTool.employeeId) {
      await sendPushNotification({
        employeeId: assignedTool.employeeId,
        title: "Tool Returned",
        body: `You have successfully returned ${quantity}x ${assignedTool.name}.`,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.log("[TOOL_RETURN_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
