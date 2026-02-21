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
    const {
      employeeIds,
      freelancerIds,
      traineeIds,
      title,
      message,
      startTime,
    } = body;

    if (
      (!employeeIds ||
        !Array.isArray(employeeIds) ||
        employeeIds.length === 0) &&
      (!freelancerIds ||
        !Array.isArray(freelancerIds) ||
        freelancerIds.length === 0) &&
      (!traineeIds || !Array.isArray(traineeIds) || traineeIds.length === 0)
    ) {
      return NextResponse.json(
        { error: "At least one recipient ID is required" },
        { status: 400 },
      );
    }

    const results = [];

    // Process Employees
    if (employeeIds && Array.isArray(employeeIds)) {
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
            actionUrl: `/dashboard/emergency-callouts`,
          },
        });

        // Send Push Notification
        await sendPushNotification({
          employeeId,
          title: `Emergency Call Out: ${title}`,
          body:
            message ||
            "You have an emergency call out request. Please accept or decline in the app.",
          data: { type: "EMERGENCY_CALL_OUT", callOutId: callOut.id },
        });

        results.push(callOut);
      }
    }

    // Process Freelancers
    if (freelancerIds && Array.isArray(freelancerIds)) {
      for (const freelancerId of freelancerIds) {
        const callOut = await db.emergencyCallOut.create({
          data: {
            freeLancerId: freelancerId, // Matches schema field name
            title,
            message,
            startTime: new Date(startTime),
            requestedBy: admin.id,
            status: "PENDING",
          },
        });

        // Freelancers might not have a notification system yet, but we'll create the record if applicable
        // ... notifications logic if needed ...

        results.push(callOut);
      }
    }

    // Process Trainees
    if (traineeIds && Array.isArray(traineeIds)) {
      for (const traineeId of traineeIds) {
        const callOut = await db.emergencyCallOut.create({
          data: {
            traineeId,
            title,
            message,
            startTime: new Date(startTime),
            requestedBy: admin.id,
            status: "PENDING",
          },
        });

        // Trainees might have a notification system/expo token
        const trainee = await db.trainee.findUnique({
          where: { id: traineeId },
          select: { expoPushToken: true },
        });

        if (trainee?.expoPushToken) {
          await sendPushNotification({
            traineeId, // Assuming sendPushNotification supports traineeId or needs adjustment
            title: `Emergency Call Out: ${title}`,
            body:
              message ||
              "You have an emergency call out request. Please accept or decline in the app.",
            data: { type: "EMERGENCY_CALL_OUT", callOutId: callOut.id },
          } as any);
        }

        results.push(callOut);
      }
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
    const freelancerId = searchParams.get("freelancerId");
    const traineeId = searchParams.get("traineeId");
    const status = searchParams.get("status");
    const active = searchParams.get("active"); // Filter for accepted but not completed
    const date = searchParams.get("date"); // Filter by check-in date

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (freelancerId) where.freeLancerId = freelancerId;
    if (traineeId) where.traineeId = traineeId;
    if (status) where.status = status;

    if (active === "true") {
      where.status = "ACCEPTED";
      where.checkOut = null; // Still active if not checked out
    }

    // Filter by date if provided (check-in date)
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.checkIn = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const callOuts = await db.emergencyCallOut.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            avatar: true,
            position: true,
            department: {
              select: { name: true },
            },
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
            department: {
              select: { name: true },
            },
          },
        },
        Trainee: {
          select: {
            id: true,
            traineeNumber: true,
            firstName: true,
            lastName: true,
            avatar: true,
            position: true,
            department: {
              select: { name: true },
            },
          },
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
        select: { startTime: true, status: true },
      });

      if (!callOut) {
        return NextResponse.json(
          { error: "Call-out not found" },
          { status: 404 },
        );
      }

      // Validate that the call-out has been accepted
      if (callOut.status !== "ACCEPTED") {
        return NextResponse.json(
          {
            error: "Cannot check in to a call-out that hasn't been accepted",
          },
          { status: 400 },
        );
      }

      // Validate that the current time is at or after the scheduled start time
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

    // Handle check-out
    if (checkOut === true) {
      const current = await db.emergencyCallOut.findUnique({
        where: { id: callOutId },
        include: {
          employee: { select: { emergencyCallOutRate: true } },
          freeLancer: { select: { emergencyCallOutRate: true } },
          Trainee: { select: { emergencyCallOutRate: true } },
        },
      });

      if (current && current.checkIn) {
        const checkOutTime = new Date();
        const durationMs = checkOutTime.getTime() - current.checkIn.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);

        // Get the individual's rate
        let rate = 0;
        if (current.employee) rate = current.employee.emergencyCallOutRate;
        else if (current.freeLancer)
          rate = current.freeLancer.emergencyCallOutRate;
        else if (current.Trainee) rate = current.Trainee.emergencyCallOutRate;

        updateData.checkOut = checkOutTime;
        updateData.checkOutLat = lat;
        updateData.checkOutLng = lng;
        updateData.checkOutAddress = address;
        updateData.duration = durationHours;
        updateData.status = "COMPLETED";
        updateData.completedAt = checkOutTime;
        updateData.earnings = durationHours * rate;
        updateData.hourlyRateUsed = rate;
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

