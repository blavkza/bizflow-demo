import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creator = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campany = await db.generalSetting.findFirst();

    const body = await req.json();
    const {
      firstName,
      lastName,
      position,
      phone,
      departmentId,
      email,
      salary,
      overtimeHourRate,
      emergencyCallOutRate,
      status,
      hireDate,
      address,
      city,
      province,
      postalCode,
      country,
      scheduledKnockIn,
      scheduledKnockOut,
      workingDays,
      reliable,
      scheduledWeekendKnockOut,
      scheduledWeekendKnockIn,
      terminationDate,
    } = body;

    const lastTrainee = await db.trainee.findFirst({
      orderBy: { createdAt: "desc" },
      select: { traineeNumber: true },
    });
    const traineeNumber = lastTrainee
      ? `TR-${parseInt(lastTrainee?.traineeNumber.split("-")[1]) + 1}`
      : "TR-2025001";

    const trainee = await db.trainee.create({
      data: {
        traineeNumber,
        firstName,
        lastName,
        position,
        phone,
        email:
          email ||
          `${traineeNumber}@${campany?.companyName?.replace(/\s+/g, "")}.com`,
        departmentId,
        salary,
        overtimeHourRate: overtimeHourRate || 0,
        emergencyCallOutRate: emergencyCallOutRate || 0,
        status,
        hireDate,
        address,
        city,
        province,
        postalCode,
        country,
        scheduledKnockIn,
        scheduledKnockOut,
        workingDays,
        reliable,
        createdBy: creator?.name,
        scheduledWeekendKnockOut,
        scheduledWeekendKnockIn,
        terminationDate,
        generalSettingId: campany?.id,
      },
    });

    await db.notification.create({
      data: {
        title: "New Trainee Created",
        message: `Trainee ${trainee.lastName} ${trainee.firstName} has been created by ${creator.name}.`,
        type: "TRAINEE",
        isRead: false,
        actionUrl: `/dashboard/human-resources/trainees/${trainee.id}`,
        userId: creator.id,
      },
    });

    return NextResponse.json({ trainee });
  } catch (error) {
    console.error("[TRAINEE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
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

    const hasFullAccess =
      user.role === "CHIEF_EXECUTIVE_OFFICER" || user.role === "ADMIN_MANAGER";

    const traineeWhere: any = {};
    if (!hasFullAccess && user.employee?.departmentId) {
      traineeWhere.departmentId = user.employee.departmentId;
    }

    const [trainees, departments] = await Promise.all([
      db.trainee.findMany({
        include: {
          department: {
            select: {
              id: true,
              name: true,
              manager: {
                select: {
                  name: true,
                },
              },
            },
          },
          payments: {
            select: {
              amount: true,
            },
          },
        },
      }),
      db.department.findMany(),
    ]);

    const serializedTrainee = trainees.map((trainee) => ({
      id: trainee.id,
      traineeId: trainee.traineeNumber,
      firstName: trainee.firstName || "",
      lastName: trainee.lastName || "",
      email: trainee.email,
      phone: trainee.phone,
      position: trainee.position,
      department: trainee.department?.name || "No Department",
      status: trainee.status,
      workType: trainee.position || "Not specified",
      salary: trainee.salary?.toNumber() || 0,
      overtimeHourRate: trainee.overtimeHourRate || 0,
      emergencyCallOutRate: trainee.emergencyCallOutRate || 0,
      location: trainee.address || "Not specified",
      startDate: trainee.hireDate?.toLocaleDateString() || "Not specified",
      manager: trainee.department?.manager?.name || "No manager",
      avatar: trainee.avatar,
      traineeNumber: trainee.traineeNumber,
      reliable: trainee.reliable,
    }));

    const statuses = [...new Set(trainees.map((emp) => emp.status))];
    const workTypes = [
      ...new Set(trainees.map((tr) => tr.position || "Not specified")),
    ];

    return NextResponse.json({
      trainees: serializedTrainee,
      departments,
      statuses,
      workTypes,
    });
  } catch (error) {
    console.error("[TRAINEES_GET_ERROR]", error);
    return NextResponse.json(
      { message: "Failed to fetch Trainee", error },
      { status: 500 },
    );
  }
}


