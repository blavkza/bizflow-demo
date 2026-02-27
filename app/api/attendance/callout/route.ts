import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sendPushNotification } from "@/lib/expo";

// POST: Admin dispatches an emergency callout to specific workers (by their User IDs).
// After schema unification, we use requestedBy = target worker's User ID so the worker
// can accept/decline the mission. The admin's identity is captured via the notification.
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const admin = await db.user.findUnique({
      where: { userId },
    });

    if (!admin) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    const {
      // Accept either legacy separate arrays OR unified userIds array
      userIds, // [NEW] Preferred: array of User IDs
      employeeIds, // [LEGACY] kept for backward compat — treated as User IDs now
      freelancerIds, // [LEGACY] same
      traineeIds, // [LEGACY] same
      title,
      message,
      startTime,
      type,
      address,
      vehicle,
      description,
      clientId,
      assistantIds,
    } = body;

    // Combine all target worker User IDs into one list
    const allTargetUserIds: string[] = [
      ...(userIds || []),
      ...(employeeIds || []),
      ...(freelancerIds || []),
      ...(traineeIds || []),
    ];

    if (allTargetUserIds.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient User ID is required" },
        { status: 400 },
      );
    }

    // Pre-fetch assistant data if any
    const assistantsData =
      assistantIds && Array.isArray(assistantIds) && assistantIds.length > 0
        ? await db.user.findMany({
            where: { id: { in: assistantIds } },
            select: {
              id: true,
              employeeId: true,
              freeLancerId: true,
              traineeId: true,
            },
          })
        : [];

    const groupId =
      allTargetUserIds.length > 1
        ? Math.random().toString(36).substring(2, 15)
        : undefined;

    // Pre-fetch target workers' User info for leaders records
    const targetUsersData = await db.user.findMany({
      where: { id: { in: allTargetUserIds } },
      select: {
        id: true,
        employeeId: true,
        freeLancerId: true,
        traineeId: true,
      },
    });
    const targetUsersMap = new Map(targetUsersData.map((u) => [u.id, u]));

    const results = [];

    for (const targetUserId of allTargetUserIds) {
      const callOut = await db.emergencyCallOut.create({
        data: {
          // requestedBy = the target worker User ID.
          // This lets the worker see the "Accept Mission" button on the mobile app.
          requestedBy: targetUserId,
          clientId: clientId || null,
          title:
            title || `Emergency Call-Out - ${new Date().toLocaleDateString()}`,
          message: message || null,
          startTime: startTime ? new Date(startTime) : new Date(),
          status: "PENDING",
          type: type || null,
          destination: address || null,
          vehicle: vehicle || null,
          description: description || message || null,
          leaders: {
            create: [
              {
                userId: targetUserId,
                employeeId: targetUsersMap.get(targetUserId)?.employeeId,
                freelancerId: targetUsersMap.get(targetUserId)?.freeLancerId,
                traineeId: targetUsersMap.get(targetUserId)?.traineeId,
                status: "PENDING",
              },
            ],
          },
          workerCount: assistantsData.length + 1,
          groupId: groupId || null,
          isBroadcast: allTargetUserIds.length > 1,

          assistants:
            assistantsData.length > 0
              ? {
                  create: assistantsData.map((a) => ({
                    userId: a.id,
                    employeeId: a.employeeId,
                    freelancerId: a.freeLancerId,
                    traineeId: a.traineeId,
                  })),
                }
              : undefined,
        },
      });

      // Notify target worker via push
      try {
        await sendPushNotification({
          userId: targetUserId,
          title: `🚨 Emergency Call Out: ${title || "New Dispatch"}`,
          body:
            message ||
            "You have an emergency call out request. Please accept or decline in the app.",
          data: { type: "EMERGENCY_CALL_OUT", callOutId: callOut.id },
        } as any);
      } catch (e) {
        console.error("Push failed for user", targetUserId, e);
      }

      results.push(callOut);
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error creating call outs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Fetch callouts. Filter by requestedBy (User ID) instead of removed FK fields.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Support both new (userId) and legacy param names
    const userId = searchParams.get("userId");
    const employeeUserId = searchParams.get("employeeId"); // treat as userId
    const freelancerUserId = searchParams.get("freelancerId"); // treat as userId
    const traineeUserId = searchParams.get("traineeId"); // treat as userId

    const status = searchParams.get("status");
    const active = searchParams.get("active");
    const date = searchParams.get("date");

    const where: any = {};

    // Find the user for any of the legacy param types
    const targetUserId =
      userId || employeeUserId || freelancerUserId || traineeUserId;

    if (targetUserId) {
      // If legacy param (employeeId etc.) was an employee/freelancer/trainee record id,
      // we need to find the linked User. If it's already a User id, this still works.
      const linkedUser = await db.user.findFirst({
        where: {
          OR: [
            { id: targetUserId },
            { employeeId: targetUserId },
            { freeLancerId: targetUserId },
            { traineeId: targetUserId },
          ],
        },
        select: { id: true },
      });

      if (linkedUser) {
        where.requestedBy = linkedUser.id;
      }
    }

    if (status) where.status = status;

    if (active === "true") {
      where.status = "ACCEPTED";
      where.checkOut = null;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.checkIn = { gte: startOfDay, lte: endOfDay };
    }

    const callOuts = await db.emergencyCallOut.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      include: {
        // requestedUser is now the single source of truth for the worker
        requestedUser: {
          select: {
            id: true,
            name: true,
            employee: {
              select: {
                id: true,
                employeeNumber: true,
                firstName: true,
                lastName: true,
                avatar: true,
                position: true,
                department: { select: { name: true } },
              },
            },
            freeLancer: {
              select: {
                id: true,
                freeLancerNumber: true,
                firstName: true,
                lastName: true,
                avatar: true,
                position: true,
                department: { select: { name: true } },
              },
            },
            trainee: {
              select: {
                id: true,
                traineeNumber: true,
                firstName: true,
                lastName: true,
                avatar: true,
                position: true,
                department: { select: { name: true } },
              },
            },
          },
        },
        assistants: {
          include: {
            user: { select: { name: true, avatar: true } },
          },
        },
      },
    });

    return NextResponse.json(callOuts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Worker accepts/declines OR check-in/check-out.
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      callOutId,
      status,
      declinedReason,
      checkIn,
      checkOut,
      lat,
      lng,
      address,
      notes,
    } = body;

    if (!callOutId) {
      return NextResponse.json(
        { error: "CallOut ID is required" },
        { status: 400 },
      );
    }

    const updateData: any = {};

    if (status) updateData.status = status;

    if (status === "ACCEPTED") {
      const currentCallOut = await db.emergencyCallOut.findUnique({
        where: { id: callOutId },
        select: { isBroadcast: true, groupId: true },
      });

      if (currentCallOut?.isBroadcast && currentCallOut.groupId) {
        const alreadyClaimed = await db.emergencyCallOut.findFirst({
          where: {
            groupId: currentCallOut.groupId,
            status: { in: ["AWAITING_APPROVAL", "ACCEPTED", "IN_PROGRESS"] },
            id: { not: callOutId },
          },
        });

        if (alreadyClaimed) {
          return NextResponse.json(
            {
              error:
                "This call-out has already been accepted by another leader.",
            },
            { status: 400 },
          );
        }

        // Broadcast: move to AWAITING_APPROVAL pending admin final approval
        updateData.status = "AWAITING_APPROVAL";

        // Cancel others in the broadcast group
        await db.emergencyCallOut.updateMany({
          where: {
            groupId: currentCallOut.groupId,
            id: { not: callOutId },
            status: "PENDING",
          },
          data: {
            status: "CANCELLED",
            notes: "Closed - Accepted by another leader",
          },
        });
      }

      updateData.acceptedAt = new Date();
    } else if (status === "DECLINED") {
      updateData.declinedAt = new Date();
      updateData.declinedReason = declinedReason;
    } else if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    // Handle check-in
    if (checkIn === true) {
      const callOut = await db.emergencyCallOut.findUnique({
        where: { id: callOutId },
        select: { startTime: true, status: true },
      });

      if (!callOut) {
        return NextResponse.json(
          { error: "Call-out not found" },
          { status: 404 },
        );
      }

      if (callOut.status !== "ACCEPTED") {
        return NextResponse.json(
          { error: "Cannot check in to a call-out that hasn't been accepted" },
          { status: 400 },
        );
      }

      const now = new Date();
      const startTime = new Date(callOut.startTime);
      if (now < startTime) {
        const minutesUntilStart = Math.ceil(
          (startTime.getTime() - now.getTime()) / (1000 * 60),
        );
        return NextResponse.json(
          {
            error: `Cannot check in before the scheduled start time. Please wait ${minutesUntilStart} minute(s).`,
            startTime: startTime.toISOString(),
          },
          { status: 400 },
        );
      }

      updateData.checkIn = new Date();
      updateData.checkInLat = lat;
      updateData.checkInLng = lng;
      updateData.checkInAddress = address;
      updateData.notes = notes;
    }

    // Handle check-out: fetch rates from requestedUser → employee/freeLancer/trainee
    if (checkOut === true) {
      const current = await db.emergencyCallOut.findUnique({
        where: { id: callOutId },
        include: {
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
          assistants: {
            include: {
              employee: {
                select: { emergencyCallOutRate: true, overtimeHourRate: true },
              },
              freelancer: {
                select: { emergencyCallOutRate: true, overtimeHourRate: true },
              },
              trainee: {
                select: { emergencyCallOutRate: true, overtimeHourRate: true },
              },
            },
          },
        },
      });

      if (current && current.checkIn) {
        const checkOutTime = new Date();
        const durationHours =
          (checkOutTime.getTime() - current.checkIn.getTime()) /
          (1000 * 60 * 60);

        // Unified rate: works for any user type
        const worker =
          current.requestedUser?.employee ||
          current.requestedUser?.freeLancer ||
          current.requestedUser?.trainee;
        const baseRate = worker?.overtimeHourRate || 50;
        const multiplier = worker?.emergencyCallOutRate || 1;
        const effectiveRate = baseRate * multiplier;

        updateData.checkOut = checkOutTime;
        updateData.checkOutLat = lat;
        updateData.checkOutLng = lng;
        updateData.checkOutAddress = address;
        updateData.duration = durationHours;
        updateData.status = "COMPLETED";
        updateData.completedAt = checkOutTime;
        updateData.earnings = durationHours * effectiveRate;
        updateData.hourlyRateUsed = effectiveRate;

        if (current.assistants && current.assistants.length > 0) {
          await Promise.all(
            current.assistants.map(async (assistant) => {
              const aWorker =
                assistant.employee || assistant.freelancer || assistant.trainee;
              const aBaseRate = aWorker?.overtimeHourRate || 50;
              const aMultiplier = aWorker?.emergencyCallOutRate || 1;
              const aEffectiveRate = aBaseRate * aMultiplier;

              return db.callOutAssistant.update({
                where: { id: assistant.id },
                data: {
                  earnings: durationHours * aEffectiveRate,
                  hourlyRateUsed: aEffectiveRate,
                  status: "ACCEPTED",
                },
              });
            }),
          );
        }
      }
    }

    const updated = await db.emergencyCallOut.update({
      where: { id: callOutId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
