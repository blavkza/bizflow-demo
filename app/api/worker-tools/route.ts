import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserPermission, UserRole } from "@prisma/client";

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
      purchasePrice,
      quantity,
      employeeId,
      freelancerId,
      condition,
      images,
    } = body;

    const tool = await db.employeeTool.create({
      data: {
        name,
        description,
        serialNumber,
        purchasePrice,
        quantity,
        employeeId,
        freelancerId,
        condition,
        images,
        // Automatically set status based on assignment
        status: employeeId || freelancerId ? "ASSIGNED" : "AVAILABLE",
        assignedDate: employeeId || freelancerId ? new Date() : null,
        createdBy: user.id,
      },
    });

    return NextResponse.json(tool);
  } catch (error) {
    console.log("[WORKER_TOOLS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const tools = await db.employeeTool.findMany({
      where: {
        parentToolId: null,
      },
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
      status: tool.status,
      condition: tool.condition,
      purchasePrice: parseFloat(tool.purchasePrice.toString()),
      quantity: tool.quantity,
      images: tool.images,
      assignedDate: tool.assignedDate,
      assignedTo: tool.employee
        ? `${tool.employee.firstName} ${tool.employee.lastName}`
        : tool.freelancer
          ? `${tool.freelancer.firstName} ${tool.freelancer.lastName}`
          : "Unassigned",
      employeeId: tool.employeeId,
      freelancerId: tool.freelancerId,
    }));

    return NextResponse.json(formattedTools);
  } catch (error) {
    console.log("[WORKER_TOOLS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
