import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// GET - Get tools allocated to workers that need weekly checks
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const freelancerId = searchParams.get("freelancerId");
    const trainerId = searchParams.get("trainerId");

    // Get allocated tools
    const where: any = {
      status: {
        in: ["ALLOCATED", "MAINTENANCE", "DAMAGED"],
      },
    };

    if (employeeId) where.employeeId = employeeId;
    if (freelancerId) where.freelancerId = freelancerId;
    if (trainerId) where.trainerId = trainerId;

    const tools = await db.tool.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            freeLancerNumber: true,
          },
        },
        trainer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            trainerNumber: true,
          },
        },
        toolChecks: {
          orderBy: {
            checkDate: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        allocatedDate: "desc",
      },
    });

    // Calculate which tools need checks (last check > 7 days ago or never checked)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const formattedTools = tools.map((tool) => {
      const lastCheck = tool.toolChecks[0];
      const lastCheckDate = lastCheck ? new Date(lastCheck.checkDate) : null;
      const needsCheck = !lastCheckDate || lastCheckDate < sevenDaysAgo;
      const daysSinceCheck = lastCheckDate
        ? Math.floor(
            (now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60 * 24),
          )
        : null;

      return {
        id: tool.id,
        name: tool.name,
        serialNumber: tool.serialNumber,
        category: tool.category,
        status: tool.status,
        condition: tool.condition,
        quantity: tool.quantity,
        images: tool.images,
        allocatedDate: tool.allocatedDate,
        damageCost: tool.damageCost
          ? parseFloat(tool.damageCost.toString())
          : 0,
        damageDescription: tool.damageDescription,
        workerName: tool.employee
          ? `${tool.employee.firstName} ${tool.employee.lastName}`
          : tool.freelancer
            ? `${tool.freelancer.firstName} ${tool.freelancer.lastName}`
            : tool.trainer
              ? `${tool.trainer.firstName} ${tool.trainer.lastName}`
              : "N/A",
        workerNumber:
          tool.employee?.employeeNumber ||
          tool.freelancer?.freeLancerNumber ||
          tool.trainer?.trainerNumber ||
          "N/A",
        employeeId: tool.employeeId,
        freelancerId: tool.freelancerId,
        trainerId: tool.trainerId,
        lastCheckDate,
        daysSinceCheck,
        needsCheck,
        lastCheckCondition: lastCheck?.condition || null,
        lastCheckNotes: lastCheck?.notes || null,
      };
    });

    return NextResponse.json(formattedTools);
  } catch (error: any) {
    console.log("[TOOL_CHECKS_PENDING_GET]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
