import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  PaymentType,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
} from "@prisma/client";
import { z } from "zod";

const payrollSchema = z.object({
  description: z.string().optional(),
  type: z.nativeEnum(PaymentType),
  employees: z.array(
    z.object({
      id: z.string(),
      amount: z.union([z.number(), z.string()]).transform((val) => Number(val)),
      departmentId: z.string().optional(),
    })
  ),
  totalAmount: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val)),
});

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
            data.description || `Payroll for ${payDate.toLocaleDateString()}`,
          date: payDate,
          createdBy: creater.id,
          reference: `PAYROLL-${Date.now()}`,
        },
      });

      // Create payments for each employee
      const payments = await Promise.all(
        data.employees.map((employee) =>
          prisma.payment.create({
            data: {
              employeeId: employee.id,
              amount: employee.amount,
              type: data.type,
              description:
                data.description ||
                `Salary payment for ${payDate.toLocaleDateString()}`,
              payDate: payDate,

              createdBy: userId,
              transactionId: transaction.id,
            },
          })
        )
      );

      return { transaction, payments };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
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

    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch employees", error },
      { status: 500 }
    );
  }
}
