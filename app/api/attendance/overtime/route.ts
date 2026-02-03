import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { OvertimeStatus } from "@prisma/client";

// SIMPLIFIED TIMEZONE FUNCTION (Matching check-in/route.ts)
function getCurrentSASTAsUTC() {
  const now = new Date();
  const sastFormatter = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const sastParts = sastFormatter.formatToParts(now);
  const getPart = (type: string) =>
    sastParts.find((p) => p.type === type)?.value || "00";

  const year = parseInt(getPart("year"));
  const month = parseInt(getPart("month")) - 1; // 0-indexed
  const day = parseInt(getPart("day"));

  return {
    sastDate: new Date(Date.UTC(year, month, day)), // SAST date at midnight UTC
  };
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      include: { employee: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const dateStr = searchParams.get("date");
    const all = searchParams.get("all");

    const hasFullAccess =
      user.role === "CHIEF_EXECUTIVE_OFFICER" || user.role === "ADMIN_MANAGER";

    if (all === "true") {
      // Build where clause
      const where: any = {};

      if (!hasFullAccess && user.employee?.departmentId) {
        where.OR = [
          { employee: { departmentId: user.employee.departmentId } },
          { freeLancer: { departmentId: user.employee.departmentId } },
        ];
      }

      // Fetch all requests, typically for admin view
      const requests = await db.overtimeRequest.findMany({
        where,
        include: {
          employee: {
            include: { department: true },
          },
          freeLancer: {
            include: { department: true },
          },
        },
        orderBy: { requestedAt: "desc" },
      });
      return NextResponse.json({ requests });
    }

    if (employeeId && dateStr) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);

      const existingRequest = await db.overtimeRequest.findFirst({
        where: {
          employeeId: employeeId,
          date: date,
        },
      });

      return NextResponse.json({ request: existingRequest });
    }

    // Default: return all pending if admin, or user's own if not
    // For now, just return empty if no params
    return NextResponse.json({ requests: [] });
  } catch (error) {
    console.error("Fetch overtime error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employeeId: inputEmployeeId,
      freelancerId: inputFreelancerId,
      startTime,
      hours,
      reason,
    } = body;

    let employeeId = null;
    let freelancerId = null;

    if (inputEmployeeId) {
      const employee = await db.employee.findFirst({
        where: {
          OR: [{ id: inputEmployeeId }, { employeeNumber: inputEmployeeId }],
        },
      });
      if (employee) {
        employeeId = employee.id;
      }
    } else if (inputFreelancerId) {
      const freelancer = await db.freeLancer.findFirst({
        where: {
          OR: [
            { id: inputFreelancerId },
            { freeLancerNumber: inputFreelancerId },
          ],
        },
      });
      if (freelancer) {
        freelancerId = freelancer.id;
      }
    }

    if (!employeeId && !freelancerId) {
      return NextResponse.json(
        { error: "Employee or Freelancer not found" },
        { status: 404 },
      );
    }

    const { sastDate: date } = getCurrentSASTAsUTC();

    let overtimeRequest = await db.overtimeRequest.findFirst({
      where: {
        OR: [
          ...(employeeId ? [{ employeeId, date }] : []),
          ...(freelancerId ? [{ freeLancerId: freelancerId, date }] : []),
        ],
      },
    });

    if (!overtimeRequest) {
      overtimeRequest = await db.overtimeRequest.create({
        data: {
          employeeId,
          freeLancerId: freelancerId,
          date: date,
          startTime: startTime ? new Date(startTime) : new Date(),
          duration: hours ? parseFloat(hours) : null,
          reason: reason || "Accepting overtime offer",
          status: OvertimeStatus.PENDING,
        },
      });
    }

    // Link this overtime request to the today's attendance record
    try {
      const attendanceRecord = await db.attendanceRecord.findFirst({
        where: {
          AND: [
            { date: date },
            employeeId ? { employeeId } : { freeLancerId: freelancerId },
          ],
        },
      });

      if (attendanceRecord && !attendanceRecord.overtimeRequestId) {
        await db.attendanceRecord.update({
          where: { id: attendanceRecord.id },
          data: { overtimeRequestId: overtimeRequest.id },
        });
        console.log(
          `Linked overtime request ${overtimeRequest.id} to attendance record ${attendanceRecord.id}`,
        );
      }
    } catch (linkError) {
      console.error("Error linking overtime to attendance:", linkError);
    }

    return NextResponse.json(overtimeRequest);
  } catch (error) {
    console.error("Overtime request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, status } = body;

    const updated = await db.overtimeRequest.update({
      where: { id: requestId },
      data: {
        status,
        approvedAt: status === OvertimeStatus.APPROVED ? new Date() : null,
        approvedBy: status === OvertimeStatus.APPROVED ? userId : null,
      },
      include: {
        employee: true,
        freeLancer: true,
      },
    });

    if (status === OvertimeStatus.APPROVED) {
      // Find the attendance record for this day and link it
      const record = await db.attendanceRecord.findFirst({
        where: {
          employeeId: updated.employeeId || undefined,
          freeLancerId: updated.freeLancerId || undefined,
          date: updated.date,
        },
      });

      if (record) {
        await db.attendanceRecord.update({
          where: { id: record.id },
          data: { overtimeRequestId: updated.id },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update overtime error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
