import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ToolStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const {
      toolId,
      condition,
      isPresent,
      isLost,
      damageDescription,
      cost,
      deductFromWorker,
      pushToMaintenance,
      notes,
    } = await req.json();

    if (!toolId) {
      return new NextResponse("Tool ID is required", { status: 400 });
    }

    const tool = await db.tool.findUnique({
      where: { id: toolId },
    });

    if (!tool) {
      return new NextResponse("Tool not found", { status: 404 });
    }

    // Check if tool was already checked in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const existingCheck = await db.toolCheck.findFirst({
      where: {
        toolId,
        checkDate: {
          gte: sevenDaysAgo,
        },
      },
    });

    if (existingCheck) {
      return new NextResponse(
        "This tool has already been checked in the last 7 days",
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: { userId: userId! },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 1. Create Tool Check Record
    const toolCheck = await db.toolCheck.create({
      data: {
        toolId,
        employeeId: tool.employeeId,
        freelancerId: tool.freelancerId,
        traineeId: tool.traineeId,
        checkDate: new Date(),
        condition: condition,
        isPresent: isPresent,
        isLost: isLost,
        damageCost: cost || 0,
        damageDescription: damageDescription,
        notes: notes,
        checkedBy: user.id,
        deductFromWorker: deductFromWorker || false,
      },
    });

    // 2. Update Tool Status and Condition
    const updateData: any = {
      condition: condition,
    };

    if (isLost) {
      updateData.status = ToolStatus.LOST;
      updateData.condition = "LOST";
      updateData.quantity = 0;
    } else if (condition === "DAMAGED" || pushToMaintenance) {
      updateData.status = pushToMaintenance
        ? ToolStatus.MAINTENANCE
        : ToolStatus.DAMAGED;
      if (pushToMaintenance) {
        updateData.employeeId = null;
        updateData.freelancerId = null;
        updateData.traineeId = null;
        updateData.allocatedDate = null;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await db.$transaction(async (tx) => {
        await tx.tool.update({
          where: { id: toolId },
          data: updateData,
        });

        if (pushToMaintenance) {
          const workerName = tool.employeeId
            ? "Employee"
            : tool.freelancerId
              ? "Freelancer"
              : tool.traineeId
                ? "Trainee"
                : "Worker";

          await tx.toolMaintenance.create({
            data: {
              toolId,
              toolName: tool.name,
              serialNumber: tool.serialNumber,
              quantity: tool.quantity,
              reportedBy: workerName,
              issueDescription:
                damageDescription ||
                "Tool reported as damaged and moved to maintenance.",
              cost: cost || 0,
              status: "PENDING",
              priority: "MEDIUM",
              notes: notes || "Moved to maintenance from worker tool check.",
            },
          });

          // Create an approved ToolReturn record
          await tx.toolReturn.create({
            data: {
              toolId,
              employeeId: tool.employeeId,
              freelancerId: tool.freelancerId,
              traineeId: tool.traineeId,
              quantity: tool.quantity,
              status: "MAINTENANCE",
              condition: (condition as any) || "DAMAGED",
              damageDescription:
                damageDescription || "Sent to maintenance during check.",
              damageCost: cost || 0,
              isApproved: true,
              processedById: user.id, // Fixed: use internal user ID
              adminNotes:
                "Automatically returned and approved via Worker Tool Check (Maintenance)",
            },
          });
        }
      });
    }

    return NextResponse.json(toolCheck);
  } catch (error) {
    console.error("[TOOL_CHECK_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
