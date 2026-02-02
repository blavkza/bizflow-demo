import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

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
    // Calculate End Date of the payroll month to filter hire dates correctly
    const payrollMonthEnd = new Date(year, monthNum, 0);

    // Calculate payday for the month
    let payday = new Date(year, monthNum - 1, hrSettings.paymentDay);

    // If payment month is FOLLOWING, adjust to next month
    if (hrSettings.paymentMonth === "FOLLOWING") {
      payday = new Date(year, monthNum, hrSettings.paymentDay);
    }

    // --- 1. Date Restriction Check ---
    // Calculate 2 days before payday
    const twoDaysBeforePayday = new Date(payday);
    twoDaysBeforePayday.setDate(payday.getDate() - 5);

    // Check current date against payday rules
    if (currentDate < twoDaysBeforePayday) {
      return NextResponse.json({
        canProcess: false,
        message: `Payroll can only be processed from ${twoDaysBeforePayday.toLocaleDateString()} (5 days before payday on ${payday.toLocaleDateString()})`,
      });
    }

    const payrollId = searchParams.get("payrollId");

    // ... (Date check logic remains)

    // If we are editing a specific payroll (payrollId provided), we bypass the "already processed" check
    // because we are likely updating existing records, not looking for missed workers.
    if (payrollId) {
       return NextResponse.json({
        canProcess: true,
        message: `Editing Mode: Payroll updates allowed.`,
      });
    }

    // --- 2. Unpaid Worker Check (Smart Filtering) ---

    const existingPayments = await db.payment.findMany({
      where: {
        Payroll: {
          month: month,
        },
      },
      select: {
        employeeId: true,
        freeLancerId: true,
      },
    });

    const paidWorkerIds = new Set(
      existingPayments
        .flatMap((p) => [p.employeeId, p.freeLancerId])
        .filter(Boolean) as string[]
    );

    // B. Check if there is AT LEAST ONE active Employee who hasn't been paid
    // AND was hired on or before the end of this payroll month
    const unpaidEmployee = await db.employee.findFirst({
      where: {
        status: "ACTIVE",
        hireDate: { lte: payrollMonthEnd },
        id: { notIn: Array.from(paidWorkerIds) },
      },
      select: { id: true },
    });

    // C. Check if there is AT LEAST ONE active Freelancer who hasn't been paid
    const unpaidFreelancer = await db.freeLancer.findFirst({
      where: {
        status: "ACTIVE",
        hireDate: { lte: payrollMonthEnd },
        id: { notIn: Array.from(paidWorkerIds) },
      },
      select: { id: true },
    });

    // If NO unpaid workers found, block processing
    if (!unpaidEmployee && !unpaidFreelancer) {
      return NextResponse.json({
        canProcess: false,
        message: `Payroll for ${month} has already been fully processed for all active workers.`,
      });
    }

    // If we have unpaid workers, allow processing (Supplementary Run)
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
