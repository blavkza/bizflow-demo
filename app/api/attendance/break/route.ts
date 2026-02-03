import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { AttendanceStatus } from "@prisma/client";

function getSASTContext(hrSettings?: any) {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) =>
    parts.find((p) => p.type === type)?.value || "00";

  const hourStr = getPart("hour");
  const minuteStr = getPart("minute");
  const year = parseInt(getPart("year"));
  const month = parseInt(getPart("month")) - 1;
  const day = parseInt(getPart("day"));

  const timeStr = `${hourStr}:${minuteStr}`;
  const today = new Date(Date.UTC(year, month, day));

  let currentWindow = 0;
  if (hrSettings) {
    const windows = [
      {
        start: hrSettings?.teaTimeWindowStart || "10:00",
        end: hrSettings?.teaTimeWindowEnd || "11:00",
      },
      {
        start: hrSettings?.lunchTimeWindowStart || "13:00",
        end: hrSettings?.lunchTimeWindowEnd || "14:00",
      },
    ];

    for (let i = 0; i < windows.length; i++) {
      if (timeStr >= windows[i].start && timeStr <= windows[i].end) {
        currentWindow = i + 1;
        break;
      }
    }
  }

  return { now, timeStr, today, currentWindow };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, freelancerId, action, breakWindow } = body;

    if (!employeeId && !freelancerId) {
      return NextResponse.json(
        { error: "Employee ID or Freelancer ID is required" },
        { status: 400 },
      );
    }

    const hrSettings = (await db.hRSettings.findFirst({
      orderBy: { updatedAt: "desc" },
    })) as any;

    const context = getSASTContext(hrSettings);
    const {
      now: currentTime,
      today,
      currentWindow: detectedWindow,
      timeStr: currentSASTTimeString,
    } = context;

    const totalBreakTimeAllowed = hrSettings?.totalBreakDurationMinutes || 60;
    const maxBreaks = hrSettings?.maxBreaksPerDay || 2;

    const breakWindows = [
      {
        start: hrSettings?.teaTimeWindowStart || "10:00",
        end: hrSettings?.teaTimeWindowEnd || "11:00",
        label: 1,
      },
      {
        start: hrSettings?.lunchTimeWindowStart || "13:00",
        end: hrSettings?.lunchTimeWindowEnd || "14:00",
        label: 2,
      },
    ];

    // Find the person
    let person: any = null;
    let personType: "employee" | "freelancer" = "employee";

    if (employeeId) {
      person = await db.employee.findFirst({
        where: {
          OR: [{ id: employeeId }, { employeeNumber: employeeId }],
        },
      });
      personType = "employee";
    } else {
      person = await db.freeLancer.findFirst({
        where: {
          OR: [{ id: freelancerId }, { freeLancerNumber: freelancerId }],
        },
      });
      personType = "freelancer";
    }

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // ---------------------------------------------------------
    // 3. GET ATTENDANCE RECORD
    // ---------------------------------------------------------
    const attendanceRecord = (await db.attendanceRecord.findFirst({
      where: {
        AND: [
          personType === "employee"
            ? { employeeId: person.id }
            : { freeLancerId: person.id },
          { checkIn: { not: null } },
          { checkOut: null },
        ],
      },
      orderBy: { date: "desc" },
      include: {
        breaks: true,
      } as any,
    })) as any;

    if (!attendanceRecord) {
      return NextResponse.json(
        {
          error: "Active attendance record not found. Please check in first.",
        },
        { status: 400 },
      );
    }

    const currentBreaks = (attendanceRecord.breaks as any[]) || [];

    // ---------------------------------------------------------
    // 4. PERFORM ACTION
    // ---------------------------------------------------------
    if (action === "start") {
      // A. Check if already on break
      const activeBreak = currentBreaks.find((b: any) => !b.endTime);
      if (activeBreak) {
        return NextResponse.json(
          { error: "You are already on a break." },
          { status: 400 },
        );
      }

      // Logic to determine which window we are targeting
      let targetWindow = breakWindow || detectedWindow;

      if (!targetWindow || targetWindow === 0) {
        // Find next available window for error message
        let nextWindow = null;
        for (const window of breakWindows) {
          if (currentSASTTimeString < window.end) {
            nextWindow = window;
            break;
          }
        }

        return NextResponse.json(
          {
            error: nextWindow
              ? `${nextWindow.label === 1 ? "Tea Time" : "Lunch Time"} is available from ${nextWindow.start} to ${nextWindow.end}. Current time (SAST): ${currentSASTTimeString}`
              : `No more break windows available today. Current time (SAST): ${currentSASTTimeString}`,
          },
          { status: 400 },
        );
      }

      // Validate targeted window
      const targetWindowInfo = breakWindows.find(
        (w) => w.label === targetWindow,
      );
      if (targetWindowInfo) {
        if (currentSASTTimeString < targetWindowInfo.start) {
          return NextResponse.json(
            {
              error: `${targetWindow === 1 ? "Tea Time" : "Lunch Time"} is only available from ${targetWindowInfo.start} to ${targetWindowInfo.end}. Current time: ${currentSASTTimeString}`,
            },
            { status: 400 },
          );
        }

        if (currentSASTTimeString > targetWindowInfo.end) {
          // Find next available window
          let nextWindow = null;
          for (const window of breakWindows) {
            if (currentSASTTimeString < window.end) {
              nextWindow = window;
              break;
            }
          }

          return NextResponse.json(
            {
              error: nextWindow
                ? `${targetWindow === 1 ? "Tea Time" : "Lunch Time"} window has passed. Next available: ${nextWindow.label === 1 ? "Tea Time" : "Lunch Time"} from ${nextWindow.start} to ${nextWindow.end}`
                : `${targetWindow === 1 ? "Tea Time" : "Lunch Time"} window has passed. No more breaks available today.`,
            },
            { status: 400 },
          );
        }
      }

      // C. Check if this specific window has already been used
      const windowTaken = currentBreaks.some((breakRecord: any) => {
        const bStart = new Date(breakRecord.startTime);
        const bastSAST = new Date(bStart.getTime() + 2 * 60 * 60 * 1000);
        const bHour = bastSAST.getUTCHours();
        const bMinute = bastSAST.getUTCMinutes();
        const bTimeStr = `${bHour.toString().padStart(2, "0")}:${bMinute.toString().padStart(2, "0")}`;

        for (const w of breakWindows) {
          if (bTimeStr >= w.start && bTimeStr <= w.end) {
            return w.label === targetWindow;
          }
        }
        return false;
      });

      if (windowTaken) {
        return NextResponse.json(
          {
            error: `You have already taken ${targetWindow === 1 ? "tea time" : "lunch time"} break today.`,
          },
          { status: 400 },
        );
      }

      // D. Check Max Breaks
      if (currentBreaks.length >= maxBreaks) {
        return NextResponse.json(
          { error: `Maximum of ${maxBreaks} breaks reached for today.` },
          { status: 400 },
        );
      }

      // E. Check Total Duration
      const totalUsed = currentBreaks.reduce(
        (acc, b) => acc + (b.duration || 0),
        0,
      );
      if (totalUsed >= totalBreakTimeAllowed) {
        return NextResponse.json(
          {
            error: `Total break time of ${totalBreakTimeAllowed} minutes reached.`,
          },
          { status: 400 },
        );
      }

      // F. Create Break
      const newBreak = await (db as any).breakRecord.create({
        data: {
          attendanceRecordId: attendanceRecord.id,
          startTime: currentTime,
        },
      });

      await db.attendanceRecord.update({
        where: { id: attendanceRecord.id },
        data: { status: "ON_BREAK" as any },
      });

      const allowedDuration =
        currentBreaks.length === 0
          ? Math.floor(totalBreakTimeAllowed / 2)
          : Math.max(0, totalBreakTimeAllowed - totalUsed);

      return NextResponse.json({
        message: "Break started successfully",
        break: newBreak,
        currentBreakAllowance: allowedDuration,
      });
    } else if (action === "end") {
      const activeBreak = currentBreaks.find((b: any) => !b.endTime);
      if (!activeBreak) {
        return NextResponse.json(
          { error: "You are not currently on a break." },
          { status: 400 },
        );
      }

      const startTime = new Date(activeBreak.startTime);
      const duration = Math.round(
        (currentTime.getTime() - startTime.getTime()) / 60000,
      );

      const updatedBreak = await (db as any).breakRecord.update({
        where: { id: activeBreak.id },
        data: {
          endTime: currentTime,
          duration: duration,
        },
      });

      const allBreaks = [
        ...currentBreaks.filter((b) => b.id !== activeBreak.id),
        updatedBreak,
      ];
      const newTotalDuration = allBreaks.reduce(
        (acc, b) => acc + (b.duration || 0),
        0,
      );

      await db.attendanceRecord.update({
        where: { id: attendanceRecord.id },
        data: {
          status: "PRESENT" as any,
          breakDuration: newTotalDuration,
        },
      });

      return NextResponse.json({
        message: "Break ended successfully",
        break: updatedBreak,
        totalBreakDuration: newTotalDuration,
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Break tracking error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 },
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

    const hrSettings = (await db.hRSettings.findFirst({
      orderBy: { updatedAt: "desc" },
    })) as any;

    const context = getSASTContext(hrSettings);
    const { today, currentWindow, timeStr } = context;

    const totalBreakTimeAllowed = hrSettings?.totalBreakDurationMinutes || 60;

    let personId: string;
    let personType: "employee" | "freelancer";

    if (employeeId) {
      const p = await db.employee.findFirst({
        where: {
          OR: [{ id: employeeId }, { employeeNumber: employeeId }],
        },
      });
      if (!p) return NextResponse.json({ error: "NotFound" }, { status: 404 });
      personId = p.id;
      personType = "employee";
    } else {
      const p = await db.freeLancer.findFirst({
        where: {
          OR: [{ id: freelancerId! }, { freeLancerNumber: freelancerId! }],
        },
      });
      if (!p) return NextResponse.json({ error: "NotFound" }, { status: 404 });
      personId = p.id;
      personType = "freelancer";
    }

    const attendanceRecord = (await db.attendanceRecord.findFirst({
      where: {
        AND: [
          personType === "employee"
            ? { employeeId: personId }
            : { freeLancerId: personId },
          { checkIn: { not: null } },
          { checkOut: null },
        ],
      },
      orderBy: { date: "desc" },
      include: {
        breaks: true,
      } as any,
    })) as any;

    if (!attendanceRecord) {
      return NextResponse.json({
        checkedIn: false,
        totalBreakDuration: 0,
        remainingTotalMinutes: totalBreakTimeAllowed,
        breaks: [],
      });
    }

    const totalDuration = (attendanceRecord.breaks as any[]).reduce(
      (acc: number, b: any) => acc + (b.duration || 0),
      0,
    );
    const activeBreak = (attendanceRecord.breaks as any[]).find(
      (b: any) => !b.endTime,
    );

    // Calculate allowance for the current/next break
    const breakCount = (attendanceRecord.breaks as any[]).length;
    let currentBreakAllowance = 0;

    if (breakCount === 0) {
      // First break: Max 50% of total
      currentBreakAllowance = Math.floor(totalBreakTimeAllowed / 2);
    } else {
      // Subsequent breaks: Remaining time
      currentBreakAllowance = Math.max(
        0,
        totalBreakTimeAllowed - totalDuration,
      );
    }

    return NextResponse.json({
      checkedIn: true,
      onBreak: !!activeBreak,
      activeBreak,
      totalBreakDuration: totalDuration,
      remainingTotalMinutes: Math.max(0, totalBreakTimeAllowed - totalDuration),
      breaks: attendanceRecord.breaks,
      currentBreakAllowance,
      maxBreaks: hrSettings?.maxBreaksPerDay || 2,
      breakReminderMinutes: hrSettings?.breakReminderMinutes || 5,
      teaTimeWindowStart: hrSettings?.teaTimeWindowStart || "10:00",
      teaTimeWindowEnd: hrSettings?.teaTimeWindowEnd || "11:00",
      lunchTimeWindowStart: hrSettings?.lunchTimeWindowStart || "13:00",
      lunchTimeWindowEnd: hrSettings?.lunchTimeWindowEnd || "14:00",
      currentBreakWindow: currentWindow,
      serverTime: context.now.toISOString(),
      sastTime: context.timeStr,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
