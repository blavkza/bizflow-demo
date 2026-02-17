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
        assistants: {
          include: {
            user: {
              include: {
                employee: { select: { emergencyCallOutRate: true } },
                freeLancer: { select: { emergencyCallOutRate: true } },
              },
            },
          },
        },
        requestedUser: {
          include: {
            employee: { select: { emergencyCallOutRate: true } },
            freeLancer: { select: { emergencyCallOutRate: true } },
          },
        },
      } as any,
    })) as any;

    if (!callOut) {
      return NextResponse.json(
        { error: "Call-out not found" },
        { status: 404 },
      );
    }

    if (callOut.requestedBy !== user.id && user.userType !== "ADMIN") {
      const isAssistant = callOut.assistants.some(
        (a: any) => a.userId === user.id && a.status === "ACCEPTED",
      );
      if (!isAssistant) {
        return NextResponse.json(
          { error: "You are not authorized to check out for this call-out" },
          { status: 403 },
        );
      }
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(callOut.checkIn);
    const durationHours =
      (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    // Fetch call-out details (rates are already included in the findUnique if we update it)
    // Actually, let's update the findUnique to include the new emergencyCallOutRate field

    // Helper to get effective rate for a user
    const getEffectiveRate = (u: any) => {
      return (
        u?.employee?.emergencyCallOutRate ||
        u?.freeLancer?.emergencyCallOutRate ||
        0
      );
    };

    const requesterRate = getEffectiveRate(callOut.requestedUser);
    const requesterEarnings = durationHours * requesterRate;

    const updatedCallOut = await db.emergencyCallOut.update({
      where: { id },
      data: {
        checkOut: checkOutTime,
        checkOutLat: lat,
        checkOutLng: lng,
        checkOutAddress: address,
        status: "COMPLETED",
        completedAt: checkOutTime,
        duration: durationHours,
        hourlyRateUsed: requesterRate,
        earnings: requesterEarnings,
      },
    });

    // Update assistants' earnings
    if (callOut.assistants && callOut.assistants.length > 0) {
      for (const assistant of callOut.assistants) {
        if (assistant.status === "ACCEPTED" && assistant.user) {
          const assistantRate = getEffectiveRate(assistant.user);
          const assistantEarnings = durationHours * assistantRate;

          await db.callOutAssistant.update({
            where: { id: assistant.id },
            data: {
              earnings: assistantEarnings,
              hourlyRateUsed: assistantRate,
            },
          });
        }
      }
    }

    // Notify Assistants that the mission is complete
    try {
      for (const assistant of callOut.assistants) {
        if (assistant.userId && assistant.status === "ACCEPTED") {
          await sendPushToUser({
            userId: assistant.userId,
            title: "✅ Call-Out Completed",
            body: `The mission at ${callOut.destination} has been completed.`,
            data: { url: `/emergency-callouts/${callOut.id}` },
          });
        }
      }
    } catch (err) {
      console.error("Failed to notify assistants on check-out:", err);
    }

    return NextResponse.json(updatedCallOut);
  } catch (error) {
    console.error("[CALLOUT_CHECKOUT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
