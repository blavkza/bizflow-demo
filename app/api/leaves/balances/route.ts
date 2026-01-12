import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    // Define default allocations (adjust based on your business rules)
    const defaultBalances = {
      annual: { total: 21, used: 0, remaining: 21 },
      sick: { total: 30, used: 0, remaining: 30 },
      maternity: { total: 120, used: 0, remaining: 120 },
      paternity: { total: 10, used: 0, remaining: 10 },
      study: { total: 5, used: 0, remaining: 5 },
      unpaid: { total: 0, used: 0, remaining: 0 },
      dayOff: { total: 0, used: 0, remaining: 0 },
      compassionate: { total: 5, used: 0, remaining: 5 },
    };

    if (!employeeId) {
      return NextResponse.json(defaultBalances);
    }

    // Get ALL leave requests (both APPROVED and PENDING)
    const leaveRequests = await db.leaveRequest.findMany({
      where: {
        employee: { employeeNumber: employeeId },
        status: {
          in: ["APPROVED", "PENDING"], // Include both statuses
        },
      },
      select: {
        leaveType: true,
        days: true,
        status: true,
      },
    });

    // Calculate balances including pending requests
    const balances = { ...defaultBalances };

    leaveRequests.forEach((request) => {
      const type = request.leaveType.toLowerCase() as keyof typeof balances;

      if (balances[type]) {
        // For both APPROVED and PENDING, deduct from remaining balance
        // This shows the user what their balance WILL BE if pending requests are approved
        balances[type].used += request.days;
        balances[type].remaining = Math.max(
          0,
          balances[type].total - balances[type].used
        );
      }
    });

    return NextResponse.json(balances);
  } catch (error) {
    console.error("Error fetching leave balances:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave balances" },
      { status: 500 }
    );
  }
}
