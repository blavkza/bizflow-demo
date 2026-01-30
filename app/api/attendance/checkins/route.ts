import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      include: { employee: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const hasFullAccess =
      user.role === "CHIEF_EXECUTIVE_OFFICER" ||
      user.role === "ADMIN_MANAGER";

    let dateFilter: any = {
      OR: [{ checkIn: { not: null } }, { checkOut: { not: null } }],
    };

    if (startDate && endDate) {
      dateFilter.OR = [
        {
          checkIn: {
            gte: new Date(startDate),
            lte: new Date(endDate + "T23:59:59.999Z"),
          },
        },
        {
          checkOut: {
            gte: new Date(startDate),
            lte: new Date(endDate + "T23:59:59.999Z"),
          },
        },
      ];
    }

    const where: any = {
      AND: [dateFilter],
    };

    if (!hasFullAccess && user.employee?.departmentId) {
      where.AND.push({
        OR: [
          { employee: { departmentId: user.employee.departmentId } },
          { freeLancer: { departmentId: user.employee.departmentId } },
        ],
      });
    }

    const records = await db.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            avatar: true,
          },
        },
        freeLancer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            freeLancerNumber: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        checkIn: "desc",
      },
    });

    const formattedCheckins = records
      .map((record) => {
        try {
          // Safely get person data (employee or freelancer)
          const person = record.employee || record.freeLancer;

          if (!person) {
            console.warn(
              `Attendance record ${record.id} has no associated person`
            );
            return null;
          }

          const isEmployee = !!record.employee;
          const personType = isEmployee ? "employee" : "freelancer";
          const personId = isEmployee
            ? record.employee!.id
            : record.freeLancer!.id;
          const personNumber = isEmployee
            ? record.employee!.employeeNumber
            : record.freeLancer!.freeLancerNumber;
          const personName = `${person.firstName} ${person.lastName}`;

          // Safely get check-in coordinates
          let coordinates = undefined;
          if (record.checkInLat && record.checkInLng) {
            coordinates = {
              lat: Number(record.checkInLat),
              lng: Number(record.checkInLng),
            };
          }

          // Safely get check-out coordinates
          let checkOutCoordinates = undefined;
          if (record.checkOutLat && record.checkOutLng) {
            checkOutCoordinates = {
              lat: Number(record.checkOutLat),
              lng: Number(record.checkOutLng),
            };
          }

          return {
            id: record.id,
            employeeId: personId,
            employeeName: personName,
            employeeNumber: personNumber,
            employeeAvatar: person.avatar || null,
            personType,
            method: record.checkInMethod,
            location: record.checkInAddress || "Unknown",
            address: record.checkInAddress,
            timestamp:
              record.checkIn?.toISOString() || new Date().toISOString(),
            coordinates,
            // Check-out data
            checkOutTimestamp: record.checkOut?.toISOString() || null,
            checkOutAddress: record.checkOutAddress,
            checkOutCoordinates,
            checkOutMethod: record.checkInMethod,
            // Additional data
            regularHours: record.regularHours
              ? Number(record.regularHours)
              : null,
            overtimeHours: record.overtimeHours
              ? Number(record.overtimeHours)
              : null,
            status: record.status,
            notes: record.notes,
          };
        } catch (error) {
          console.error(
            `Error formatting check-in record ${record.id}:`,
            error
          );
          return null;
        }
      })
      .filter((checkin) => checkin !== null);

    return NextResponse.json({
      checkins: formattedCheckins,
      total: formattedCheckins.length,
    });
  } catch (error) {
    console.error("Fetch check-ins error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
