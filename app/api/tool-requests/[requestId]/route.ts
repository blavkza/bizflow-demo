import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushNotification } from "@/lib/expo";
import { getUserAuth } from "@/lib/auth";
import { ToolStatus } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: { requestId: string } },
) {
  try {
    const { requestId } = params;

    // 1. Fetch Request
    const request = await db.toolRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          include: { department: true },
        },
        freelancer: {
          include: { department: true },
        },
        resolvedBy: true,
      },
    });

    if (!request) {
      return new NextResponse("Not found", { status: 404 });
    }

    // 2. Fetch Worker History with this specific tool name
    const workerId = request.employeeId || request.freelancerId;
    const workerField = request.employeeId ? "employeeId" : "freelancerId";

    const history = await db.tool.findMany({
      where: {
        [workerField]: workerId,
        name: {
          contains: request.toolName,
          mode: "insensitive",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 3. Fetch Available Quantity in Inventory
    const availableTools = await db.tool.findMany({
      where: {
        name: request.toolName,
        status: ToolStatus.AVAILABLE,
      },
      select: { quantity: true },
    });

    const availableQuantity = availableTools.reduce(
      (sum: number, t: any) => sum + (t.quantity || 1),
      0,
    );

    return NextResponse.json({
      ...request,
      history,
      availableQuantity,
    });
  } catch (error) {
    console.error("[TOOL_REQUEST_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { requestId: string } },
) {
  try {
    const { requestId } = params;
    const body = await req.json();
    const { status, notes, reason } = body;

    const { userId: clerkUserId } = await getUserAuth();
    let dbUserId = "system";

    if (clerkUserId) {
      const user = await db.user.findUnique({
        where: { userId: clerkUserId },
        select: { id: true },
      });
      if (user) dbUserId = user.id;
    }

    // Check if status is valid
    const validStatuses = [
      "PENDING",
      "APPROVED",
      "REJECTED",
      "COMPLETED",
      "WAITLIST",
    ];
    if (!validStatuses.includes(status)) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    const currentRequest = await db.toolRequest.findUnique({
      where: { id: requestId },
    });

    if (!currentRequest) {
      return new NextResponse("Request not found", { status: 404 });
    }

    const updatedRequest = await db.$transaction(async (tx) => {
      if (status === "APPROVED") {
        // Check inventory if it's an existing tool
        const availableTools = await tx.tool.findMany({
          where: {
            name: currentRequest.toolName,
            status: ToolStatus.AVAILABLE,
          },
          orderBy: { quantity: "desc" }, // Prioritize larger piles
        });

        const totalAvailable = availableTools.reduce(
          (sum: number, t: any) => sum + (t.quantity || 1),
          0,
        );

        if (totalAvailable < currentRequest.quantity) {
          throw new Error(
            `Insufficient inventory. Only ${totalAvailable} available.`,
          );
        }

        // Perform Allocation
        let remainingToAssign = currentRequest.quantity;

        for (const toolRecord of availableTools) {
          if (remainingToAssign <= 0) break;

          const recordQty = toolRecord.quantity || 1;

          if (recordQty > remainingToAssign) {
            // Split the record: keep some available, allocate some
            await tx.tool.update({
              where: { id: toolRecord.id },
              data: {
                quantity: { decrement: remainingToAssign },
              },
            });

            const newTool = await tx.tool.create({
              data: {
                name: toolRecord.name,
                description: toolRecord.description,
                serialNumber: toolRecord.serialNumber,
                code: toolRecord.code,
                images: toolRecord.images,
                category: toolRecord.category,
                purchasePrice: toolRecord.purchasePrice,
                purchaseDate: toolRecord.purchaseDate,
                quantity: remainingToAssign,
                status: ToolStatus.ALLOCATED,
                employeeId: currentRequest.employeeId,
                freelancerId: currentRequest.freelancerId,
                allocatedDate: new Date(),
                createdBy: dbUserId,
                parentToolId: toolRecord.parentToolId || toolRecord.id,
                condition: toolRecord.condition,
                additionalInfo: toolRecord.additionalInfo,
              },
            });

            // Log Movement
            await tx.toolMovement.create({
              data: {
                toolId: toolRecord.id, // Log against parent
                type: "CHECK_OUT",
                quantity: remainingToAssign,
                employeeId: currentRequest.employeeId,
                freelancerId: currentRequest.freelancerId,
                createdBy: dbUserId,
                notes: `Request Approved: ${requestId}`,
              },
            });

            remainingToAssign = 0;
          } else {
            // Allocate the whole record
            await tx.tool.update({
              where: { id: toolRecord.id },
              data: {
                status: ToolStatus.ALLOCATED,
                employeeId: currentRequest.employeeId,
                freelancerId: currentRequest.freelancerId,
                allocatedDate: new Date(),
              },
            });

            // Log Movement
            await tx.toolMovement.create({
              data: {
                toolId: toolRecord.id,
                type: "CHECK_OUT",
                quantity: recordQty,
                employeeId: currentRequest.employeeId,
                freelancerId: currentRequest.freelancerId,
                createdBy: dbUserId,
                notes: `Request Approved: ${requestId}`,
              },
            });

            remainingToAssign -= recordQty;
          }
        }
      }

      return await tx.toolRequest.update({
        where: { id: requestId },
        data: {
          status,
          reason,
          notes: notes || undefined,
          resolvedById: dbUserId,
          resolvedDate: ["APPROVED", "REJECTED", "COMPLETED"].includes(status)
            ? new Date()
            : undefined,
        },
      });
    });

    // Notify Employee
    if (updatedRequest.employeeId) {
      let title = "Tool Request Update";
      let message = `Your tool request for ${updatedRequest.toolName} has been ${status.toLowerCase()}.`;

      if (status === "REJECTED" && reason) {
        message += ` Reason: ${reason}`;
      }
      if (status === "WAITLIST") {
        message = `Your tool request for ${updatedRequest.toolName} has been added to the waitlist.`;
      }

      try {
        await sendPushNotification({
          employeeId: updatedRequest.employeeId,
          title,
          body: message,
          data: { type: "TOOL_REQUEST", id: updatedRequest.id, status },
        });
      } catch (e) {
        console.error("Failed to send push notification", e);
      }

      await db.employeeNotification.create({
        data: {
          employeeId: updatedRequest.employeeId,
          title,
          message,
          type: "SYSTEM",
          isRead: false,
        },
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    console.error("[TOOL_REQUEST_PATCH]", error);
    return new NextResponse(error.message || "Internal Error", {
      status: error.message.includes("Insufficient") ? 400 : 500,
    });
  }
}
