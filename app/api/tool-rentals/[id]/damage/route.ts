import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const user = await db.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return new NextResponse("User Not Found", { status: 401 });
    }

    const rentalId = params.id;
    const { damageType, severity, description, repairCost } =
      await request.json();

    const updatedRental = await db.toolRental.update({
      where: { id: rentalId },
      data: {
        damageReported: true,
        damageDescription: `${damageType}: ${description} (Severity: ${severity})`,
        // You might want to add repairCost to your schema
      },
      include: {
        tool: true,
        quotation: {
          include: {
            client: true,
          },
        },
        invoice: true,
      },
    });

    return NextResponse.json(updatedRental);
  } catch (error) {
    console.error("Error reporting damage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
