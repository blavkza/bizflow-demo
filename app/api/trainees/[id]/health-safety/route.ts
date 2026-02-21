import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      medicalCondition,
      allergies,
      restrictions,
      firstAidNeeds,
      riskLevel,
      additionalInfo,
      emergencyContacts,
    } = body;

    const updatedTrainee = await db.trainee.update({
      where: { id },
      data: {
        medicalCondition,
        allergies,
        restrictions,
        firstAidNeeds,
        riskLevel,
        additionalInfo,
        emergencyContacts,
      },
    });

    return NextResponse.json({ trainee: updatedTrainee });
  } catch (error) {
    console.error("Error updating health & safety information:", error);
    return NextResponse.json(
      { error: "Failed to update health & safety information" },
      { status: 500 },
    );
  }
}
