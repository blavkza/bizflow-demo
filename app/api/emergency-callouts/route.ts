import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { CallOutType, VehicleType, CallOutStatus } from "@prisma/client";
import { sendPushToUser } from "@/lib/expo";

// POST: Create ONE callout with multiple potential leaders.
// Leaders are notified and can accept/decline independently.
// Admin later selects which accepted leader gets the mission.
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { userId: clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      type,
      address,
      vehicle,
      description,
      leaderIds, // Array of User IDs — potential leaders (required for admin dispatch)
      clientId,
      startTime,
      allowAssistants = true, // Can the selected leader add assistants?
    } = body;

    if (!type || !address || !vehicle || !description) {
      return NextResponse.json(
        {
          error: "Missing required fields: type, address, vehicle, description",
        },
        { status: 400 },
      );
    }

    // Fetch all potential leaders' user info
    const leadersData =
      leaderIds && Array.isArray(leaderIds) && leaderIds.length > 0
        ? await db.user.findMany({
            where: { id: { in: leaderIds } },
            select: {
              id: true,
              name: true,
              employeeId: true,
              freeLancerId: true,
              traineeId: true,
            },
          })
        : [];

    // Create ONE callout — requestedBy is the creator (admin or self-employee)
    const callOut = await db.emergencyCallOut.create({
      data: {
        requestedBy: user.id,
        clientId: clientId && clientId !== "NONE" ? clientId : null,
        type: type as CallOutType,
        destination: address,
        vehicle: vehicle as VehicleType,
        description,
        allowAssistants,
        workerCount: 1,
        title: `Emergency Call-Out - ${new Date().toLocaleDateString()}`,
        startTime: startTime ? new Date(startTime) : new Date(),
        status: "PENDING",

        // Create leader records for all potential leaders
        leaders:
          leadersData.length > 0
            ? {
                create: leadersData.map((l) => ({
                  userId: l.id,
                  employeeId: l.employeeId,
                  freelancerId: l.freeLancerId,
                  traineeId: l.traineeId,
                  status: "PENDING",
                })),
              }
            : undefined,
      },
      include: {
        leaders: { include: { user: { select: { name: true } } } },
        assistants: true,
        requestedUser: { select: { name: true } },
      },
    });

    // Notify all potential leaders by push & in-app
    try {
      for (const leader of leadersData) {
        await sendPushToUser({
          userId: leader.id,
          title: "🚨 Emergency Call-Out",
          body: `You have been selected as a potential leader for an emergency call-out at ${address}. Accept to claim the mission.`,
          data: { url: `/emergency-callouts/${callOut.id}` },
        });
      }

      // Create in-app notifications for potential leaders
      await db.notification.createMany({
        data: leadersData.map((l) => ({
          userId: l.id,
          title: "🚨 Emergency Call-Out Dispatch",
          message: `You have been dispatched for a potential emergency call-out at ${address}.`,
          type: "EMERGENCY",
          priority: "HIGH",
          actionUrl: `/emergency-callouts/${callOut.id}`,
          metadata: { callOutId: callOut.id },
        })),
      });
    } catch (e) {
      console.error("Failed to notify leaders:", e);
    }

    // Notify admins if created by non-admin (self-request)
    if (leadersData.length === 0) {
      try {
        const admins = await db.user.findMany({
          where: {
            role: {
              in: [
                "CHIEF_EXECUTIVE_OFFICER",
                "ADMIN_MANAGER",
                "GENERAL_MANAGER",
              ],
            },
          },
        });
        if (admins.length > 0) {
          await db.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              title: "New Emergency Call-Out Request",
              message: `${user.name} has requested an emergency call-out: ${description}`,
              type: "EMERGENCY",
              priority: "HIGH",
              actionUrl: `/dashboard/emergency-callouts/${callOut.id}`,
              metadata: { callOutId: callOut.id },
            })),
          });
        }
      } catch (e) {
        console.error("Admin notify failed:", e);
      }
    }

    return NextResponse.json(callOut);
  } catch (error) {
    console.error("[EMERGENCY_CALLOUT_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { userId: clerkId } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const myCallouts = searchParams.get("myCallouts") === "true";

    let whereClause: any = {};

    if (status) whereClause.status = status as CallOutStatus;

    if (myCallouts) {
      // Show callouts where user is:
      // 1. The creator
      // 2. A leader who is still in the running (PENDING, ACCEPTED, SELECTED)
      // 3. An assistant who is still in the running (PENDING, ACCEPTED, SELECTED)
      whereClause.OR = [
        { requestedBy: user.id },
        {
          leaders: {
            some: {
              userId: user.id,
              status: { in: ["PENDING", "ACCEPTED", "SELECTED"] },
            },
          },
        },
        {
          assistants: {
            some: {
              userId: user.id,
              status: { in: ["PENDING", "ACCEPTED", "SELECTED"] },
            },
          },
        },
      ];
    }

    const callOuts = await db.emergencyCallOut.findMany({
      where: whereClause,
      include: {
        requestedUser: {
          select: {
            name: true,
            email: true,
            role: true,
            userType: true,
            employee: { select: { position: true } },
            freeLancer: { select: { position: true } },
            trainee: { select: { position: true } },
          },
        },
        // Leaders sorted: accepted first, then by acceptedAt ascending (first to accept = top)
        leaders: {
          include: {
            user: { select: { name: true, avatar: true } },
          },
          orderBy: [
            { status: "asc" }, // ACCEPTED < DECLINED < PENDING < SELECTED alphabetically
            { acceptedAt: "asc" },
          ],
        },
        assistants: {
          include: {
            user: { select: { name: true, avatar: true } },
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json(callOuts);
  } catch (error) {
    console.error("[EMERGENCY_CALLOUT_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
