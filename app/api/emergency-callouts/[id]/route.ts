import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/expo";
import { CallOutStatus, AssistantStatus } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const callOut = await db.emergencyCallOut.findUnique({
      where: { id },
      include: {
        requestedUser: {
          select: {
            name: true,
            email: true,
            role: true,
            phone: true,
            employee: true,
            freeLancer: true,
            trainee: true,
          },
        },
        // Leaders sorted so SELECTED/ACCEPTED appear first, then by earliest acceptedAt
        leaders: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            employee: {
              select: { position: true, emergencyCallOutRate: true },
            },
            freelancer: {
              select: { position: true, emergencyCallOutRate: true },
            },
            trainee: { select: { position: true, emergencyCallOutRate: true } },
          },
          orderBy: [
            { acceptedAt: "asc" }, // first to accept shows first (nulls last)
          ],
        },
        assistants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            employee: { select: { emergencyCallOutRate: true } },
            freelancer: { select: { emergencyCallOutRate: true } },
            trainee: { select: { emergencyCallOutRate: true } },
          },
        },
        client: true,
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

// PUT: Admin actions on a callout
// - selectLeader: Admin picks which accepted leader takes the job
// - Status updates (DECLINED, CANCELLED, COMPLETED)
// - Notes
export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const {
      status,
      notes,
      rejectionReason,
      selectedLeaderId,
      selectedAssistantId,
      rejectedAssistantId,
    } = body;

    const updateData: any = {};

    // ── Admin selects/approves a specific assistant ────────────────────────
    if (selectedAssistantId) {
      const assistantRecord = await db.callOutAssistant.findFirst({
        where: {
          id: selectedAssistantId,
          emergencyCallOutId: id,
          status: "ACCEPTED",
        },
        include: { user: true },
      });

      if (!assistantRecord) {
        return NextResponse.json(
          { error: "Assistant not found or hasn't accepted yet" },
          { status: 400 },
        );
      }

      // Mark this assistant as SELECTED (Approved)
      await db.callOutAssistant.update({
        where: { id: selectedAssistantId },
        data: { status: "SELECTED" },
      });

      // Update mission status to ASSISTANT_CONFIRMED if it's currently at ACCEPTED
      const currentCallOut = await db.emergencyCallOut.findUnique({
        where: { id },
        select: { status: true },
      });

      if (currentCallOut?.status === "ACCEPTED") {
        updateData.status = "ASSISTANT_CONFIRMED";
      }

      // Notify the selected assistant
      if (assistantRecord.userId) {
        await sendPushToUser({
          userId: assistantRecord.userId,
          title: "✅ Mission Team Confirmed",
          body: `Admin has approved your participation in the emergency call-out for ${assistantRecord.user?.name}.`,
          data: { url: `/emergency-callouts/${id}` },
        });

        await db.notification.create({
          data: {
            userId: assistantRecord.userId,
            title: "✅ Mission Team Confirmed",
            message: `Admin has approved your participation in the emergency call-out for ${assistantRecord.user?.name}.`,
            type: "EMERGENCY",
            priority: "MEDIUM",
            actionUrl: `/emergency-callouts/${id}`,
            metadata: { callOutId: id },
          },
        });
      }
    }

    // ── Admin rejects a specific assistant ────────────────────────────────
    if (rejectedAssistantId) {
      const assistantRecord = await db.callOutAssistant.findFirst({
        where: {
          id: rejectedAssistantId,
          emergencyCallOutId: id,
          status: "ACCEPTED",
        },
      });

      if (!assistantRecord) {
        return NextResponse.json(
          { error: "Assistant not found or hasn't accepted yet" },
          { status: 400 },
        );
      }

      await db.callOutAssistant.update({
        where: { id: rejectedAssistantId },
        data: { status: "DECLINED" },
      });

      // Notify the rejected assistant
      if (assistantRecord.userId) {
        await sendPushToUser({
          userId: assistantRecord.userId,
          title: "❌ Mission Team Update",
          body: `Admin has declined your participation in this emergency call-out.`,
          data: { url: `/emergency-callouts/${id}` },
        });

        await db.notification.create({
          data: {
            userId: assistantRecord.userId,
            title: "❌ Mission Team Update",
            message: `Admin has declined your participation in this emergency call-out.`,
            type: "EMERGENCY",
            priority: "LOW",
            actionUrl: `/emergency-callouts/${id}`,
            metadata: { callOutId: id },
          },
        });
      }
    }

    // ── Admin selects which leader takes the mission ───────────────────────
    if (selectedLeaderId) {
      // Validate the leader exists and has accepted
      const leaderRecord = await db.callOutLeader.findFirst({
        where: {
          id: selectedLeaderId,
          emergencyCallOutId: id,
          status: "ACCEPTED",
        },
        include: { user: true },
      });

      if (!leaderRecord) {
        return NextResponse.json(
          { error: "Leader not found or hasn't accepted yet" },
          { status: 400 },
        );
      }

      // Mark this leader as SELECTED
      await db.callOutLeader.update({
        where: { id: selectedLeaderId },
        data: { status: "SELECTED" },
      });

      // Mark all others (PENDING or ACCEPTED but not selected) as NOT_ACCEPTED
      await db.callOutLeader.updateMany({
        where: {
          emergencyCallOutId: id,
          id: { not: selectedLeaderId },
          status: { in: ["PENDING", "ACCEPTED"] },
        },
        data: {
          status: "NOT_ACCEPTED",
        },
      });

      // Move callout to ACCEPTED status
      updateData.status = "ACCEPTED";
      updateData.acceptedAt = new Date();
      updateData.selectedLeaderId = selectedLeaderId;

      // Notify the selected leader
      if (leaderRecord.userId) {
        await sendPushToUser({
          userId: leaderRecord.userId,
          title: "✅ You've Been Selected!",
          body: `You have been selected as the leader for the emergency call-out. ${updateData.allowAssistants ? "You can now add assistants." : ""}`,
          data: { url: `/emergency-callouts/${id}` },
        });

        await db.notification.create({
          data: {
            userId: leaderRecord.userId,
            title: "✅ You've Been Selected!",
            message: `You have been selected as the leader for the emergency call-out.`,
            type: "EMERGENCY",
            priority: "HIGH",
            actionUrl: `/emergency-callouts/${id}`,
            metadata: { callOutId: id },
          },
        });
      }

      // Notify other accepted leaders they weren't selected (optional courtesy)
      const otherLeaders = await db.callOutLeader.findMany({
        where: {
          emergencyCallOutId: id,
          id: { not: selectedLeaderId },
          status: "ACCEPTED",
        },
      });
      for (const other of otherLeaders) {
        if (other.userId) {
          await sendPushToUser({
            userId: other.userId,
            title: "Call-Out Update",
            body: "Another leader has been selected for this emergency call-out. Thank you for your availability.",
            data: { url: `/emergency-callouts/${id}` },
          });

          await db.notification.create({
            data: {
              userId: other.userId,
              title: "Call-Out Update",
              message:
                "Another leader has been selected for this emergency call-out.",
              type: "EMERGENCY",
              priority: "LOW",
              actionUrl: `/emergency-callouts/${id}`,
              metadata: { callOutId: id },
            },
          });
        }
      }
    }

    // ── Standard status/notes updates ─────────────────────────────────────
    if (status && !selectedLeaderId) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (rejectionReason) updateData.declinedReason = rejectionReason;

    if (status === "DECLINED") {
      updateData.declinedAt = new Date();
    } else if (status === "ASSISTANT_CONFIRMED") {
      // Mark all assistants who haven't responded or haven't been selected as NOT_ACCEPTED
      // if they are still in PENDING or ACCEPTED (but not SELECTED)
      await db.callOutAssistant.updateMany({
        where: {
          emergencyCallOutId: id,
          status: { in: ["PENDING", "ACCEPTED"] },
        },
        data: {
          status: "NOT_ACCEPTED",
        },
      });
    } else if (status === "COMPLETED") {
      updateData.completedAt = new Date();

      // Calculate earnings via requestedUser → employee/freeLancer/trainee
      const current = await db.emergencyCallOut.findUnique({
        where: { id },
        include: {
          leaders: {
            where: { status: "SELECTED" },
            include: {
              employee: { select: { emergencyCallOutRate: true } },
              freelancer: { select: { emergencyCallOutRate: true } },
              trainee: { select: { emergencyCallOutRate: true } },
            },
          },
          assistants: {
            include: {
              employee: { select: { emergencyCallOutRate: true } },
              freelancer: { select: { emergencyCallOutRate: true } },
              trainee: { select: { emergencyCallOutRate: true } },
            },
          },
        },
      });

      if (current?.checkIn) {
        const checkOutTime = new Date();
        const durationHours =
          (checkOutTime.getTime() - current.checkIn.getTime()) /
          (1000 * 60 * 60);

        const selectedLeader = current.leaders[0];
        const leaderRate =
          selectedLeader?.employee?.emergencyCallOutRate ||
          selectedLeader?.freelancer?.emergencyCallOutRate ||
          selectedLeader?.trainee?.emergencyCallOutRate ||
          0;

        updateData.checkOut = checkOutTime;
        updateData.duration = durationHours;
        updateData.earnings = durationHours * leaderRate;
        updateData.hourlyRateUsed = leaderRate;

        if (current.assistants.length > 0) {
          await Promise.all(
            current.assistants.map((a) => {
              const rate =
                a.employee?.emergencyCallOutRate ||
                a.freelancer?.emergencyCallOutRate ||
                a.trainee?.emergencyCallOutRate ||
                0;
              return db.callOutAssistant.update({
                where: { id: a.id },
                data: {
                  earnings: durationHours * rate,
                  hourlyRateUsed: rate,
                  status: "ACCEPTED",
                },
              });
            }),
          );
        }
      }
    }

    const callOut = await db.emergencyCallOut.update({
      where: { id },
      data: updateData,
      include: {
        leaders: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: [{ acceptedAt: "asc" }],
        },
        assistants: {
          include: { user: { select: { name: true, avatar: true } } },
        },
        requestedUser: {
          select: { name: true, email: true, phone: true },
        },
        client: true,
      },
    });

    // Notify selected leader of any status change
    const selectedLeader = callOut.leaders.find((l) => l.status === "SELECTED");
    if (selectedLeader?.userId && status) {
      await sendPushToUser({
        userId: selectedLeader.userId,
        title: `Call-Out ${status}`,
        body: `Emergency call-out for ${callOut.destination} has been ${status.toLowerCase()}.`,
        data: { url: `/emergency-callouts/${id}` },
      });

      await db.notification.create({
        data: {
          userId: selectedLeader.userId,
          title: `Call-Out ${status}`,
          message: `Emergency call-out for ${callOut.destination} has been ${status.toLowerCase()}.`,
          type: "EMERGENCY",
          priority: status === "CANCELLED" ? "HIGH" : "MEDIUM",
          actionUrl: `/emergency-callouts/${id}`,
          metadata: { callOutId: id },
        },
      });

      // Also notify all accepted assistants of status updates
      const confirmedAssistants = callOut.assistants.filter(
        (a) => a.status === "SELECTED" || a.status === "ACCEPTED",
      );
      for (const assistant of confirmedAssistants) {
        if (assistant.userId) {
          await sendPushToUser({
            userId: assistant.userId,
            title: `Call-Out ${status}`,
            body: `Emergency call-out for ${callOut.destination} has been ${status.toLowerCase()}.`,
            data: { url: `/emergency-callouts/${id}` },
          });

          await db.notification.create({
            data: {
              userId: assistant.userId,
              title: `Call-Out ${status}`,
              message: `Emergency call-out for ${callOut.destination} has been ${status.toLowerCase()}.`,
              type: "EMERGENCY",
              priority: status === "CANCELLED" ? "HIGH" : "MEDIUM",
              actionUrl: `/emergency-callouts/${id}`,
              metadata: { callOutId: id },
            },
          });
        }
      }
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
