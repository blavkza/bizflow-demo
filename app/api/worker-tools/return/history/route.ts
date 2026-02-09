import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const freelancerId = searchParams.get("freelancerId");

    const where: any = {};
    if (employeeId) {
      where.employeeId = employeeId;
    }
    if (freelancerId) {
      where.freelancerId = freelancerId;
    }

    const returns = await db.toolReturn.findMany({
      where,
      include: {
        tool: {
          select: {
            name: true,
            serialNumber: true,
            images: true,
          },
        },
        employee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        freelancer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        processedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        returnedDate: "desc",
      },
    });

    const formatted = returns.map((r) => ({
      id: r.id,
      toolName: r.tool?.name || "Unknown Tool",
      serialNumber: r.tool?.serialNumber,
      images: r.tool?.images || [],
      workerName: r.employee
        ? `${r.employee.firstName} ${r.employee.lastName}`
        : r.freelancer
          ? `${r.freelancer.firstName} ${r.freelancer.lastName}`
          : "Unknown",
      quantity: r.quantity,
      condition: r.condition,
      status: r.status,
      damageDescription: r.damageDescription,
      damageCost: r.damageCost ? parseFloat(r.damageCost.toString()) : 0,
      returnedDate: r.returnedDate,
      processedBy: r.processedBy?.name || "System",
      isApproved: (r as any).isApproved,
      adminNotes: (r as any).adminNotes,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.log("[TOOL_RETURNS_HISTORY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
