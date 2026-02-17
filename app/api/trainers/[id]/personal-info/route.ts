import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { id } = await params;

    const body = await req.json();
    const {
      idNumber,
      taxNumber,
      nationality,
      maritalStatus,
      bankName,
      accountNumber,
      branchCode,
      accountType,
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

    const updatedTrainer = await db.trainer.update({
      where: { id },
      data: {
        idNumber,
        taxNumber,
        nationality,
        maritalStatus: maritalStatus as any,
        bankName,
        accountNumber,
        branchCode,
        accountType,
      },
    });

    await db.notification.create({
      data: {
        title: "Trainer Personal-Info Updated",
        message: `Trainer ${updatedTrainer.lastName} ${updatedTrainer.firstName} , Personal Information have been Updated By ${updater.name}.`,
        type: "TRAINER",
        isRead: false,
        actionUrl: `/dashboard/human-resources/trainers/${updatedTrainer.id}`,
        userId: updater.id,
      },
    });

    return NextResponse.json({ updatedTrainer });
  } catch (error) {
    console.error("Error updating Trainer personal info:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
