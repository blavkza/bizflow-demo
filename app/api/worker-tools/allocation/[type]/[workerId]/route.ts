import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { type: string; workerId: string } },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { type, workerId } = params;

    let worker: any = null;
    let tools: any[] = [];

    if (type === "employee") {
      worker = await db.employee.findUnique({
        where: { id: workerId },
        include: {
          tools: true,
        },
      });
    } else if (type === "freelancer") {
      worker = await db.freeLancer.findUnique({
        where: { id: workerId },
        include: {
          tools: true,
        },
      });
    } else {
      return new NextResponse("Invalid worker type", { status: 400 });
    }

    if (!worker) {
      return new NextResponse("Worker not found", { status: 404 });
    }

    // Sort tools by assigned date descending
    // @ts-ignore
    tools = worker.tools.sort(
      (a: any, b: any) =>
        new Date(b.assignedDate || 0).getTime() -
        new Date(a.assignedDate || 0).getTime(),
    );

    return NextResponse.json({
      worker: {
        id: worker.id,
        name: worker.name || `${worker.firstName} ${worker.lastName}`,
        email: worker.email,
        phone: worker.phone, // Assuming phone exists
        position: worker.jobTitle || "N/A", // Adjust based on schema
        department: worker.department || "N/A",
        type: type.toUpperCase(),
      },
      tools,
    });
  } catch (error) {
    console.log("[WORKER_ALLOCATION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
