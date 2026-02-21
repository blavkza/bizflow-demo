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
          tools: {
            include: {
              toolChecks: {
                orderBy: { checkDate: "desc" },
                take: 1,
              },
            },
          },
        },
      });
    } else if (type === "freelancer") {
      worker = await db.freeLancer.findUnique({
        where: { id: workerId },
        include: {
          tools: {
            include: {
              toolChecks: {
                orderBy: { checkDate: "desc" },
                take: 1,
              },
            },
          },
        },
      });
    } else if (type === "trainee") {
      worker = await db.trainee.findUnique({
        where: { id: workerId },
        include: {
          tools: {
            include: {
              toolChecks: {
                orderBy: { checkDate: "desc" },
                take: 1,
              },
            },
          },
        },
      });
    } else {
      return new NextResponse("Invalid worker type", { status: 400 });
    }

    if (!worker) {
      return new NextResponse("Worker not found", { status: 404 });
    }

    // Format tools and sort by assigned date descending
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const formattedTools = worker.tools.map((tool: any) => {
      const lastCheck = tool.toolChecks[0];
      const lastCheckDate = lastCheck ? new Date(lastCheck.checkDate) : null;
      const needsCheck = !lastCheckDate || lastCheckDate < sevenDaysAgo;

      return {
        ...tool,
        lastCheckDate,
        needsCheck,
      };
    });

    formattedTools.sort(
      (a: any, b: any) =>
        new Date(b.allocatedDate || 0).getTime() -
        new Date(a.allocatedDate || 0).getTime(),
    );

    return NextResponse.json({
      worker: {
        id: worker.id,
        name: worker.name || `${worker.firstName} ${worker.lastName}`,
        email: worker.email,
        phone: worker.phone,
        position: worker.jobTitle || "N/A",
        department: worker.department || "N/A",
        type: type.toUpperCase(),
      },
      tools: formattedTools,
    });
  } catch (error) {
    console.log("[WORKER_ALLOCATION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
