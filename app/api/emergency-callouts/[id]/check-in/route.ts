import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
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

    const user = await db.user.findUnique({ where: { userId: clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;
    const body = await req.json();
    const { lat, lng, address } = body;

    const callOut = (await db.emergencyCallOut.findUnique({
      where: { id },
      include: {
        assistants: true,
        requestedUser: true,
      } as any,
    })) as any;

    if (!callOut) {
      return NextResponse.json(
        { error: "Call-out not found" },
        { status: 404 },
      );
    }

    // Only the requester or an accepted assistant or admin can check in?
    // Usually it's the requester/leader.
    if (callOut.requestedBy !== user.id && user.userType !== "ADMIN") {
      // Check if user is an accepted assistant
      const isAssistant = callOut.assistants.some(
        (a: any) => a.userId === user.id && a.status === "ACCEPTED",
      );
      if (!isAssistant) {
        return NextResponse.json(
          { error: "You are not authorized to check in for this call-out" },
          { status: 403 },
        );
      }
    }

    const updatedCallOut = await db.emergencyCallOut.update({
      where: { id },
      data: {
        checkIn: new Date(),
        checkInLat: lat,
        checkInLng: lng,
        checkInAddress: address,
        status: "IN_PROGRESS",
      },
    });

    // Notify Assistants that the mission has started
    try {
      for (const assistant of callOut.assistants) {
        if (assistant.userId && assistant.status === "ACCEPTED") {
          await sendPushToUser({
            userId: assistant.userId,
            title: "🚀 Call-Out Started",
            body: `The mission at ${callOut.destination} has officially started.`,
            data: { url: `/emergency-callouts/${callOut.id}` },
          });
        }
      }
    } catch (err) {
      console.error("Failed to notify assistants on check-in:", err);
    }

    return NextResponse.json(updatedCallOut);
  } catch (error) {
    console.error("[CALLOUT_CHECKIN]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
