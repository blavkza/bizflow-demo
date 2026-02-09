import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserPermission, UserRole, ToolStatus } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: { toolId: string } },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { toolId } = params;

    const tool = await db.tool.findUnique({
      where: { id: toolId },
      include: {
        employee: true,
        freelancer: true,
      },
    });

    if (!tool) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Fetch "Fleet" - all tools that are technically the "same" item
    // We group by Name and Serial (if present).
    // Identify the "Master" tool ID
    // If this tool has a parent, the parent is the master.
    // If this tool has no parent, IT is the master (or it's a standalone tool).
    const masterId = (tool as any).parentToolId || tool.id;

    // Fetch "Fleet" - the Master Tool and all its Sub-Tools (Allocations)
    const fleet = await db.tool.findMany({
      where: {
        OR: [
          { id: masterId }, // The Master Tool itself
          { parentToolId: masterId }, // All Sub-Tools linked to the Master
        ],
      } as any,
      include: {
        employee: true,
        freelancer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ...tool, fleet });
  } catch (error) {
    console.log("[WORKER_TOOL_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { toolId: string } },
) {
  try {
    const { userId } = await auth();
    const user = await db.user.findUnique({
      where: { userId: userId! },
    });

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const hasPermission =
      user.permissions.includes(UserPermission.WORKER_TOOLS_EDIT) ||
      user.role === UserRole.CHIEF_EXECUTIVE_OFFICER ||
      user.role === UserRole.ADMIN_MANAGER;

    if (!hasPermission) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { toolId } = params;
    const body = await req.json();
    const {
      name,
      description,
      serialNumber,
      code,
      category,
      purchasePrice,
      quantity,
      purchaseDate: purchaseDateString,
      employeeId,
      freelancerId,
      condition,
      images,
      canBeRented,
      rentalRateDaily,
      rentalRateWeekly,
      rentalRateMonthly,
    } = body;

    const purchaseDate = purchaseDateString
      ? new Date(purchaseDateString)
      : null;

    const existingTool = await db.tool.findUnique({
      where: { id: toolId },
    });

    if (!existingTool) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Determine status change
    let status = existingTool.status;
    let allocatedDate = existingTool.allocatedDate;

    const isAssigned = employeeId || freelancerId;
    const wasAssigned = existingTool.employeeId || existingTool.freelancerId;

    if (isAssigned && !wasAssigned) {
      status = ToolStatus.ALLOCATED;
      allocatedDate = new Date();
    } else if (!isAssigned && wasAssigned) {
      status = ToolStatus.AVAILABLE;
      allocatedDate = null;
    }

    const updatedTool = await db.$transaction(async (tx) => {
      // If this is an allocation (child tool) and we are changing assignment or quantity
      if (existingTool.parentToolId) {
        // Handle full unassignment (Manual Return via Edit Modal)
        if (!isAssigned && wasAssigned) {
          await tx.tool.update({
            where: { id: existingTool.parentToolId },
            data: {
              quantity: {
                increment: existingTool.quantity,
              },
            },
          });

          // Log Check In
          await tx.toolMovement.create({
            data: {
              toolId: existingTool.parentToolId,
              type: "CHECK_IN",
              quantity: existingTool.quantity,
              createdBy: user.id,
              notes: "Manual unassignment via edit",
            },
          });

          // This specific record becomes AVAILABLE with 0 quantity (returned)
          return await tx.tool.update({
            where: { id: toolId },
            data: {
              name,
              description,
              serialNumber,
              code,
              category,
              purchasePrice,
              purchaseDate,
              quantity: 0,
              employeeId: null,
              freelancerId: null,
              condition: condition || existingTool.condition,
              images: images || existingTool.images,
              status: ToolStatus.AVAILABLE,
              allocatedDate: null,
              returnDate: new Date(),
              canBeRented,
              rentalRateDaily,
              rentalRateWeekly,
              rentalRateMonthly,
            },
          });
        }

        // Handle quantity adjustment for an assigned tool
        if (quantity !== undefined && quantity !== existingTool.quantity) {
          const diff = quantity - existingTool.quantity;

          // Verify master has enough if incrementing
          if (diff > 0) {
            const master = await tx.tool.findUnique({
              where: { id: existingTool.parentToolId },
            });
            if (master && master.quantity < diff) {
              throw new Error("Insufficient quantity in main inventory");
            }
          }

          // Adjust Parent (Decrement diff. If diff negative, it increments)
          await tx.tool.update({
            where: { id: existingTool.parentToolId },
            data: {
              quantity: {
                decrement: diff,
              },
            },
          });

          // Log Movement
          await tx.toolMovement.create({
            data: {
              toolId: existingTool.parentToolId,
              type: diff > 0 ? "CHECK_OUT" : "CHECK_IN",
              quantity: Math.abs(diff),
              createdBy: user.id,
              notes:
                diff > 0
                  ? "Quantity increased via edit"
                  : "Quantity decreased via edit",
            },
          });
        }
      }

      return await tx.tool.update({
        where: { id: toolId },
        data: {
          name,
          description,
          serialNumber,
          code,
          category,
          purchasePrice,
          quantity,
          purchaseDate,
          employeeId,
          freelancerId,
          condition,
          images,
          status,
          allocatedDate,
          canBeRented,
          rentalRateDaily,
          rentalRateWeekly,
          rentalRateMonthly,
        },
      });
    });

    return NextResponse.json(updatedTool);
  } catch (error: any) {
    console.log("[WORKER_TOOL_PATCH]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { toolId: string } },
) {
  try {
    const { userId } = await auth();
    const user = await db.user.findUnique({
      where: { userId: userId! },
    });

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const hasPermission =
      user.permissions.includes(UserPermission.WORKER_TOOLS_DELETE) ||
      user.role === UserRole.CHIEF_EXECUTIVE_OFFICER ||
      user.role === UserRole.ADMIN_MANAGER;

    if (!hasPermission) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { toolId } = params;

    const existingTool = await db.tool.findUnique({
      where: { id: toolId },
    });

    if (!existingTool) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const tool = await db.$transaction(async (tx) => {
      // If deleting an allocation, return its quantity back to parent
      if (existingTool.parentToolId) {
        await tx.tool.update({
          where: { id: existingTool.parentToolId },
          data: {
            quantity: {
              increment: existingTool.quantity,
            },
          },
        });

        // Log Check In
        await tx.toolMovement.create({
          data: {
            toolId: existingTool.parentToolId,
            type: "CHECK_IN",
            quantity: existingTool.quantity,
            createdBy: user.id,
            notes: "Allocation deleted",
          },
        });
      }

      return await tx.tool.delete({
        where: { id: toolId },
      });
    });

    return NextResponse.json(tool);
  } catch (error) {
    console.log("[WORKER_TOOL_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
