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

    const where: any = {};

    if (startDate && endDate) {
      where.checkIn = {
        gte: new Date(startDate),
        lte: new Date(endDate + "T23:59:59.999Z"),
      };
    }

    const checkins = await db.attendanceRecord.findMany({
      where: {
        ...where,
        checkIn: { not: null },
      },
      include: {
        employee: true,
      },
      orderBy: {
        checkIn: "desc",
      },
    });

    const formattedCheckins = checkins.map((record) => ({
      id: record.id,
      employeeId: record.employee.id,
      employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
      employeeNumber: record.employee.employeeNumber,
      employeeAvatar: record.employee.avatar,
      method: record.checkInMethod,
      location: record.checkInAddress || "Unknown",
      address: record.checkInAddress,
      timestamp: record.checkIn,
      coordinates:
        record.checkInLat && record.checkInLng
          ? {
              lat: record.checkInLat,
              lng: record.checkInLng,
            }
          : undefined,
    }));

    return NextResponse.json({ checkins: formattedCheckins });
  } catch (error) {
    console.error("Fetch check-ins error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
