import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AttendanceStatus } from "@prisma/client";

// SIMPLIFIED TIMEZONE FUNCTION
function getCurrentSASTAsUTC() {
  const now = new Date();

  // Get SAST date components (Africa/Johannesburg is UTC+2)
  const sastFormatter = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const sastParts = sastFormatter.formatToParts(now);
  const getPart = (type: string) =>
    sastParts.find((p) => p.type === type)?.value || "00";

  const year = parseInt(getPart("year"));
  const month = parseInt(getPart("month")) - 1; // 0-indexed
  const day = parseInt(getPart("day"));
  const hour = parseInt(getPart("hour"));
  const minute = parseInt(getPart("minute"));
  const second = parseInt(getPart("second"));

  // SAST is UTC+2, so subtract 2 hours to get UTC
  const utcDate = new Date(
    Date.UTC(year, month, day, hour - 2, minute, second)
  );

  return {
    utcDate,
    sastDate: new Date(Date.UTC(year, month, day)), // SAST date at midnight UTC
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, freelancerId, action } = body; // action: "start" | "end"

    if (!employeeId && !freelancerId) {
      return NextResponse.json(
        { error: "Employee ID or Freelancer ID is required" },
        { status: 400 }
      );
    }

    const hrSettings = await db.hRSettings.findFirst() as any;
    const maxBreaks = hrSettings?.maxBreaksPerDay || 2;
    const totalBreakTimeAllowed = hrSettings?.totalBreakDurationMinutes || 60;
    const break1WindowStart = hrSettings?.break1WindowStart || "11:00";
    const break1WindowEnd = hrSettings?.break1WindowEnd || "13:00";
    const break2WindowStart = hrSettings?.break2WindowStart || "14:00";
    const break2WindowEnd = hrSettings?.break2WindowEnd || "16:00";
    const break3WindowStart = hrSettings?.break3WindowStart || "17:00";
    const break3WindowEnd = hrSettings?.break3WindowEnd || "18:00";
    const break4WindowStart = hrSettings?.break4WindowStart || "19:00";
    const break4WindowEnd = hrSettings?.break4WindowEnd || "20:00";

    const { utcDate: currentTime, sastDate: today } = getCurrentSASTAsUTC();

    // Check break window (SAST time)
    const sastFormatter = new Intl.DateTimeFormat("en-ZA", {
      timeZone: "Africa/Johannesburg",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const currentSASTTimeString = sastFormatter.format(new Date()); // HH:mm
    
    if (action === "start") {
      // Find person and record first to know break count
      let tempPerson: any = null;
      if (employeeId) {
        tempPerson = await db.employee.findUnique({ where: { employeeNumber: employeeId } });
      } else {
        tempPerson = await db.freeLancer.findUnique({ where: { freeLancerNumber: freelancerId } });
      }
      
      const tempRecord = tempPerson ? await db.attendanceRecord.findFirst({
        where: {
          AND: [
            employeeId ? { employeeId: tempPerson.id } : { freeLancerId: tempPerson.id },
            { date: today },
            { checkIn: { not: null } },
            { checkOut: null },
          ],
        },
        include: { breaks: true } as any
      }) : null;

      const breakCount = tempRecord?.breaks?.filter((b: any) => b.endTime).length || 0;
      let windowStart = break1WindowStart;
      let windowEnd = break1WindowEnd;

      if (breakCount === 1) {
        windowStart = break2WindowStart;
        windowEnd = break2WindowEnd;
      } else if (breakCount === 2) {
        windowStart = break3WindowStart;
        windowEnd = break3WindowEnd;
      } else if (breakCount >= 3) {
        windowStart = break4WindowStart;
        windowEnd = break4WindowEnd;
      }

      if (currentSASTTimeString < windowStart || currentSASTTimeString > windowEnd) {
        return NextResponse.json(
          { error: `Break ${breakCount + 1} is only allowed between ${windowStart} and ${windowEnd}.` },
          { status: 400 }
        );
      }
    }

    // Find the person
    let person: any = null;
    let personType: "employee" | "freelancer" = "employee";

    if (employeeId) {
      person = await db.employee.findUnique({
        where: { employeeNumber: employeeId },
      });
      personType = "employee";
    } else {
      person = await db.freeLancer.findUnique({
        where: { freeLancerNumber: freelancerId },
      });
      personType = "freelancer";
    }

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Find today's attendance record
    const attendanceRecord = await db.attendanceRecord.findFirst({
      where: {
        AND: [
          personType === "employee" ? { employeeId: person.id } : { freeLancerId: person.id },
          { date: today },
          { checkIn: { not: null } },
          { checkOut: null },
        ],
      },
      include: {
        breaks: true,
      } as any,
    }) as any;

    if (!attendanceRecord) {
      return NextResponse.json(
        { error: "Active attendance record not found for today. Please check in first." },
        { status: 400 }
      );
    }

    if (action === "start") {
      // Check if already on break
      const activeBreak = (attendanceRecord.breaks as any[]).find((b: any) => !b.endTime);
      if (activeBreak) {
        return NextResponse.json({ error: "You are already on a break." }, { status: 400 });
      }

      // Check if max breaks reached
      if ((attendanceRecord.breaks as any[]).length >= maxBreaks) {
        return NextResponse.json(
          { error: `You have already taken the maximum of ${maxBreaks} breaks today.` },
          { status: 400 }
        );
      }

      // Check if total break time already exhausted
      const totalDuration = (attendanceRecord.breaks as any[]).reduce((acc: number, b: any) => acc + (b.duration || 0), 0);
      if (totalDuration >= totalBreakTimeAllowed) {
        return NextResponse.json(
          { error: `You have already used your total break time of ${totalBreakTimeAllowed} minutes.` },
          { status: 400 }
        );
      }

      // Start the break
      const newBreak = await (db as any).breakRecord.create({
        data: {
          attendanceRecordId: attendanceRecord.id,
          startTime: currentTime,
        },
      });

      // Update attendance status
      await db.attendanceRecord.update({
        where: { id: attendanceRecord.id },
        data: {
          status: AttendanceStatus.ON_BREAK as any,
        },
      });

      return NextResponse.json({
        message: "Break started successfully",
        break: newBreak,
        remainingTotalMinutes: totalBreakTimeAllowed - totalDuration,
      });

    } else if (action === "end") {
      // Find active break
      const activeBreak = (attendanceRecord.breaks as any[]).find((b: any) => !b.endTime);
      if (!activeBreak) {
        return NextResponse.json({ error: "You are not currently on a break." }, { status: 400 });
      }

      // End the break
      const startTime = new Date(activeBreak.startTime);
      const duration = Math.round((currentTime.getTime() - startTime.getTime()) / 60000);

      const updatedBreak = await (db as any).breakRecord.update({
        where: { id: activeBreak.id },
        data: {
          endTime: currentTime,
          duration: duration,
        },
      });

      // Update attendance record total duration and status
      const allBreaks = [...(attendanceRecord.breaks as any[]).filter((b: any) => b.id !== activeBreak.id), updatedBreak];
      const newTotalDuration = allBreaks.reduce((acc: number, b: any) => acc + (b.duration || 0), 0);

      await db.attendanceRecord.update({
        where: { id: attendanceRecord.id },
        data: {
          status: AttendanceStatus.PRESENT,
          breakDuration: newTotalDuration,
        },
      });

      return NextResponse.json({
        message: "Break ended successfully",
        break: updatedBreak,
        totalBreakDuration: newTotalDuration,
        remainingTotalMinutes: Math.max(0, totalBreakTimeAllowed - newTotalDuration),
      });

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Break tracking error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const freelancerId = searchParams.get("freelancerId");

    if (!employeeId && !freelancerId) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { sastDate: today } = getCurrentSASTAsUTC();

    const hrSettings = await db.hRSettings.findFirst() as any;
    const totalBreakTimeAllowed = hrSettings?.totalBreakDurationMinutes || 60;

    let personId: string;
    let personType: "employee" | "freelancer";

    if (employeeId) {
      const p = await db.employee.findUnique({ where: { employeeNumber: employeeId } });
      if (!p) return NextResponse.json({ error: "NotFound" }, { status: 404 });
      personId = p.id;
      personType = "employee";
    } else {
      const p = await db.freeLancer.findUnique({ where: { freeLancerNumber: freelancerId! } });
      if (!p) return NextResponse.json({ error: "NotFound" }, { status: 404 });
      personId = p.id;
      personType = "freelancer";
    }

    const attendanceRecord = await db.attendanceRecord.findFirst({
      where: {
        AND: [
          personType === "employee" ? { employeeId: personId } : { freeLancerId: personId },
          { date: today },
        ],
      },
      include: {
        breaks: true,
      } as any,
    }) as any;

    if (!attendanceRecord) {
      return NextResponse.json({ 
        checkedIn: false,
        totalBreakDuration: 0,
        remainingTotalMinutes: totalBreakTimeAllowed,
        breaks: []
      });
    }

    const totalDuration = (attendanceRecord.breaks as any[]).reduce((acc: number, b: any) => acc + (b.duration || 0), 0);
    const activeBreak = (attendanceRecord.breaks as any[]).find((b: any) => !b.endTime);

    return NextResponse.json({
      checkedIn: true,
      onBreak: !!activeBreak,
      activeBreak,
      totalBreakDuration: totalDuration,
      remainingTotalMinutes: Math.max(0, totalBreakTimeAllowed - totalDuration),
      breaks: attendanceRecord.breaks,
      maxBreaks: hrSettings?.maxBreaksPerDay || 2,
      breakReminderMinutes: hrSettings?.breakReminderMinutes || 5,
      break1WindowStart: hrSettings?.break1WindowStart || "11:00",
      break1WindowEnd: hrSettings?.break1WindowEnd || "13:00",
      break2WindowStart: hrSettings?.break2WindowStart || "14:00",
      break2WindowEnd: hrSettings?.break2WindowEnd || "16:00",
      break3WindowStart: hrSettings?.break3WindowStart || "17:00",
      break3WindowEnd: hrSettings?.break3WindowEnd || "18:00",
      break4WindowStart: hrSettings?.break4WindowStart || "19:00",
      break4WindowEnd: hrSettings?.break4WindowEnd || "20:00",
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
