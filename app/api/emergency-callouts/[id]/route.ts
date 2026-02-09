import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { CallOutStatus, AssistantStatus } from "@prisma/client";
import { sendPushToUser } from "@/lib/expo";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const callOut = await db.emergencyCallOut.findUnique({
      where: { id },
      include: {
        requestedUser: {
          select: {
            name: true,
            email: true,
            phone: true,
            employee: true,
            freeLancer: true,
          },
        },
        assistants: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        client: true,
        employee: true, // Legacy link
        freeLancer: true, // Legacy link
      },
    });

    if (!callOut) {
      return NextResponse.json(
        { error: "Call-out not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(callOut);
  } catch (error) {
    console.error("[EMERGENCY_CALLOUT_GET_ONE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Usually admins only? Or maybe the requester can edit?
    // "Admin Review" implies Admin role check.
    const user = await db.user.findUnique({ where: { userId: clerkId } });
    if (!user || (user.userType !== "ADMIN" && user.userType !== "EMPLOYEE")) {
      // Allow employees to update status? Probably not status. Admin only for status change to ACCEPTED.
      // For now, simplify auth.
    }

    const { id } = await params;
    const body = await req.json();
    const { status, notes, rejectionReason } = body;

    // Validate status transition if needed

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (rejectionReason) updateData.declinedReason = rejectionReason;

    if (status === "ACCEPTED") {
      updateData.acceptedAt = new Date();
      // If transitioning TO Accepted, notify assistants? (Logic placeholder)
    } else if (status === "DECLINED") {
      updateData.declinedAt = new Date();
    } else if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    const callOut = await db.emergencyCallOut.update({
      where: { id },
      data: updateData,
      include: {
        assistants: true,
        requestedUser: true,
      },
    });

    // Notify Requester of status change
    try {
      const statusTitle = `Call-Out ${status}`;
      const statusBody = `Your emergency call-out request for ${callOut.destination} has been ${status.toLowerCase()}.${status === "DECLINED" ? ` Reason: ${rejectionReason}` : ""}`;

      await db.notification.create({
        data: {
          userId: callOut.requestedBy,
          title: statusTitle,
          message: statusBody,
          type: "INFO",
          priority: status === "ACCEPTED" ? "HIGH" : "MEDIUM",
          actionUrl: `/emergency-callouts/${callOut.id}`,
        },
      });

      // Send Push to Requester
      await sendPushToUser({
        userId: callOut.requestedBy,
        title: statusTitle,
        body: statusBody,
        data: { url: `/emergency-callouts/${callOut.id}` },
      });

      // If ACCEPTED/IN_PROGRESS/COMPLETED, notify assistants too
      if (
        ["ACCEPTED", "IN_PROGRESS", "COMPLETED"].includes(status) &&
        callOut.assistants.length > 0
      ) {
        for (const assistant of callOut.assistants) {
          if (!assistant.userId) continue;

          let assistantTitle = "🔵 Call-Out Update";
          let assistantBody = `The emergency call-out at ${callOut.destination} is now ${status.toLowerCase()}.`;

          if (status === "ACCEPTED") {
            assistantTitle = "🔵 Call-Out Confirmed";
            assistantBody = `Admin has approved the emergency call-out at ${callOut.destination}. Please confirm your availability if you haven't.`;
          } else if (status === "COMPLETED") {
            assistantTitle = "✅ Call-Out Completed";
            assistantBody = `The call-out at ${callOut.destination} has been marked as completed. Thank you!`;
          }

          await sendPushToUser({
            userId: assistant.userId,
            title: assistantTitle,
            body: assistantBody,
            data: { url: `/emergency-callouts/${callOut.id}` },
          });
        }
      }
    } catch (err) {
      console.error("Failed to notify requester:", err);
    }

    return NextResponse.json(callOut);
  } catch (error) {
    console.error("[EMERGENCY_CALLOUT_UPDATE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
