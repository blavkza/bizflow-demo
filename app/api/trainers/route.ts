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

    const lastTrainer = await db.trainer.findFirst({
      orderBy: { createdAt: "desc" },
      select: { trainerNumber: true },
    });
    const trainerNumber = lastTrainer
      ? `TR-${parseInt(lastTrainer?.trainerNumber.split("-")[1]) + 1}`
      : "TR-2025001";

    const trainer = await db.trainer.create({
      data: {
        trainerNumber,
        firstName,
        lastName,
        position,
        phone,
        email:
          email ||
          `${trainerNumber}@${campany?.companyName?.replace(/\s+/g, "")}.com`,
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
        title: "New Trainer Created",
        message: `Trainer ${trainer.lastName} ${trainer.firstName} has been created by ${creator.name}.`,
        type: "TRAINER",
        isRead: false,
        actionUrl: `/dashboard/human-resources/trainers/${trainer.id}`,
        userId: creator.id,
      },
    });

    return NextResponse.json({ trainer });
  } catch (error) {
    console.error("[TRAINER_ERROR]", error);
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

    const trainerWhere: any = {};
    if (!hasFullAccess && user.employee?.departmentId) {
      trainerWhere.departmentId = user.employee.departmentId;
    }

    const [trainers, departments] = await Promise.all([
      db.trainer.findMany({
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

    const serializedTrainer = trainers.map((trainer) => ({
      id: trainer.id,
      trainerId: trainer.trainerNumber,
      firstName: trainer.firstName || "",
      lastName: trainer.lastName || "",
      email: trainer.email,
      phone: trainer.phone,
      position: trainer.position,
      department: trainer.department?.name || "No Department",
      status: trainer.status,
      workType: trainer.position || "Not specified",
      salary: trainer.salary?.toNumber() || 0,
      overtimeHourRate: trainer.overtimeHourRate || 0,
      emergencyCallOutRate: trainer.emergencyCallOutRate || 0,
      location: trainer.address || "Not specified",
      startDate: trainer.hireDate?.toLocaleDateString() || "Not specified",
      manager: trainer.department?.manager?.name || "No manager",
      avatar: trainer.avatar,
      trainerNumber: trainer.trainerNumber,
      reliable: trainer.reliable,
    }));

    const statuses = [...new Set(trainers.map((emp) => emp.status))];
    const workTypes = [
      ...new Set(trainers.map((tr) => tr.position || "Not specified")),
    ];

    return NextResponse.json({
      trainers: serializedTrainer,
      departments,
      statuses,
      workTypes,
    });
  } catch (error) {
    console.error("[TRAINERS_GET_ERROR]", error);
    return NextResponse.json(
      { message: "Failed to fetch Trainer", error },
      { status: 500 },
    );
  }
}
