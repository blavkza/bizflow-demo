import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushNotification } from "@/lib/expo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, employeeId, severity, reason, actionPlan } = body;

    if (!employeeId || !type || !severity || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

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

    await db.employeeNotification.create({
      data: {
        employeeId: employeeId,
        title: "New Warning Issued",
        message: `You have received a ${severity} severity warning regarding ${type}. Reason: ${reason}`,
        type: "WARNING",
        isRead: false,
        actionUrl: `/dashboard/warnings/${warning.id}`,
      },
    });

    // Send push notification to the worker
    await sendPushNotification({
      employeeId: employeeId,
      title: "New Warning Issued",
      body: `You have received a ${severity} severity warning regarding ${type}.`,
      data: { warningId: warning.id, type: "WARNING" },
    });

    return NextResponse.json(warning);
  } catch (error) {
    console.error("Create warning API error:", error);
    return NextResponse.json(
      { error: "Failed to create warning" },
      { status: 500 },
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
      appealReason: warning.appealReason,
      appealDate: warning.appealDate?.toISOString(),
      adminDecision: warning.adminDecision,
      workerResponse: warning.workerResponse,
      workerResponseDate: warning.workerResponseDate?.toISOString(),
      employee: {
        id: warning.employee?.id || "",
        name: warning.employee
          ? `${warning.employee.firstName || ""} ${warning.employee.lastName || ""}`.trim()
          : "Unknown Employee",
        position: warning.employee?.position || "Unknown",
        department: warning.employee?.department?.name || "No Department",
        avatar: warning.employee?.avatar || null,
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
    const {
      warningId,
      status,
      resolutionNotes,
      appealReason,
      adminDecision,
      workerResponse,
    } = body;

    if (!warningId) {
      return NextResponse.json(
        { error: "Warning ID is required" },
        { status: 400 },
      );
    }

    const updateData: any = {
      status: status,
      updatedAt: new Date(),
    };

    if (status === "RESOLVED") {
      updateData.resolvedAt = new Date();
      updateData.resolutionNotes = resolutionNotes || "Warning resolved";
    }

    if (appealReason) {
      updateData.appealReason = appealReason;
      updateData.appealDate = new Date();
      updateData.status = "APPEALED";
    }

    if (adminDecision) {
      updateData.adminDecision = adminDecision;
      // If admin provides a decision, it could be REJECTED or NEXT_STEP
      if (status) updateData.status = status;
    }

    if (workerResponse) {
      updateData.workerResponse = workerResponse;
      updateData.workerResponseDate = new Date();
      if (workerResponse === "ACCEPTED") {
        updateData.status = "NEXT_STEP_ACCEPTED";
      }
    }

    const updatedWarning = await db.warning.update({
      where: { id: warningId },
      data: updateData,
    });

    // Notify employee for admin actions
    if (
      status === "RESOLVED" ||
      status === "REJECTED" ||
      status === "NEXT_STEP"
    ) {
      await db.employeeNotification.create({
        data: {
          employeeId: updatedWarning.employeeId,
          title: `Warning ${status}`,
          message: `Your warning status has been updated to ${status}. ${
            adminDecision || resolutionNotes || ""
          }`,
          type: "WARNING",
          isRead: false,
          actionUrl: `/dashboard/warnings/${updatedWarning.id}`,
        },
      });

      // Send push notification to the worker
      if (updatedWarning.employeeId) {
        await sendPushNotification({
          employeeId: updatedWarning.employeeId,
          title: `Warning ${status}`,
          body: `Your warning status has been updated to ${status}.`,
          data: { warningId: updatedWarning.id, type: "WARNING" },
        });
      }
    }

    // Notify admin for worker actions (appeal or acceptance)
    if (appealReason || workerResponse === "ACCEPTED") {
      // In a real app we'd find the HR managers, for now we just log or notify system
      console.log(
        `Worker action on warning ${warningId}: ${appealReason ? "Appealed" : "Accepted next step"}`,
      );
    }

    return NextResponse.json(updatedWarning);
  } catch (error) {
    console.error("Update warning API error:", error);
    return NextResponse.json(
      { error: "Failed to update warning" },
      { status: 500 },
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
        { status: 400 },
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
      { status: 500 },
    );
  }
}
