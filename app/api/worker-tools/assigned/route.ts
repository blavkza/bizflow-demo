import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ToolStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch all tools that are currently ALLOCATED to someone
    const assignedTools = await db.tool.findMany({
      where: {
        OR: [{ NOT: { employeeId: null } }, { NOT: { freelancerId: null } }],
        status: ToolStatus.ALLOCATED,
        quantity: { gt: 0 },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
      orderBy: {
        allocatedDate: "desc",
      },
    });

    const formatted = assignedTools.map((t) => ({
      id: t.id,
      name: t.name,
      quantity: t.quantity,
      serialNumber: t.serialNumber,
      allocatedDate: t.allocatedDate,
      condition: t.condition,
      images: t.images,
      workerName: t.employee
        ? `${t.employee.firstName} ${t.employee.lastName}`
        : t.freelancer
          ? `${t.freelancer.firstName} ${t.freelancer.lastName}`
          : "Unknown",
      workerType: t.employee ? "EMPLOYEE" : "FREELANCER",
      workerId: t.employeeId || t.freelancerId,
      category: t.category,
      purchasePrice: parseFloat(t.purchasePrice.toString()),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.log("[ALL_ALLOCATED_TOOLS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
