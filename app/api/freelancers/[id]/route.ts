import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const freelancer = await db.freeLancer.findUnique({
      where: { id },
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
            id: true,
            amount: true,
            payDate: true,
            type: true,
            status: true,
            description: true,
          },
          orderBy: {
            payDate: "desc",
          },
        },
      },
    });

    if (!freelancer) {
      return NextResponse.json(
        { error: "Freelancer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(freelancer);
  } catch (error) {
    console.error("Error fetching Freelancer:", error);
    return NextResponse.json(
      { error: "Failed to fetch Freelancer" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await params;

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      position,
      phone,
      departmentId,
      salary,
      status,
      hireDate,
      address,
      scheduledKnockIn,
      scheduledKnockOut,
      workingDays,
      reliable,
    } = body;

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!updater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedFreelancer = await db.freeLancer.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email: email && email.trim() !== "" ? email.trim() : null,
        position,
        phone,
        departmentId,
        salary,
        status,
        hireDate,
        address,
        scheduledKnockIn,
        scheduledKnockOut,
        workingDays,
        reliable,
      },
    });

    await db.notification.create({
      data: {
        title: "Freelancer Updated",
        message: `Freelancer ${updatedFreelancer.lastName} ${updatedFreelancer.firstName} , have been Updated By ${updater.name}.`,
        type: "FREELANCER",
        isRead: false,
        actionUrl: `/dashboard/human-resources/freelancers/${updatedFreelancer.id}`,
        userId: updater.id,
      },
    });

    return NextResponse.json({ updatedFreelancer });
  } catch (error) {
    console.error("Error updating Freelancer:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!updater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const freeLancer = await db.freeLancer.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!freeLancer) {
      return NextResponse.json(
        { error: "Freelancer not found" },
        { status: 404 }
      );
    }

    await db.freeLancer.delete({
      where: { id },
    });

    await db.notification.create({
      data: {
        title: "Freelancer Deleted",
        message: `Freelancer ${freeLancer.firstName} ${freeLancer.lastName} has been deleted by ${updater.name}.`,
        type: "FREELANCER",
        isRead: false,
        actionUrl: `/dashboard/human-resources/freelancers`,
        userId: updater.id,
      },
    });

    return NextResponse.json(
      { message: "Freelancer deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting Freelancer:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
