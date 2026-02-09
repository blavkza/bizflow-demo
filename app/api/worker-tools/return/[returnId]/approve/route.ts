import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ToolStatus, ToolCondition } from "@prisma/client";
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
    const {
      damageCost,
      status,
      adminNotes,
      reject = false,
      retained = false,
    } = body;

    const toolReturn = await db.toolReturn.findUnique({
      where: { id: returnId },
      include: {
        tool: true,
        employee: true,
        freelancer: true,
      },
    });

    if (!toolReturn) {
      return new NextResponse("Return request not found", { status: 404 });
    }

    if ((toolReturn as any).isApproved) {
      return new NextResponse("Return already processed", { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Handle Rejection
      if (reject) {
        // Restore tool status to ALLOCATED if rejected
        // BUT if it was a "Pending Return" split tool, "ALLOCATED" is correct?
        // Yes, it acts as a "Rejected Return" so tool stays with worker.
        // Theoretically we might want to merge it back to original allocation?
        // But keeping it separate (but Allocated) is acceptable.
        await tx.tool.update({
          where: { id: toolReturn.toolId },
          data: { status: ToolStatus.ALLOCATED },
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

      // 2. Handle Approval
      const finalStatus =
        status ||
        (toolReturn.condition === "DAMAGED"
          ? ToolStatus.DAMAGED
          : ToolStatus.AVAILABLE);

      // 2.1 Automatically create Maintenance Record if status is MAINTENANCE
      if (finalStatus === ToolStatus.MAINTENANCE) {
        const workerName = toolReturn.employee
          ? `${toolReturn.employee.firstName} ${toolReturn.employee.lastName}`
          : toolReturn.freelancer
            ? `${toolReturn.freelancer.firstName} ${toolReturn.freelancer.lastName}`
            : "System/Admin";

        await tx.toolMaintenance.create({
          data: {
            toolId: toolReturn.toolId,
            toolName: toolReturn.tool.name,
            serialNumber: toolReturn.tool.serialNumber,
            quantity: toolReturn.quantity,
            issueDescription:
              toolReturn.damageDescription ||
              "Maintenance required upon return",
            cost: damageCost ? Number(damageCost) : 0,
            priority: "MEDIUM",
            status: "PENDING",
            reportedBy: workerName,
            notes: adminNotes || "Automated entry from tool return approval",
          },
        });
      }

      if (toolReturn.tool.parentToolId) {
        // SCENARIO A: Returning an Allocation (Child Tool)
        // We empty the child and increment the parent.

        const newQuantity = toolReturn.tool.quantity - toolReturn.quantity;
        // Should be 0 usually (since we split before returning).
        // If not 0, we only return part of this record? (Should follow split logic).

        // Update Child (Empty/Return it)
        await tx.tool.update({
          where: { id: toolReturn.toolId },
          data: {
            quantity: newQuantity,
            status:
              newQuantity === 0 && !retained
                ? ToolStatus.RETURNED
                : finalStatus, // Mark as RETURNED (History)
            returnDate: newQuantity === 0 && !retained ? new Date() : undefined,
            damageCost: damageCost
              ? Number(damageCost)
              : toolReturn.tool.damageCost,
            damageDescription: toolReturn.damageDescription,
          },
        });

        if (!retained) {
          // Increment Parent
          await tx.tool.update({
            where: { id: toolReturn.tool.parentToolId },
            data: {
              quantity: {
                increment: toolReturn.quantity,
              },
            },
          });

          // Log Movement (Check In) for Parent
          await tx.toolMovement.create({
            data: {
              toolId: toolReturn.tool.parentToolId,
              type: "CHECK_IN",
              quantity: toolReturn.quantity,
              createdBy: adminUser.id,
              notes: `Return Approved: ${toolReturn.id}`,
            },
          });
        }
      } else {
        // SCENARIO B: Returning a Standalone Tool (Master / No Parent)
        // We restore the Master to Available status.
        // We DO NOT change quantity (unless partial loss?).
        // Assuming Full Return of what was assigned.

        await tx.tool.update({
          where: { id: toolReturn.toolId },
          data: {
            status: finalStatus, // AVAILABLE
            returnDate: retained ? undefined : new Date(),
            damageCost: damageCost
              ? Number(damageCost)
              : toolReturn.tool.damageCost,
            damageDescription: toolReturn.damageDescription,
            employeeId: retained ? toolReturn.employeeId : null, // Clear Assignment UNLESS retained
            freelancerId: retained ? toolReturn.freelancerId : null,
            allocatedDate: retained ? toolReturn.tool.allocatedDate : null,
          },
        });

        if (!retained) {
          // Log Movement (Check In) for This Tool
          await tx.toolMovement.create({
            data: {
              toolId: toolReturn.toolId,
              type: "CHECK_IN",
              quantity: toolReturn.quantity,
              createdBy: adminUser.id,
              notes: `Return Approved: ${toolReturn.id}`,
            },
          });
        }
      }

      // 3. Update Return Record
      const updatedReturn = await tx.toolReturn.update({
        where: { id: returnId },
        data: {
          isApproved: true,
          status: finalStatus as ToolStatus,
          damageCost: damageCost ? Number(damageCost) : 0,
          processedById: adminUser.id,
          adminNotes: adminNotes,
        } as any,
      });

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
      try {
        await sendPushNotification({
          employeeId: toolReturn.employeeId,
          title: "Tool Return Approved",
          body: `Your return of ${toolReturn.tool.name} has been processed by admin.`,
        });
      } catch (e) {
        console.error("Push notification failed", e);
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.log("[TOOL_RETURN_APPROVE_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
