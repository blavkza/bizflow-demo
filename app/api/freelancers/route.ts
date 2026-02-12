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

    const lastFreelancer = await db.freeLancer.findFirst({
      orderBy: { createdAt: "desc" },
      select: { freeLancerNumber: true },
    });
    const freeLancerNumber = lastFreelancer
      ? `FL-${parseInt(lastFreelancer?.freeLancerNumber.split("-")[1]) + 1}`
      : "FL-2025001";

    const freelancer = await db.freeLancer.create({
      data: {
        freeLancerNumber,
        firstName,
        lastName,
        position,
        phone,
        email:
          email ||
          `${freeLancerNumber}@${campany?.companyName?.replace(/\s+/g, "")}.com`,
        departmentId,
        salary,
        overtimeHourRate: overtimeHourRate || 0,
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
        title: "New Freelancer Created",
        message: `Freelancer ${freelancer.lastName} ${freelancer.firstName} has been created by ${creator.name}.`,
        type: "FREELANCER",
        isRead: false,
        actionUrl: `/dashboard/human-resources/freelancers/${freelancer.id}`,
        userId: creator.id,
      },
    });

    return NextResponse.json({ freelancer });
  } catch (error) {
    console.error("[FREELANCER_ERROR]", error);
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

    const freelancerWhere: any = {};
    if (!hasFullAccess && user.employee?.departmentId) {
      freelancerWhere.departmentId = user.employee.departmentId;
    }

    const [freelancers, departments] = await Promise.all([
      db.freeLancer.findMany({
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

    const serializedFreelancer = freelancers.map((freeLancer) => ({
      id: freeLancer.id,
      freeLancerId: freeLancer.freeLancerNumber,
      firstName: freeLancer.firstName || "",
      lastName: freeLancer.lastName || "",
      email: freeLancer.email,
      phone: freeLancer.phone,
      position: freeLancer.position,
      department: freeLancer.department?.name || "No Department",
      status: freeLancer.status,
      workType: freeLancer.position || "Not specified",
      salary: freeLancer.salary?.toNumber() || 0,
      overtimeHourRate: freeLancer.overtimeHourRate || 0,
      location: freeLancer.address || "Not specified",
      startDate: freeLancer.hireDate?.toLocaleDateString() || "Not specified",
      manager: freeLancer.department?.manager?.name || "No manager",
      avatar: freeLancer.avatar,
      freeLancerNumber: freeLancer.freeLancerNumber,
      reliable: freeLancer.reliable,
    }));

    const statuses = [...new Set(freelancers.map((emp) => emp.status))];
    const workTypes = [
      ...new Set(freelancers.map((fre) => fre.position || "Not specified")),
    ];

    return NextResponse.json({
      freelancers: serializedFreelancer,
      departments,
      statuses,
      workTypes,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch Freelancer", error },
      { status: 500 },
    );
  }
}
