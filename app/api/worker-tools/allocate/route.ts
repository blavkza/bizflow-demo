import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ToolStatus } from "@prisma/client";
import { sendPushNotification } from "@/lib/expo";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { sourceToolId, allocations } = body;

    if (!sourceToolId || !allocations || !Array.isArray(allocations)) {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    // Determine total requested quantity
    const totalRequested = allocations.reduce(
      (sum: number, alloc: any) => sum + (Number(alloc.quantity) || 0),
      0,
    );

    if (totalRequested <= 0) {
      return new NextResponse("Quantity must be greater than 0", {
        status: 400,
      });
    }

    // Start Transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Fetch Source Tool
      const sourceTool = await tx.tool.findUnique({
        where: { id: sourceToolId },
      });

      if (!sourceTool) {
        throw new Error("Source tool not found");
      }

      if (sourceTool.quantity < totalRequested) {
        throw new Error(
          `Insufficient quantity. Available: ${sourceTool.quantity}, Requested: ${totalRequested}`,
        );
      }

      // 2. Decrement Source Quantity
      await tx.tool.update({
        where: { id: sourceToolId },
        data: {
          quantity: sourceTool.quantity - totalRequested,
        },
      });

      // 3. Create New Tool Records for Allocations
      const createdTools = [];
      const now = new Date();

      for (const alloc of allocations) {
        const { workerId, workerType, quantity } = alloc;

        const newToolData: any = {
          name: sourceTool.name,
          description: sourceTool.description,
          serialNumber: sourceTool.serialNumber, // Consider if serial number should be unique or copied
          code: sourceTool.code,
          category: sourceTool.category,
          purchasePrice: sourceTool.purchasePrice,
          purchaseDate: sourceTool.purchaseDate,
          quantity: quantity,
          condition: sourceTool.condition,
          status: ToolStatus.ALLOCATED,
          allocatedDate: now,
          createdBy: userId, // Tracking who assigned it
          images: sourceTool.images, // Copy images
          additionalInfo: sourceTool.additionalInfo,
          parentToolId: sourceToolId, // Link to the main tool
        };

        if (workerType === "EMPLOYEE") {
          newToolData.employeeId = workerId;
        } else if (workerType === "FREELANCER") {
          newToolData.freelancerId = workerId;
        }

        const newTool = await tx.tool.create({
          data: newToolData,
        });
        createdTools.push(newTool);
      }

      return createdTools;
    });

    // 4. Send Notifications
    for (const tool of result) {
      if (tool.employeeId) {
        // Parse notifications
        const title = "New Tool Allocated";
        const message = `You have been allocated ${tool.quantity} unit(s) of ${tool.name}.`;

        // Push Notification
        try {
          await sendPushNotification({
            employeeId: tool.employeeId,
            title: title,
            body: message,
            data: { type: "TOOL_ALLOCATION", toolId: tool.id },
          });
        } catch (e) {
          console.error("Failed to send push notification", e);
        }

        // In-App Notification
        await db.employeeNotification.create({
          data: {
            employeeId: tool.employeeId,
            title: title,
            message: message,
            type: "TOOLS",
            priority: "MEDIUM",
            channels: ["IN_APP", "PUSH"],
            isRead: false,
          },
        });
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.log("[TOOL_ALLOCATION_ERROR]", error);
    const message = error.message || "Internal Error";
    return new NextResponse(message, {
      status:
        error.message === "Source tool not found" ||
        error.message.includes("Insufficient")
          ? 400
          : 500,
    });
  }
}
