import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employeeId,
      leaveType,
      startDate,
      endDate,
      days,
      reason,
      contactInfo,
    } = body;

    // Find employee by employee number
    const employee = await db.employee.findUnique({
      where: { employeeNumber: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const leaveRequest = await db.leaveRequest.create({
      data: {
        employeeId: employee.id,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days: parseInt(days),
        reason,
        contactInfo,
        status: "PENDING",
        requestedDate: new Date(),
      },
    });

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error("Error creating leave request:", error);
    return NextResponse.json(
      { error: "Failed to create leave request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");

    const where = {
      ...(status && status !== "ALL" ? { status } : {}),
      ...(employeeId ? { employeeId } : {}),
    };

    const leaveRequests = await db.leaveRequest.findMany({
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            avatar: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        requestedDate: "desc",
      },
    });

    // Transform the data to match the frontend format
    const formattedRequests = leaveRequests.map((request) => ({
      id: request.id,
      employeeId: request.employee.employeeNumber,
      employeeName: `${request.employee.firstName} ${request.employee.lastName}`,
      employeeAvatar: request.employee.avatar,
      leaveType: request.leaveType,
      startDate: request.startDate.toISOString().split("T")[0],
      endDate: request.endDate.toISOString().split("T")[0],
      days: request.days,
      reason: request.reason,
      status: request.status,
      requestedDate: request.requestedDate.toISOString().split("T")[0],
      approvedBy: request.approvedBy,
      approvedDate: request.approvedDate?.toISOString().split("T")[0],
      rejectedBy: request.rejectedBy,
      rejectedDate: request.rejectedDate?.toISOString().split("T")[0],
      comments: request.comments,
      department: request.employee.department?.name || "No Department",
    }));

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave requests" },
      { status: 500 }
    );
  }
}
