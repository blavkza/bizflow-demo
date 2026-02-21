import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;

    const body = await req.json();
    const {
      email,
      phone,
      address,
      city,
      province,
      postalCode,
      country,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
      emergencyAddress,
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

    const updatedTrainee = await db.trainee.update({
      where: { id },
      data: {
        email,
        phone,
        address,
        city,
        province,
        postalCode,
        country,
        emergencyName,
        emergencyPhone,
        emergencyRelation,
        emergencyAddress,
      },
    });

    await db.notification.create({
      data: {
        title: "Trainee Contact-Info Updated",
        message: `Trainee ${updatedTrainee.lastName} ${updatedTrainee.firstName} , Contact Information have been Updated By ${updater.name}.`,
        type: "TRAINEE",
        isRead: false,
        actionUrl: `/dashboard/human-resources/trainees/${updatedTrainee.id}`,
        userId: updater.id,
      },
    });

    return NextResponse.json(updatedTrainee);
  } catch (error) {
    console.error("Error updating Trainee contact info:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
