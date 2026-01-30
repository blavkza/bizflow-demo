import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sendPushNotification } from "@/lib/expo";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const admin = await db.user.findUnique({
      where: { userId },
    });

    if (!admin) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    const { employeeIds, title, message, startTime } = body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json({ error: "At least one employee ID is required" }, { status: 400 });
    }

    const results = [];

    for (const employeeId of employeeIds) {
      const callOut = await db.emergencyCallOut.create({
        data: {
          employeeId,
          title,
          message,
          startTime: new Date(startTime),
          requestedBy: admin.id,
          status: "PENDING",
        },
      });

      // Create a system notification record
      await db.employeeNotification.create({
        data: {
          employeeId,
          title: `Emergency Call Out: ${title}`,
          message: message || "You have an emergency call out request.",
          type: "EMERGENCY",
          priority: "HIGH",
          metadata: { callOutId: callOut.id },
        },
      });

      // Send Push Notification
      await sendPushNotification({
        employeeId,
        title: `Emergency Call Out: ${title}`,
        body: message || "You have an emergency call out request. Please accept or decline in the app.",
        data: { type: "EMERGENCY_CALL_OUT", callOutId: callOut.id },
      });

      results.push(callOut);
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error creating call outs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const active = searchParams.get("active"); // Filter for accepted but not completed

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    
    if (active === "true") {
      where.status = "ACCEPTED";
      where.checkOut = null; // Still active if not checked out
    }

    const callOuts = await db.emergencyCallOut.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      include: {
        employee: {
          select: { firstName: true, lastName: true },
        },
        requestedUser: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(callOuts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { callOutId, status, declinedReason, checkIn, checkOut, lat, lng, address, notes } = body;

    if (!callOutId) {
      return NextResponse.json({ error: "CallOut ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    
    if (status) updateData.status = status;

    if (status === "ACCEPTED") {
      updateData.acceptedAt = new Date();
    } else if (status === "DECLINED") {
      updateData.declinedAt = new Date();
      updateData.declinedReason = declinedReason;
    } else if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    // Handle check-in
    if (checkIn === true) {
      // Fetch the call-out to check the start time
      const callOut = await db.emergencyCallOut.findUnique({
        where: { id: callOutId },
        select: { startTime: true, status: true }
      });

      if (!callOut) {
        return NextResponse.json({ error: "Call-out not found" }, { status: 404 });
      }

      // Validate that the call-out has been accepted
      if (callOut.status !== "ACCEPTED") {
        return NextResponse.json({ 
          error: "Cannot check in to a call-out that hasn't been accepted" 
        }, { status: 400 });
      }

      // Validate that the current time is at or after the scheduled start time
      const now = new Date();
      const startTime = new Date(callOut.startTime);
      
      if (now < startTime) {
        const minutesUntilStart = Math.ceil((startTime.getTime() - now.getTime()) / (1000 * 60));
        return NextResponse.json({ 
          error: `Cannot check in before the scheduled start time. Please wait ${minutesUntilStart} minute(s).`,
          startTime: startTime.toISOString()
        }, { status: 400 });
      }

      updateData.checkIn = new Date();
      updateData.checkInLat = lat;
      updateData.checkInLng = lng;
      updateData.checkInAddress = address;
      updateData.notes = notes;
    }

    // Handle check-out
    if (checkOut === true) {
      const current = await db.emergencyCallOut.findUnique({
        where: { id: callOutId }
      });

      if (current && current.checkIn) {
        const checkOutTime = new Date();
        const durationMs = checkOutTime.getTime() - current.checkIn.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);

        updateData.checkOut = checkOutTime;
        updateData.checkOutLat = lat;
        updateData.checkOutLng = lng;
        updateData.checkOutAddress = address;
        updateData.duration = durationHours;
        updateData.status = "COMPLETED";
        updateData.completedAt = checkOutTime;
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
