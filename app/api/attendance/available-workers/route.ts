import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import {
  EmployeeStatus,
  FreeLancerStatus,
  TrainerStatus,
} from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const date = new Date(dateStr);
    date.setUTCHours(0, 0, 0, 0);

    // Get active employees who don't have an attendance record for this date
    const employees = await db.employee.findMany({
      where: {
        status: EmployeeStatus.ACTIVE,
        AttendanceRecord: {
          none: {
            date: date,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeNumber: true,
        position: true,
        department: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get active freelancers who don't have an attendance record for this date
    const freelancers = await db.freeLancer.findMany({
      where: {
        status: FreeLancerStatus.ACTIVE,
        attendanceRecords: {
          none: {
            date: date,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        freeLancerNumber: true,
        position: true,
        department: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get active trainers who don't have an attendance record for this date
    const trainers = await db.trainer.findMany({
      where: {
        status: TrainerStatus.ACTIVE,
        attendanceRecords: {
          none: {
            date: date,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        trainerNumber: true,
        position: true,
        department: {
          select: {
            name: true,
          },
        },
      },
    });

    // Combine and mark types
    const workers = [
      ...employees.map((e) => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        number: e.employeeNumber,
        position: e.position,
        department: e.department?.name || "No Department",
        type: "employee",
      })),
      ...freelancers.map((f) => ({
        id: f.id,
        firstName: f.firstName,
        lastName: f.lastName,
        number: f.freeLancerNumber,
        position: f.position,
        department: f.department?.name || "No Department",
        type: "freelancer",
      })),
      ...trainers.map((t) => ({
        id: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        number: t.trainerNumber,
        position: t.position,
        department: t.department?.name || "No Department",
        type: "trainer",
      })),
    ];

    return NextResponse.json({ workers });
  } catch (error) {
    console.error("Fetch available workers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
