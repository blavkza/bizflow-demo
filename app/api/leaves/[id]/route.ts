import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
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
    const { status, comments, documentUrl } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (comments) updateData.comments = comments;
    if (documentUrl) updateData.documentUrl = documentUrl;

    // Fetch existing request to check for originalLeaveType restoration
    const existingRequest = await db.leaveRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return new NextResponse("Leave request not found", { status: 404 });
    }

    let leaveTypeRestored = false;
    let newLeaveType = existingRequest.leaveType;

    if (documentUrl && existingRequest.originalLeaveType) {
      updateData.leaveType = existingRequest.originalLeaveType;
      updateData.originalLeaveType = null;
      updateData.submitToAdmin = false;
      leaveTypeRestored = true;
      newLeaveType = existingRequest.originalLeaveType;
    }

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

    // If leave type was restored and it was already approved, update attendance records
    if (leaveTypeRestored && leaveRequest.status === "APPROVED") {
      const leaveStatusMap: Record<string, string> = {
        ANNUAL: "ANNUAL_LEAVE",
        SICK: "SICK_LEAVE",
        MATERNITY: "MATERNITY_LEAVE",
        PATERNITY: "PATERNITY_LEAVE",
        STUDY: "STUDY_LEAVE",
        UNPAID: "UNPAID_LEAVE",
        COMPASSIONATE: "UNPAID_LEAVE",
      };

      const upperType = (newLeaveType || "").toUpperCase();
      const attendanceStatus = (leaveStatusMap[upperType] as any) || "ABSENT";

      await db.attendanceRecord.updateMany({
        where: {
          OR: [
            { employeeId: leaveRequest.employeeId || undefined },
            { freeLancerId: leaveRequest.freeLancerId || undefined },
            { traineeId: (leaveRequest as any).traineeId || undefined },
          ].filter((c) => Object.values(c)[0] !== undefined),
          date: {
            gte: new Date(leaveRequest.startDate),
            lte: new Date(leaveRequest.endDate),
          },
          notes: {
            contains: "Approved Leave:",
          },
        },
        data: {
          status: attendanceStatus,
          notes: `Approved Leave: ${newLeaveType} (Document Uploaded)`,
        },
      });
    }

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
          actionUrl: "/dashboard/human-resources/leaves",
        },
      });

      console.log(
        `Notification sent to employee ${leaveRequest.employeeId} regarding leave status: ${status}`,
      );

      // Create attendance records if approved
      if (status === "APPROVED") {
        const leaveStatusMap: Record<string, string> = {
          ANNUAL: "ANNUAL_LEAVE",
          SICK: "SICK_LEAVE",
          MATERNITY: "MATERNITY_LEAVE",
          PATERNITY: "PATERNITY_LEAVE",
          STUDY: "STUDY_LEAVE",
          UNPAID: "UNPAID_LEAVE",
          COMPASSIONATE: "UNPAID_LEAVE",
        };

        const upperType = (leaveRequest.leaveType || "").toUpperCase();
        const attendanceStatus = (leaveStatusMap[upperType] as any) || "ABSENT";
        const start = new Date(leaveRequest.startDate);
        const end = new Date(leaveRequest.endDate);

        const current = new Date(start);
        while (current <= end) {
          const dateToProcess = new Date(current);
          dateToProcess.setHours(0, 0, 0, 0);

          const personCriteria: any = {};
          if (leaveRequest.employeeId)
            personCriteria.employeeId = leaveRequest.employeeId;
          if (leaveRequest.freeLancerId)
            personCriteria.freeLancerId = leaveRequest.freeLancerId;
          const traineeId = (leaveRequest as any).traineeId;
          if (traineeId) personCriteria.traineeId = traineeId;

          if (Object.keys(personCriteria).length > 0) {
            const existing = await db.attendanceRecord.findFirst({
              where: {
                ...personCriteria,
                date: dateToProcess,
              },
            });

            if (!existing) {
              await db.attendanceRecord.create({
                data: {
                  ...personCriteria,
                  date: dateToProcess,
                  status: attendanceStatus,
                  notes: `Approved Leave: ${leaveRequest.leaveType}`,
                },
              });
            } else if (existing.status === "ABSENT" && !existing.checkIn) {
              await db.attendanceRecord.update({
                where: { id: existing.id },
                data: {
                  status: attendanceStatus,
                  notes: `Approved Leave: ${leaveRequest.leaveType}`,
                },
              });
            }
          }

          current.setDate(current.getDate() + 1);
        }
      }
    }

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error("Error updating leave request:", error);
    return NextResponse.json(
      { error: "Failed to update leave request" },
      { status: 500 },
    );
  }
}
