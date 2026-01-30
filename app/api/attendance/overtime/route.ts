import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { OvertimeStatus } from "@prisma/client";

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
      user.role === "CHIEF_EXECUTIVE_OFFICER" ||
      user.role === "ADMIN_MANAGER";

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
            include: { department: true }
          },
          freeLancer: {
            include: { department: true }
          }
        },
        orderBy: { requestedAt: "desc" }
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, freelancerId, startTime, hours, reason } = body;

    const date = new Date();
    date.setHours(0, 0, 0, 0);

    // Check if one already exists
    const existing = await db.overtimeRequest.findFirst({
      where: {
        OR: [
          { employeeId: employeeId, date: date },
          { freeLancerId: freelancerId, date: date },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const overtimeRequest = await db.overtimeRequest.create({
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

    return NextResponse.json(overtimeRequest);
  } catch (error) {
    console.error("Overtime request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
        freeLancer: true
      }
    });

    if (status === OvertimeStatus.APPROVED) {
      // Find the attendance record for this day and link it
      const record = await db.attendanceRecord.findFirst({
        where: {
          employeeId: updated.employeeId || undefined,
          freeLancerId: updated.freeLancerId || undefined,
          date: updated.date,
        }
      });

      if (record) {
        await db.attendanceRecord.update({
          where: { id: record.id },
          data: { overtimeRequestId: updated.id }
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update overtime error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
