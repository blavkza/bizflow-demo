import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/expo";

// POST: A potential leader accepts or declines as the mission leader
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: callOutId } = await params;
    const { action, reason } = await req.json();

    if (!action || !["ACCEPT", "DECLINE"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be ACCEPT or DECLINE." },
        { status: 400 },
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "A reason is required to respond." },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({ where: { userId: clerkId } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Find the user's leader record for this callout
    const leaderRecord = await db.callOutLeader.findFirst({
      where: {
        emergencyCallOutId: callOutId,
        userId: user.id,
        status: "PENDING",
      },
    });

    if (!leaderRecord) {
      return NextResponse.json(
        { error: "You are not a pending leader for this call-out" },
        { status: 403 },
      );
    }

    const now = new Date();

    // Update leader status
    const updated = await db.callOutLeader.update({
      where: { id: leaderRecord.id },
      data: {
        status: action === "ACCEPT" ? "ACCEPTED" : "DECLINED",
        acceptedAt: action === "ACCEPT" ? now : undefined,
        declinedAt: action === "DECLINE" ? now : undefined,
        declinedReason: action === "DECLINE" ? reason : null,
        responseReason: reason,
      },
    });

    // Fetch the callout to notify the requesting admin
    const callOut = await db.emergencyCallOut.findUnique({
      where: { id: callOutId },
    });

    if (callOut) {
      const actionText = action === "ACCEPT" ? "accepted" : "declined";
      const notifyMsg = `${user.name} has ${actionText} the emergency call-out at ${callOut.destination}.`;

      // Notify the admin who created the callout
      await db.notification.create({
        data: {
          userId: callOut.requestedBy,
          title: `Leader ${action === "ACCEPT" ? "✅ Accepted" : "❌ Declined"}`,
          message: notifyMsg,
          type: "EMERGENCY",
          priority: action === "ACCEPT" ? "HIGH" : "MEDIUM",
          actionUrl: `/dashboard/emergency-callouts/${callOutId}`,
          metadata: { callOutId, leaderId: leaderRecord.id },
        },
      });

      await sendPushToUser({
        userId: callOut.requestedBy,
        title: `Leader ${action === "ACCEPT" ? "Accepted ✅" : "Declined ❌"}`,
        body: notifyMsg,
        data: { url: `/dashboard/emergency-callouts/${callOutId}` },
      });
    }

    return NextResponse.json({
      success: true,
      status: updated.status,
      message:
        action === "ACCEPT"
          ? "You have accepted this call-out. Waiting for admin to select you as the leader."
          : "You have declined this call-out.",
    });
  } catch (error) {
    console.error("[LEADER_RESPONSE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
