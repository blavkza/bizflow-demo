import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, employeeId, severity, reason, actionPlan } = body;

    if (!employeeId || !type || !severity || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create warning in database
    const warning = await db.warning.create({
      data: {
        employeeId,
        type,
        severity,
        reason,
        actionPlan: actionPlan || "",
        status: "ACTIVE",
        date: new Date(),
      },
    });

    return NextResponse.json(warning);
  } catch (error) {
    console.error("Create warning API error:", error);
    return NextResponse.json(
      { error: "Failed to create warning" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeResolved = searchParams.get("includeResolved") === "true";

    const warnings = await db.warning.findMany({
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            department: {
              select: {
                name: true,
              },
            },
            avatar: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Transform the data to match frontend expectations
    const transformedWarnings = warnings.map((warning) => ({
      id: warning.id,
      type: warning.type,
      severity: warning.severity,
      reason: warning.reason,
      actionPlan: warning.actionPlan,
      date: warning.date.toISOString(),
      status: warning.status,
      resolvedAt: warning.resolvedAt?.toISOString(),
      resolutionNotes: warning.resolutionNotes,
      employee: {
        id: warning.employee.id,
        name: `${warning.employee.firstName} ${warning.employee.lastName}`,
        position: warning.employee.position,
        department: warning.employee.department?.name || "No Department",
        avatar: warning.employee.avatar,
      },
    }));

    return NextResponse.json(transformedWarnings);
  } catch (error) {
    console.error("Get warnings API error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { warningId, status, resolutionNotes } = body;

    if (!warningId) {
      return NextResponse.json(
        { error: "Warning ID is required" },
        { status: 400 }
      );
    }

    const updatedWarning = await db.warning.update({
      where: { id: warningId },
      data: {
        status: status || "RESOLVED",
        resolvedAt: new Date(),
        resolutionNotes: resolutionNotes || "Warning resolved by manager",
      },
    });

    return NextResponse.json(updatedWarning);
  } catch (error) {
    console.error("Update warning API error:", error);
    return NextResponse.json(
      { error: "Failed to update warning" },
      { status: 500 }
    );
  }
}

// Optional: DELETE endpoint for permanent removal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warningId = searchParams.get("id");

    if (!warningId) {
      return NextResponse.json(
        { error: "Warning ID is required" },
        { status: 400 }
      );
    }

    await db.warning.delete({
      where: { id: warningId },
    });

    return NextResponse.json({ message: "Warning deleted successfully" });
  } catch (error) {
    console.error("Delete warning API error:", error);
    return NextResponse.json(
      { error: "Failed to delete warning" },
      { status: 500 }
    );
  }
}
