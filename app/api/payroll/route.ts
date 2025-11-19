import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  PaymentType,
  TransactionType,
  TransactionStatus,
  PayrollStatus,
} from "@prisma/client";
import { z } from "zod";

const payrollSchema = z.object({
  description: z.string().optional(),
  type: z.nativeEnum(PaymentType),
  month: z.string(),
  workerType: z.enum(["all", "employees", "freelancers"]).default("all"),
  employees: z.array(
    z.object({
      id: z.string(),
      amount: z.union([z.number(), z.string()]).transform((val) => Number(val)),
      baseAmount: z
        .union([z.number(), z.string()])
        .transform((val) => Number(val)),
      overtimeAmount: z
        .union([z.number(), z.string()])
        .transform((val) => Number(val)),
      daysWorked: z.number(),
      overtimeHours: z
        .union([z.number(), z.string()])
        .transform((val) => Number(val)),
      regularHours: z
        .union([z.number(), z.string()])
        .transform((val) => Number(val)),
      description: z.string().optional(),
      departmentId: z.string().optional(),
      isFreelancer: z.boolean().optional(),
    })
  ),
  totalAmount: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val)),
});

async function canProcessPayroll(
  month: string
): Promise<{ canProcess: boolean; message?: string }> {
  try {
    // Get HR settings
    const hrSettings = await db.hRSettings.findFirst();
    if (!hrSettings) {
      return {
        canProcess: true,
        message: "No HR settings found, allowing payroll processing",
      };
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

    // Check if payroll already exists for this month using the new Payroll model
    const existingPayroll = await db.payroll.findFirst({
      where: {
        month: month,
        status: {
          in: [PayrollStatus.PROCESSED, PayrollStatus.PAID],
        },
      },
    });

    if (existingPayroll) {
      return {
        canProcess: false,
        message: `Payroll for ${month} has already been processed`,
      };
    }

    // Calculate 2 days before payday
    const twoDaysBeforePayday = new Date(payday);
    twoDaysBeforePayday.setDate(payday.getDate() - 2);

    // Check current date against payday rules
    if (currentDate < twoDaysBeforePayday) {
      return {
        canProcess: false,
        message: `Payroll can only be processed from ${twoDaysBeforePayday.toLocaleDateString()} (2 days before payday)`,
      };
    }

    // If we're after payday, allow processing (since no payroll exists for the month)
    return { canProcess: true };
  } catch (error) {
    console.error("Error checking payroll processing rules:", error);
    return {
      canProcess: true,
      message: "Error checking rules, allowing processing",
    };
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const creater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payDate = new Date();

    const json = await req.json();
    const data = payrollSchema.parse(json);

    // Check if payroll can be processed based on payday rules
    const payrollCheck = await canProcessPayroll(data.month);
    if (!payrollCheck.canProcess) {
      return NextResponse.json(
        { error: payrollCheck.message },
        { status: 400 }
      );
    }

    // Start a transaction
    const result = await db.$transaction(async (prisma) => {
      // Create the main payroll transaction
      const transaction = await prisma.transaction.create({
        data: {
          amount: data.totalAmount,
          currency: "ZAR",
          type: TransactionType.EXPENSE,
          status: TransactionStatus.COMPLETED,
          description:
            data.description ||
            `Payroll for ${data.month} (${data.workerType})`,
          date: payDate,
          createdBy: creater.id,
          reference: `PAYROLL-${Date.now()}`,
        },
      });

      // Calculate totals for payroll record
      const totalBaseAmount = data.employees.reduce((sum, employee) => {
        return sum + (employee.baseAmount || 0);
      }, 0);

      const totalOvertimeAmount = data.employees.reduce((sum, employee) => {
        return sum + (employee.overtimeAmount || 0);
      }, 0);

      // Create the payroll record with detailed amounts
      const payroll = await prisma.payroll.create({
        data: {
          month: data.month,
          description:
            data.description ||
            `Payroll for ${data.month} (${data.workerType})`,
          type: data.type,
          totalAmount: data.totalAmount,
          baseAmount: totalBaseAmount,
          overtimeAmount: totalOvertimeAmount,
          currency: "ZAR",
          status: PayrollStatus.PROCESSED,
          transactionId: transaction.id,
          createdBy: creater.id,
        },
      });

      // Create payments for each worker (employee or freelancer)
      const payments = await Promise.all(
        data.employees.map(async (employee) => {
          const paymentData: any = {
            amount: employee.amount,
            baseAmount: employee.baseAmount || 0,
            overtimeAmount: employee.overtimeAmount || 0,
            type: data.type,
            description:
              employee.description ||
              `Salary payment for ${data.month} - ${employee.daysWorked} days worked, ${employee.overtimeHours || 0}h overtime`,
            payDate: payDate,
            daysWorked: employee.daysWorked,
            overtimeHours: employee.overtimeHours || 0,
            regularHours: employee.regularHours || 0,
            createdBy: userId,
            transactionId: transaction.id,
            payrollId: payroll.id,
          };

          // Set either employeeId or freeLancerId based on worker type
          if (employee.isFreelancer) {
            paymentData.freeLancerId = employee.id;
          } else {
            paymentData.employeeId = employee.id;
          }

          return await prisma.payment.create({
            data: paymentData,
          });
        })
      );

      return { payroll, transaction, payments };
    });

    // Count employees and freelancers for the notification
    const employeesCount = data.employees.filter(
      (emp: any) => !emp.isFreelancer
    ).length;
    const freelancersCount = data.employees.filter(
      (emp: any) => emp.isFreelancer
    ).length;

    await db.notification.create({
      data: {
        title: "New Payroll Created",
        message: `Payroll for ${data.month} (${data.workerType}) has been created by ${creater.name}. ${employeesCount} employees, ${freelancersCount} freelancers.`,
        type: "PAYMENT",
        isRead: false,
        actionUrl: `/dashboard/payroll`,
        userId: creater.id,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Payroll processing error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const employees = await db.employee.findMany({
      include: {
        department: {
          include: {
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
            payDate: true,
          },
        },
      },
    });

    const freelancers = await db.freeLancer.findMany({
      include: {
        department: {
          include: {
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
            payDate: true,
          },
        },
      },
    });

    const employeesWithType = employees.map((emp) => ({
      ...emp,
      isFreelancer: false,
    }));

    const freelancersWithType = freelancers.map((freelancer) => ({
      ...freelancer,
      isFreelancer: true,
    }));

    const allWorkers = [...employeesWithType, ...freelancersWithType];

    return NextResponse.json(allWorkers);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch workers", error },
      { status: 500 }
    );
  }
}
