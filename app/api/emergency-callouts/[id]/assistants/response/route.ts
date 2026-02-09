import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { AssistantStatus } from "@prisma/client";
import { sendPushToUser } from "@/lib/expo";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: callOutId } = await params;
    const { action } = await req.json(); // "ACEPT" or "DECLINE"

    if (!action || !["ACCEPT", "DECLINE"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be ACCEPT or DECLINE." },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: { userId: clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the assistant record
    const assistantRecord = await db.callOutAssistant.findFirst({
      where: {
        emergencyCallOutId: callOutId,
        userId: user.id,
      },
    });

    if (!assistantRecord) {
      return NextResponse.json(
        { error: "You are not an assistant for this call-out" },
        { status: 403 },
      );
    }

    const newStatus =
      action === "ACCEPT" ? AssistantStatus.ACCEPTED : AssistantStatus.DECLINED;

    // Update status
    const updatedAssistant = await db.callOutAssistant.update({
      where: { id: assistantRecord.id },
      data: {
        status: newStatus,
      },
    });

    // Determine if we should update the main CallOut status
    // If ANY assistant accepts, update to ASSISTANT_CONFIRMED?
    // Or if ALL pending assistants have responded?
    // Let's check logic:
    // If newStatus is ACCEPTED, we can change status to ASSISTANT_CONFIRMED (if not already).

    const callOut = await db.emergencyCallOut.findUnique({
      where: { id: callOutId },
    });

    if (callOut && callOut.status === "ACCEPTED" && newStatus === "ACCEPTED") {
      await db.emergencyCallOut.update({
        where: { id: callOutId },
        data: { status: "ASSISTANT_CONFIRMED" },
      });
    } else if (
      callOut &&
      callOut.status === "ASSISTANT_CONFIRMED" &&
      newStatus === "DECLINED"
    ) {
      // Check if ANY other assistant is ACCEPTED. If none, maybe revert to ACCEPTED?
      const otherAssistants = await db.callOutAssistant.count({
        where: {
          emergencyCallOutId: callOutId,
          status: "ACCEPTED",
          id: { not: assistantRecord.id },
        },
      });

      if (otherAssistants === 0) {
        await db.emergencyCallOut.update({
          where: { id: callOutId },
          data: { status: "ACCEPTED" }, // Revert if last assistant declined
        });
      }
    }

    // Notify Requester (the person who made the call-out)
    const fullCallOut = await db.emergencyCallOut.findUnique({
      where: { id: callOutId },
    });

    if (fullCallOut) {
      const msg = `${user.name} has ${newStatus.toLowerCase()} your call-out invitation for ${fullCallOut.destination}.`;

      await db.notification.create({
        data: {
          userId: fullCallOut.requestedBy,
          title: `Assistant ${newStatus}`,
          message: msg,
          type: "ALERT",
          priority: "MEDIUM",
          actionUrl: `/emergency-callouts/${callOutId}`,
        },
      });

      await sendPushToUser({
        userId: fullCallOut.requestedBy,
        title: `Assistant ${newStatus}`,
        body: msg,
        data: { url: `/emergency-callouts/${callOutId}` },
      });
    }

    return NextResponse.json(updatedAssistant);
  } catch (error) {
    console.error("[ASSISTANT_RESPONSE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
