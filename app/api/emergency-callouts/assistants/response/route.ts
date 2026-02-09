import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { AssistantStatus } from "@prisma/client";

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
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
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

    // Check if this affects the main CallOut status?
    // "Assistant Confirmed" status in CallOut flow.
    // Maybe if *any* assistant confirms, or *all*?
    // For now, let's update CallOut to ASSISTANT_CONFIRMED if it's currently ACCEPTED and an assistant accepts.

    // Fetch callout to check current status
    const callOut = await db.emergencyCallOut.findUnique({
      where: { id: callOutId },
      include: { assistants: true },
    });

    if (callOut && callOut.status === "ACCEPTED" && newStatus === "ACCEPTED") {
      // If at least one assistant has accepted, maybe mark as confirmed?
      // Or if all have responded?
      // The requirement says "Status changes to: Assistant Confirmed".
      // Let's assume if *all* pending assistants have responded, or if *any* accepted, we move forward.
      // Let's go with "If any accepted, mark as confirmed".

      await db.emergencyCallOut.update({
        where: { id: callOutId },
        data: { status: "ASSISTANT_CONFIRMED" },
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
