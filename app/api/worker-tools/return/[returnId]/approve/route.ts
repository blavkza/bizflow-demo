import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { WorkerToolStatus, ToolCondition } from "@prisma/client";
import { sendPushNotification } from "@/lib/expo";

export async function PATCH(
  req: Request,
  { params }: { params: { returnId: string } },
) {
  try {
    const { userId } = await auth();
    const { returnId } = params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const adminUser = await db.user.findUnique({
      where: { userId: userId },
    });

    if (!adminUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    const body = await req.json();
    const { damageCost, status, adminNotes, reject = false } = body;

    const toolReturn = await db.toolReturn.findUnique({
      where: { id: returnId },
      include: {
        tool: true,
      },
    });

    if (!toolReturn) {
      return new NextResponse("Return request not found", { status: 404 });
    }

    if ((toolReturn as any).isApproved) {
      return new NextResponse("Return already processed", { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      if (reject) {
        // Restore tool status to ALLOCATED if rejected
        await tx.employeeTool.update({
          where: { id: toolReturn.toolId },
          data: { status: "ALLOCATED" },
        });

        return await tx.toolReturn.update({
          where: { id: returnId },
          data: {
            isApproved: false,
            processedById: adminUser.id,
            adminNotes: adminNotes || "Rejected",
          },
        });
      }

      // Finalize the return
      const finalStatus =
        status ||
        (toolReturn.condition === "DAMAGED" ? "DAMAGED" : "AVAILABLE");
      const newQuantity = toolReturn.tool.quantity - toolReturn.quantity;

      // 1. Update Inventory
      await tx.employeeTool.update({
        where: { id: toolReturn.toolId },
        data: {
          quantity: newQuantity,
          status: newQuantity === 0 ? "RETURNED" : finalStatus,
          returnDate: newQuantity === 0 ? new Date() : undefined,
          damageCost: damageCost
            ? Number(damageCost)
            : toolReturn.tool.damageCost,
          damageDescription: toolReturn.damageDescription,
        },
      });

      // 2. Update Return Record
      const updatedReturn = await tx.toolReturn.update({
        where: { id: returnId },
        data: {
          isApproved: true,
          status: finalStatus as WorkerToolStatus,
          damageCost: damageCost ? Number(damageCost) : 0,
          processedById: adminUser.id,
          adminNotes: adminNotes,
        } as any,
      });

      // 3. Update Parent Tool if applicable
      if (toolReturn.tool.parentToolId) {
        await tx.employeeTool.update({
          where: { id: toolReturn.tool.parentToolId },
          data: {
            quantity: {
              increment: toolReturn.quantity,
            },
          },
        });
      }

      // 4. Create Notification for Employee
      if (toolReturn.employeeId) {
        await tx.employeeNotification.create({
          data: {
            employeeId: toolReturn.employeeId,
            title: "Tool Return Approved",
            message: `Your return for ${toolReturn.quantity}x ${toolReturn.tool.name} was approved. Final Damage Cost: R ${damageCost || 0}.`,
            type: "TOOLS",
            priority: "MEDIUM",
            channels: ["PUSH", "IN_APP"],
          },
        });
      }

      return updatedReturn;
    });

    // Send push notification
    if (toolReturn.employeeId) {
      await sendPushNotification({
        employeeId: toolReturn.employeeId,
        title: "Tool Return Approved",
        body: `Your return of ${toolReturn.tool.name} has been processed by admin.`,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.log("[TOOL_RETURN_APPROVE_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
