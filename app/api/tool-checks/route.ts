import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserPermission, UserRole } from "@prisma/client";

// POST - Create a new tool check
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
      user.permissions.includes(UserPermission.WORKER_TOOLS_VIEW) ||
      user.role === UserRole.CHIEF_EXECUTIVE_OFFICER ||
      user.role === UserRole.ADMIN_MANAGER ||
      user.role === UserRole.GENERAL_MANAGER;

    if (!hasPermission) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const {
      toolId,
      employeeId,
      freelancerId,
      traineeId,
      condition,
      isPresent,
      isLost,
      damageCost,
      damageDescription,
      pushToMaintenance,
      notes,
    } = body;

    if (!toolId) {
      return new NextResponse("Tool ID is required", { status: 400 });
    }

    // Check if tool was already checked in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const existingCheck = await db.toolCheck.findFirst({
      where: {
        toolId,
        checkDate: {
          gte: sevenDaysAgo,
        },
      },
    });

    if (existingCheck) {
      return new NextResponse(
        "This tool has already been checked in the last 7 days",
        { status: 400 },
      );
    }

    // Create the tool check
    const toolCheck = await db.toolCheck.create({
      data: {
        toolId,
        employeeId,
        freelancerId,
        traineeId,
        condition,
        isPresent: isPresent ?? true,
        isLost: isLost ?? false,
        damageCost: damageCost ? parseFloat(damageCost) : 0,
        damageDescription,
        notes,
        checkedBy: user.id,
        deductFromWorker: body.deductFromWorker ?? false,
      },
      include: {
        tool: true,
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
        trainee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            traineeNumber: true,
          },
        },
      },
    });

    // If tool is lost or damaged, update the tool status
    if (
      isLost ||
      (damageCost && parseFloat(damageCost) > 0) ||
      pushToMaintenance
    ) {
      await db.$transaction(async (tx) => {
        const status = isLost
          ? "LOST"
          : pushToMaintenance
            ? "MAINTENANCE"
            : "DAMAGED";

        await tx.tool.update({
          where: { id: toolId },
          data: {
            status,
            condition: isLost ? "LOST" : condition,
            damageCost: damageCost ? parseFloat(damageCost) : undefined,
            damageDescription: damageDescription || undefined,
            // If lost, keep allocation but set quantity to 0
            ...(isLost && {
              quantity: 0,
            }),
            // If pushed to maintenance, remove from worker
            ...(pushToMaintenance && {
              employeeId: null,
              freelancerId: null,
              traineeId: null,
              allocatedDate: null,
            }),
          },
        });

        if (pushToMaintenance) {
          const workerName = toolCheck.employee
            ? `${toolCheck.employee.firstName} ${toolCheck.employee.lastName}`
            : toolCheck.freelancer
              ? `${toolCheck.freelancer.firstName} ${toolCheck.freelancer.lastName}`
              : toolCheck.trainee
                ? `${toolCheck.trainee.firstName} ${toolCheck.trainee.lastName}`
                : "Inspector";

          await tx.toolMaintenance.create({
            data: {
              toolId,
              toolName: toolCheck.tool.name,
              serialNumber: toolCheck.tool.serialNumber,
              quantity: toolCheck.tool.quantity,
              reportedBy: workerName,
              issueDescription:
                damageDescription ||
                "Tool reported as damaged during inspection and sent to maintenance.",
              cost: damageCost ? parseFloat(damageCost) : 0,
              status: "PENDING",
              priority: "MEDIUM",
              notes: notes || "Moved to maintenance from tool check dialog.",
            },
          });

          // Create an approved ToolReturn record
          await tx.toolReturn.create({
            data: {
              toolId,
              employeeId: toolCheck.employeeId,
              freelancerId: toolCheck.freelancerId,
              traineeId: toolCheck.traineeId,
              quantity: toolCheck.tool.quantity,
              status: "MAINTENANCE",
              condition: condition as any,
              damageDescription:
                damageDescription || "Sent to maintenance during check.",
              damageCost: damageCost ? parseFloat(damageCost) : 0,
              isApproved: true,
              processedById: user.id,
              adminNotes:
                "Automatically returned and approved via Tool Check (Maintenance)",
            },
          });
        }
      });
    }

    return NextResponse.json(toolCheck);
  } catch (error: any) {
    console.log("[TOOL_CHECKS_POST]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}

// GET - Retrieve tool checks with filters
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    const user = await db.user.findUnique({
      where: { userId: userId! },
    });

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const toolId = searchParams.get("toolId");
    const employeeId = searchParams.get("employeeId");
    const freelancerId = searchParams.get("freelancerId");
    const traineeId = searchParams.get("traineeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (toolId) where.toolId = toolId;
    if (employeeId) where.employeeId = employeeId;
    if (freelancerId) where.freelancerId = freelancerId;
    if (traineeId) where.traineeId = traineeId;

    if (startDate || endDate) {
      where.checkDate = {};
      if (startDate) where.checkDate.gte = new Date(startDate);
      if (endDate) where.checkDate.lte = new Date(endDate);
    }

    const toolChecks = await db.toolCheck.findMany({
      where,
      include: {
        tool: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
            category: true,
            images: true,
            purchasePrice: true,
          },
        },
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
        trainee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            traineeNumber: true,
          },
        },
      },
      orderBy: {
        checkDate: "desc",
      },
    });

    // Format the response
    const formattedChecks = toolChecks.map((check) => ({
      id: check.id,
      toolId: check.toolId,
      toolName: check.tool.name,
      toolSerialNumber: check.tool.serialNumber,
      toolCategory: check.tool.category,
      toolImage: check.tool.images?.[0] || null,
      toolPurchasePrice: check.tool.purchasePrice
        ? parseFloat(check.tool.purchasePrice.toString())
        : 0,
      workerName: check.employee
        ? `${check.employee.firstName} ${check.employee.lastName}`
        : check.freelancer
          ? `${check.freelancer.firstName} ${check.freelancer.lastName}`
          : check.trainee
            ? `${check.trainee.firstName} ${check.trainee.lastName}`
            : "N/A",
      workerNumber:
        check.employee?.employeeNumber ||
        check.freelancer?.freeLancerNumber ||
        check.trainee?.traineeNumber ||
        "N/A",
      checkDate: check.checkDate,
      condition: check.condition,
      isPresent: check.isPresent,
      isLost: check.isLost,
      damageCost: check.damageCost
        ? parseFloat(check.damageCost.toString())
        : 0,
      damageDescription: check.damageDescription,
      notes: check.notes,
      checkedBy: check.checkedBy,
      createdAt: check.createdAt,
      deductFromWorker: check.deductFromWorker,
    }));

    return NextResponse.json(formattedChecks);
  } catch (error: any) {
    console.log("[TOOL_CHECKS_GET]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
