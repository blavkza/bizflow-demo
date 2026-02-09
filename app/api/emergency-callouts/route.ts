import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { CallOutType, VehicleType, CallOutStatus } from "@prisma/client";
import { sendPushToUser } from "@/lib/expo";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId: clerkId },
      include: { employee: true, freeLancer: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      type,
      address,
      vehicle,
      description,
      isTeamLeader,
      assistantIds,
      clientId,
      startTime,
    } = body;

    // Basic Validation
    if (!type || !address || !vehicle || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create the Call-Out
    const callOut = await db.emergencyCallOut.create({
      data: {
        requestedBy: user.id,
        employeeId: user.employeeId,
        freeLancerId: user.freeLancerId,
        clientId: clientId || null, // Optional link to client

        type: type as CallOutType,
        destination: address,
        vehicle: vehicle as VehicleType,
        description: description,
        isTeamLeader: !!isTeamLeader,

        // Legacy Required Fields
        title: `Emergency Call-Out - ${new Date().toLocaleDateString()}`,
        startTime: startTime ? new Date(startTime) : new Date(),
        status: "PENDING", // Initial status

        // Create Assistants if Team Leader
        assistants:
          isTeamLeader &&
          assistantIds &&
          Array.isArray(assistantIds) &&
          assistantIds.length > 0
            ? {
                create: assistantIds.map((assistantUserId: string) => ({
                  userId: assistantUserId,
                  // We could also lookup employee/freelancer IDs here if needed,
                  // but userId is sufficient for linking to the user account.
                })),
              }
            : undefined,
      },
      include: {
        assistants: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Notify Admins
    try {
      const admins = await db.user.findMany({
        where: {
          role: {
            in: ["CHIEF_EXECUTIVE_OFFICER", "ADMIN_MANAGER", "GENERAL_MANAGER"],
          },
        },
      });

      if (admins.length > 0) {
        await db.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: "New Emergency Call-Out",
            message: `${user.name} has requested an emergency call-out: ${description}`,
            type: "ALERT",
            priority: "HIGH",
            actionUrl: `/dashboard/emergency-callouts/${callOut.id}`,
            metadata: { callOutId: callOut.id },
          })),
        });

        // Also Send Push to Admins
        for (const admin of admins) {
          await sendPushToUser({
            userId: admin.id,
            title: "🚨 Emergency Call-Out",
            body: `${user.name} requested a call-out for ${address}.`,
            data: { url: `/dashboard/emergency-callouts/${callOut.id}` },
          });
        }
      }

      // Notify Assistants (Optional but recommended)
      if (assistantIds && assistantIds.length > 0) {
        for (const assistantId of assistantIds) {
          await sendPushToUser({
            userId: assistantId,
            title: "⚠️ Call-Out Invitation",
            body: `You've been invited as an assistant by ${user.name} for an emergency call-out.`,
            data: { url: `/emergency-callouts/${callOut.id}` },
          });
        }
      }
    } catch (notifyError) {
      console.error("Failed to notify admins:", notifyError);
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

    const user = await db.user.findUnique({
      where: { userId: clerkId },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // For now, return all callouts effectively, or filter based on role.
    // If not Admin, maybe only show own?
    // User request doesn't specify visibility, but "Admin Review" implies separate views.
    // We'll return all for now to support the list view.

    // Check if URL has query params for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const myRequests = searchParams.get("myRequests") === "true";

    let whereClause: any = {};
    if (status) {
      whereClause.status = status as CallOutStatus;
    }

    if (myRequests) {
      whereClause.requestedBy = user.id;
    }
    // If user is assistant? optional TODO

    const callOuts = await db.emergencyCallOut.findMany({
      where: whereClause,
      include: {
        requestedUser: {
          select: {
            name: true,
            email: true,
            employee: {
              select: { position: true },
            },
            freeLancer: {
              select: { position: true, freeLancerNumber: true },
            },
          },
        },
        assistants: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
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
