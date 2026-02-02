import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let settings = await db.financialSettings.findFirst();

    if (!settings) {
      settings = await db.financialSettings.create({
        data: {
          currentPrimeRate: 11.75,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.log("[FINANCIAL_SETTINGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { currentPrimeRate } = body;

    let settings = await db.financialSettings.findFirst();

    if (!settings) {
      settings = await db.financialSettings.create({
        data: {
          currentPrimeRate,
          updatedBy: userId,
        },
      });
    } else {
      settings = await db.financialSettings.update({
        where: { id: settings.id },
        data: {
          currentPrimeRate,
          updatedBy: userId,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.log("[FINANCIAL_SETTINGS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
