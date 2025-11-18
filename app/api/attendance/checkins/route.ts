import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {
      checkIn: { not: null },
    };

    if (startDate && endDate) {
      where.checkIn = {
        gte: new Date(startDate),
        lte: new Date(endDate + "T23:59:59.999Z"),
      };
    }

    const checkins = await db.attendanceRecord.findMany({
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

    const formattedCheckins = checkins
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

          // Safely get coordinates
          let coordinates = undefined;
          if (record.checkInLat && record.checkInLng) {
            coordinates = {
              lat: Number(record.checkInLat),
              lng: Number(record.checkInLng),
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
            timestamp: record.checkIn!.toISOString(),
            coordinates,
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
