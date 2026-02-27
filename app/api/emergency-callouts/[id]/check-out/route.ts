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
    const {
      lat,
      lng,
      address,
      diagnosis,
      proposal,
      solution,
      progress,
      pendingTasks,
    } = body;

    // Include requestedUser and leaders with all worker-type sub-relations for unified rate lookup.
    const callOut = await db.emergencyCallOut.findUnique({
      where: { id },
      include: {
        assistants: {
          include: {
            user: {
              include: {
                employee: {
                  select: {
                    emergencyCallOutRate: true,
                    overtimeHourRate: true,
                  },
                },
                freeLancer: {
                  select: {
                    emergencyCallOutRate: true,
                    overtimeHourRate: true,
                  },
                },
                trainee: {
                  select: {
                    emergencyCallOutRate: true,
                    overtimeHourRate: true,
                  },
                },
              },
            },
          },
        },
        leaders: {
          where: { status: "SELECTED" },
          include: {
            user: {
              include: {
                employee: {
                  select: {
                    emergencyCallOutRate: true,
                    overtimeHourRate: true,
                  },
                },
                freeLancer: {
                  select: {
                    emergencyCallOutRate: true,
                    overtimeHourRate: true,
                  },
                },
                trainee: {
                  select: {
                    emergencyCallOutRate: true,
                    overtimeHourRate: true,
                  },
                },
              },
            },
          },
        },
        requestedUser: {
          include: {
            employee: {
              select: { emergencyCallOutRate: true, overtimeHourRate: true },
            },
            freeLancer: {
              select: { emergencyCallOutRate: true, overtimeHourRate: true },
            },
            trainee: {
              select: { emergencyCallOutRate: true, overtimeHourRate: true },
            },
          },
        },
      },
    });

    if (!callOut) {
      return NextResponse.json(
        { error: "Call-out not found" },
        { status: 404 },
      );
    }

    if (callOut.requestedBy !== user.id && user.userType !== "ADMIN") {
      const isAssistant = callOut.assistants.some(
        (a) => a.userId === user.id && a.status === "ACCEPTED",
      );
      if (!isAssistant) {
        return NextResponse.json(
          { error: "You are not authorized to check out for this call-out" },
          { status: 403 },
        );
      }
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(callOut.checkIn!);
    const durationHours =
      (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    // Unified rate helper — returns effective hourly rate (base OT rate * multiplier)
    const getEffectiveLeaderRate = (u: any) => {
      const worker = u?.employee || u?.freeLancer || u?.trainee;
      if (!worker) return 0;
      const baseRate = worker.overtimeHourRate || 50;
      const multiplier = worker.emergencyCallOutRate || 1;
      return baseRate * multiplier;
    };

    // Use selected leader if available, otherwise fallback to requestedUser
    const leaderUser = callOut.leaders[0]?.user || callOut.requestedUser;
    const leaderEffectiveRate = getEffectiveLeaderRate(leaderUser);
    const leaderEarnings = durationHours * leaderEffectiveRate;

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
        hourlyRateUsed: leaderEffectiveRate,
        earnings: leaderEarnings,
        reportDiagnosis: diagnosis,
        reportProposal: proposal,
        reportSolution: solution,
        reportProgress: progress,
        reportPendingTasks: pendingTasks,
      },
    });

    // Update assistants' earnings
    if (callOut.assistants && callOut.assistants.length > 0) {
      for (const assistant of callOut.assistants) {
        if (
          (assistant.status === "ACCEPTED" ||
            assistant.status === "SELECTED") &&
          assistant.user
        ) {
          const assistantEffectiveRate = getEffectiveLeaderRate(assistant.user);
          const assistantEarnings = durationHours * assistantEffectiveRate;

          await db.callOutAssistant.update({
            where: { id: assistant.id },
            data: {
              earnings: assistantEarnings,
              hourlyRateUsed: assistantEffectiveRate,
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

          await db.notification.create({
            data: {
              userId: assistant.userId,
              title: "✅ Call-Out Completed",
              message: `The mission at ${callOut.destination} has been completed.`,
              type: "EMERGENCY",
              priority: "MEDIUM",
              actionUrl: `/emergency-callouts/${callOut.id}`,
              metadata: { callOutId: id },
            },
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
