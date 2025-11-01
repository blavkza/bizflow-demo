import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { TransactionType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    if (!month) {
      return NextResponse.json(
        { error: "Month parameter is required" },
        { status: 400 }
      );
    }

    // Get HR settings
    const hrSettings = await db.hRSettings.findFirst();
    if (!hrSettings) {
      return NextResponse.json({
        canProcess: true,
        message: "No HR settings found",
      });
    }

    // Parse the month
    const [year, monthNum] = month.split("-").map(Number);
    const currentDate = new Date();
    const payrollMonth = new Date(year, monthNum - 1, 1);

    // Calculate payday for the month
    let payday = new Date(year, monthNum - 1, hrSettings.paymentDay);

    // If payment month is FOLLOWING, adjust to next month
    if (hrSettings.paymentMonth === "FOLLOWING") {
      payday = new Date(year, monthNum, hrSettings.paymentDay);
    }

    // Check if payroll already exists for this month
    const existingPayroll = await db.transaction.findFirst({
      where: {
        description: {
          contains: `Payroll for ${month}`,
        },
        type: TransactionType.EXPENSE,
      },
    });

    if (existingPayroll) {
      return NextResponse.json({
        canProcess: false,
        message: `Payroll for ${month} has already been processed`,
      });
    }

    // Calculate 2 days before payday
    const twoDaysBeforePayday = new Date(payday);
    twoDaysBeforePayday.setDate(payday.getDate() - 2);

    // Check current date against payday rules
    if (currentDate < twoDaysBeforePayday) {
      return NextResponse.json({
        canProcess: false,
        message: `Payroll can only be processed from ${twoDaysBeforePayday.toLocaleDateString()} (2 days before payday on ${payday.toLocaleDateString()})`,
      });
    }

    // If we're after payday, allow processing (since no payroll exists for the month)
    return NextResponse.json({
      canProcess: true,
      message: `Payroll can be processed. Payday is ${payday.toLocaleDateString()}`,
    });
  } catch (error) {
    console.error("Error checking payroll restrictions:", error);
    return NextResponse.json(
      { message: "Failed to check payroll restrictions", error },
      { status: 500 }
    );
  }
}
