import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserPermission, UserRole, ToolStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await db.user.findUnique({
      where: { userId: userId! },
    });

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const hasPermission =
      user.permissions.includes(UserPermission.WORKER_TOOLS_CREATE) ||
      user.role === UserRole.CHIEF_EXECUTIVE_OFFICER ||
      user.role === UserRole.ADMIN_MANAGER;

    if (!hasPermission) {
      return new NextResponse("Forbidden", { status: 403 });
    }

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
      parentToolId, // Extract parentToolId
    } = body;

    const purchaseDate = purchaseDateString
      ? new Date(purchaseDateString)
      : null;

    const tool = await db.$transaction(async (tx) => {
      // If allocating from a parent tool
      if (parentToolId) {
        const parent = await tx.tool.findUnique({
          where: { id: parentToolId },
        });

        if (!parent) {
          throw new Error("Parent tool not found");
        }

        if (parent.quantity < quantity) {
          throw new Error("Insufficient quantity in main inventory");
        }

        // Decrement parent quantity
        await tx.tool.update({
          where: { id: parentToolId },
          data: {
            quantity: {
              decrement: quantity,
            },
          },
        });

        // Log the movement (Check Out from Main Inventory)
        await tx.toolMovement.create({
          data: {
            toolId: parentToolId,
            type: "CHECK_OUT",
            quantity: quantity,
            employeeId,
            freelancerId,
            createdBy: user.id,
            notes: "Allocated to worker/freelancer",
          },
        });
      }

      // Create the new tool (allocation record)
      return await tx.tool.create({
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
          canBeRented,
          rentalRateDaily,
          rentalRateWeekly,
          rentalRateMonthly,
          parentToolId, // Link to parent
          status:
            employeeId || freelancerId
              ? ToolStatus.ALLOCATED
              : ToolStatus.AVAILABLE,
          allocatedDate: employeeId || freelancerId ? new Date() : null,
          createdBy: user.id,
        },
      });
    });

    return NextResponse.json(tool);
  } catch (error: any) {
    console.log("[WORKER_TOOLS_POST]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tools = await db.tool.findMany({
      include: {
        employee: true,
        freelancer: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform for table
    const formattedTools = tools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      serialNumber: tool.serialNumber || "-",
      code: tool.code || "-",
      category: tool.category,
      purchaseDate: tool.purchaseDate,
      status: tool.status,
      condition: tool.condition,
      purchasePrice: parseFloat(tool.purchasePrice.toString()),
      quantity: tool.quantity,
      images: tool.images,
      canBeRented: tool.canBeRented,
      rentalRateDaily: tool.rentalRateDaily
        ? parseFloat(tool.rentalRateDaily.toString())
        : null,
      rentalRateWeekly: tool.rentalRateWeekly
        ? parseFloat(tool.rentalRateWeekly.toString())
        : null,
      rentalRateMonthly: tool.rentalRateMonthly
        ? parseFloat(tool.rentalRateMonthly.toString())
        : null,
      allocatedDate: tool.allocatedDate,
      allocatedTo: tool.employee
        ? `${tool.employee.firstName} ${tool.employee.lastName}`
        : tool.freelancer
          ? `${tool.freelancer.firstName} ${tool.freelancer.lastName}`
          : "Unallocated",
      employeeId: tool.employeeId,
      freelancerId: tool.freelancerId,
    }));

    return NextResponse.json(formattedTools);
  } catch (error) {
    console.log("[WORKER_TOOLS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
