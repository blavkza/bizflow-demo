import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employeeId,
      freelancerId,
      leaveType,
      startDate,
      endDate,
      days,
      reason,
      contactInfo,
      emergencyAvailability,
    } = body;

    let employee = null;
    let freelancer = null;

    if (employeeId) {
      // Find employee by employee number
      employee = await db.employee.findFirst({
        where: {
          OR: [{ id: employeeId }, { employeeNumber: employeeId }],
        },
      });
    }

    if (!employee && freelancerId) {
      // Find freelancer
      freelancer = await db.freeLancer.findFirst({
        where: {
          OR: [{ id: freelancerId }, { freeLancerNumber: freelancerId }],
        },
      });
    }

    // Try finding via employeeId passed as freelancerId (fallback)
    if (!employee && !freelancer && employeeId) {
      freelancer = await db.freeLancer.findFirst({
        where: {
          OR: [{ id: employeeId }, { freeLancerNumber: employeeId }],
        },
      });
    }

    if (!employee && !freelancer) {
      return NextResponse.json(
        { error: "Employee or Freelancer not found" },
        { status: 404 },
      );
    }

    const leaveRequest = await db.leaveRequest.create({
      data: {
        employeeId: employee?.id,
        freeLancerId: freelancer?.id,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days: parseInt(days),
        reason,
        contactInfo,
        emergencyAvailability: Boolean(emergencyAvailability),
        status: "PENDING",
        requestedDate: new Date(),
      },
    });

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error("Error creating leave request:", error);
    return NextResponse.json(
      { error: "Failed to create leave request" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");

    const whereClause: any = {};

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (employeeId) {
      whereClause.employee = {
        OR: [{ id: employeeId }, { employeeNumber: employeeId }],
      };
    }

    const leaveRequests = await db.leaveRequest.findMany({
      where: whereClause,
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
        freeLancer: {
          select: {
            id: true,
            freeLancerNumber: true,
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
    const formattedRequests = leaveRequests.map((request) => {
      const person = request.employee || request.freeLancer;
      const isFreelancer = !!request.freeLancer;

      return {
        id: request.id,
        employeeId:
          (person as any)?.employeeNumber ||
          (person as any)?.freeLancerNumber ||
          "N/A",
        employeeName: person
          ? `${person.firstName} ${person.lastName}`
          : "Unknown",
        employeeAvatar: person?.avatar,
        leaveType: request.leaveType,
        startDate: request.startDate.toISOString().split("T")[0],
        endDate: request.endDate.toISOString().split("T")[0],
        days: request.days,
        reason: request.reason,
        status: request.status,
        requestedDate: request.requestedDate.toISOString(),
        approvedBy: request.approvedBy,
        approvedDate: request.approvedDate?.toISOString().split("T")[0],
        rejectedBy: request.rejectedBy,
        rejectedDate: request.rejectedDate?.toISOString().split("T")[0],
        comments: request.comments,
        department: person?.department?.name || "No Department",
        isFreelancer,
        emergencyAvailability: request.emergencyAvailability,
      };
    });

    return NextResponse.json(formattedRequests);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave requests" },
      { status: 500 },
    );
  }
}
