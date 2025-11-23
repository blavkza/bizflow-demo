import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const creator = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creator) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, comments } = body;

    const updateData: any = { status };

    if (status === "APPROVED") {
      updateData.approvedBy = creator.name;
      updateData.approvedDate = new Date();
      updateData.comments = comments || null;
      updateData.rejectedBy = null;
      updateData.rejectedDate = null;
    } else if (status === "REJECTED") {
      updateData.rejectedBy = creator.name;
      updateData.rejectedDate = new Date();
      updateData.comments = comments || null;
      updateData.approvedBy = null;
      updateData.approvedDate = null;
    }

    // Update the leave request
    const leaveRequest = await db.leaveRequest.update({
      where: { id },
      data: updateData,
    });

    if (status === "APPROVED" || status === "REJECTED") {
      const title = `Leave Request ${
        status === "APPROVED" ? "Approved" : "Rejected"
      }`;

      let message = `Your leave request has been ${status.toLowerCase()} by ${
        creator.name
      }.`;

      if (comments) {
        message += ` Comment: "${comments}"`;
      }

      await db.employeeNotification.create({
        data: {
          employeeId: leaveRequest.employeeId,
          title: title,
          message: message,
          type: "LEAVE",
          isRead: false,
          actionUrl: "/dashboard/leave",
        },
      });

      console.log(
        `Notification sent to employee ${leaveRequest.employeeId} regarding leave status: ${status}`
      );
    }

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error("Error updating leave request:", error);
    return NextResponse.json(
      { error: "Failed to update leave request" },
      { status: 500 }
    );
  }
}
