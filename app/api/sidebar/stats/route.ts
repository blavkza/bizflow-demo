import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ToolRequestStatus } from "@prisma/client";

export async function GET() {
  try {
    const [
      pendingToolRequests,
      pendingToolReturns,
      pendingToolMaintenance,
      pendingEmergencyCallOuts,
      pendingLeaveRequests,
      pendingOvertimeRequests,
    ] = await Promise.all([
      db.toolRequest.count({
        where: {
          status: "PENDING",
        },
      }),
      db.toolReturn.count({
        where: {
          isApproved: false,
        },
      }),
      db.toolMaintenance.count({
        where: {
          status: "PENDING",
        },
      }),
      db.emergencyCallOut.count({
        where: {
          status: "PENDING",
        },
      }),
      db.leaveRequest.count({
        where: {
          status: "PENDING",
        },
      }),
      db.overtimeRequest.count({
        where: {
          status: "PENDING",
        },
      }),
    ]);

    return NextResponse.json({
      toolRequests: pendingToolRequests,
      toolReturns: pendingToolReturns,
      toolMaintenance: pendingToolMaintenance,
      emergencyCallOuts: pendingEmergencyCallOuts,
      leaveRequests: pendingLeaveRequests,
      overtimeRequests: pendingOvertimeRequests,
    });
  } catch (error) {
    console.error("Error fetching sidebar stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch sidebar stats" },
      { status: 500 },
    );
  }
}
