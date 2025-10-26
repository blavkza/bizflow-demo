import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { AttendanceStatus, LeaveStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    console.log(
      `Creating bulk leave attendance from ${start.toISOString()} to ${end.toISOString()}`
    );

    // Get all approved leave requests that overlap with the date range
    const approvedLeaves = await db.leaveRequest.findMany({
      where: {
        status: LeaveStatus.APPROVED,
        OR: [
          // Leave starts within the range
          {
            startDate: { gte: start, lte: end },
          },
          // Leave ends within the range
          {
            endDate: { gte: start, lte: end },
          },
          // Leave spans the entire range
          {
            startDate: { lte: start },
            endDate: { gte: end },
          },
        ],
      },
      include: {
        employee: {
          include: {
            department: true,
            AttendanceRecord: {
              where: {
                date: {
                  gte: start,
                  lte: end,
                },
              },
              select: {
                id: true,
                date: true,
              },
            },
          },
        },
      },
    });

    console.log(
      `Found ${approvedLeaves.length} approved leave requests in date range`
    );

    const createdRecords = [];
    const errors = [];

    for (const leave of approvedLeaves) {
      try {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);
        leaveStart.setHours(0, 0, 0, 0);
        leaveEnd.setHours(23, 59, 59, 999);

        // Generate all dates for this leave period
        const dates = getDatesInRange(leaveStart, leaveEnd);

        // Filter dates to only include those within our target range
        const targetDates = dates.filter(
          (date) => date >= start && date <= end
        );

        console.log(
          `Processing ${targetDates.length} days for employee ${leave.employee.firstName}`
        );

        for (const date of targetDates) {
          // Check if attendance record already exists for this date
          const existingRecord = leave.employee.AttendanceRecord.find(
            (record: any) => record.date.toDateString() === date.toDateString()
          );

          if (existingRecord) {
            console.log(
              `Skipping ${date.toISOString()} - record already exists`
            );
            continue;
          }

          // Create attendance record for this leave day
          const attendanceRecord = await db.attendanceRecord.create({
            data: {
              employeeId: leave.employee.id,
              date: date,
              status: getLeaveAttendanceStatus(leave.leaveType),
              scheduledKnockIn: leave.employee.scheduledKnockIn,
              scheduledKnockOut: leave.employee.scheduledKnockOut,
              notes: `Auto-created: ${getLeaveTypeDisplayName(leave.leaveType)} - ${leave.reason || "Approved Leave"}`,
            },
            include: {
              employee: {
                include: {
                  department: true,
                },
              },
            },
          });

          createdRecords.push({
            id: attendanceRecord.id,
            employee: `${leave.employee.firstName} ${leave.employee.lastName}`,
            status: attendanceRecord.status,
            date: date.toISOString().split("T")[0],
            leaveType: leave.leaveType,
          });

          console.log(
            `Created leave record for ${leave.employee.firstName} on ${date.toISOString().split("T")[0]}`
          );
        }
      } catch (error) {
        console.error(`Error processing leave ${leave.id}:`, error);
        errors.push({
          leaveId: leave.id,
          employeeName: `${leave.employee.firstName} ${leave.employee.lastName}`,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const response = {
      message: "Bulk leave attendance records created",
      timestamp: new Date().toISOString(),
      dateRange: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      },
      totalLeaves: approvedLeaves.length,
      created: createdRecords.length,
      records: createdRecords,
      errors: errors.length > 0 ? errors : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Bulk leave attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to get all dates in a range
function getDatesInRange(startDate: Date, endDate: Date): Date[] {
  const dates = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

function getLeaveAttendanceStatus(leaveType: string): AttendanceStatus {
  switch (leaveType) {
    case "SICK_LEAVE":
      return AttendanceStatus.SICK_LEAVE;
    case "UNPAID_LEAVE":
      return AttendanceStatus.UNPAID_LEAVE;
    case "ANNUAL_LEAVE":
    case "MATERNITY_LEAVE":
    case "PATERNITY_LEAVE":
    case "STUDY_LEAVE":
    default:
      return AttendanceStatus.ANNUAL_LEAVE;
  }
}

function getLeaveTypeDisplayName(leaveType: string): string {
  switch (leaveType) {
    case "ANNUAL_LEAVE":
      return "Annual Leave";
    case "SICK_LEAVE":
      return "Sick Leave";
    case "UNPAID_LEAVE":
      return "Unpaid Leave";
    case "MATERNITY_LEAVE":
      return "Maternity Leave";
    case "PATERNITY_LEAVE":
      return "Paternity Leave";
    case "STUDY_LEAVE":
      return "Study Leave";
    default:
      return "Leave";
  }
}
