import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const payment = await db.payment.findUnique({
      where: { id: params.id },
      include: {
        employee: true,
        freeLancer: true,
        paymentBonuses: true,
        paymentDeductions: true,
        Payroll: {
          select: {
            description: true,
            month: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const hr = await db.hRSettings.findFirst();

    if (!hr) {
      return NextResponse.json({ error: "hr not found" }, { status: 404 });
    }

    // Combine employee/freelancer data
    const worker = payment.employee || payment.freeLancer;
    const workerWithRate = worker
      ? {
          ...worker,
          ratePerHour: payment.employee?.dailySalary
            ? Number(payment.employee.dailySalary) / hr.workingHoursPerDay
            : payment.freeLancer?.salary
              ? Number(payment.freeLancer.salary)
              : 0,
        }
      : undefined;

    // Mock company data - you should get this from your settings
    const company = await db.generalSetting.findFirst();

    if (!company) {
      return NextResponse.json({ error: "company not found" }, { status: 404 });
    }

    const responseData = {
      ...payment,
      worker: workerWithRate,
      company,
      amount: Number(payment.amount),
      netAmount: Number(payment.netAmount),
      baseAmount: Number(payment.baseAmount),
      overtimeAmount: Number(payment.overtimeAmount),
      bonusAmount: Number(payment.bonusAmount),
      deductionAmount: Number(payment.deductionAmount),
      overtimeHours: payment.overtimeHours ? Number(payment.overtimeHours) : 0,
      regularHours: payment.regularHours ? Number(payment.regularHours) : 0,
      paymentBonuses: payment.paymentBonuses.map((bonus) => ({
        ...bonus,
        amount: Number(bonus.amount),
      })),
      paymentDeductions: payment.paymentDeductions.map((deduction) => ({
        ...deduction,
        amount: Number(deduction.amount),
      })),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Failed to fetch payment:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 },
    );
  }
}
