import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch all tools that are currently ASSIGNED to someone
    const assignedTools = await db.employeeTool.findMany({
      where: {
        OR: [{ NOT: { employeeId: null } }, { NOT: { freelancerId: null } }],
        status: "ASSIGNED",
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
        assignedDate: "desc",
      },
    });

    const formatted = assignedTools.map((t) => ({
      id: t.id,
      name: t.name,
      quantity: t.quantity,
      serialNumber: t.serialNumber,
      assignedDate: t.assignedDate,
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
    console.log("[ALL_ASSIGNED_TOOLS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
