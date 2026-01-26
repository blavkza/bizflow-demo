import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const payroll = await db.payroll.findUnique({
      where: {
        id: params.id,
      },
      include: {
        transaction: {
          select: {
            id: true,
            reference: true,
            date: true,
            description: true,
            amount: true,
            currency: true,
          },
        },

        payments: {
          include: {
            employee: {
              select: {
                id: true,
                employeeNumber: true,
                firstName: true,
                lastName: true,
                position: true,
                salaryType: true,
                dailySalary: true,
                monthlySalary: true,
                department: {
                  select: {
                    name: true,
                    id: true,
                  },
                },
              },
            },
            freeLancer: {
              select: {
                id: true,
                freeLancerNumber: true,
                firstName: true,
                lastName: true,
                position: true,
                salary: true,
                department: {
                  select: {
                    name: true,
                    id: true,
                  },
                },
              },
            },
          },
        },

        _count: {
          select: {
            payments: true,
          },
        },
      },
    });

    if (!payroll) {
      return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
    }

    const creator = await db.user.findUnique({
      where: { userId: payroll.createdBy || "" },
      select: { name: true },
    });

    const processedPayments = payroll.payments.map((payment) => {
      const worker = payment.employee || payment.freeLancer;
      const isFreelancer = !!payment.freeLancerId;

      // Calculate appropriate salary for display
      let displaySalary = 0;
      if (isFreelancer) {
        // Freelancers use salary field
        displaySalary = payment.freeLancer?.salary
          ? Number(payment.freeLancer.salary)
          : 0;
      } else {
        // Employees use dailySalary or monthlySalary based on salaryType
        if (payment.employee?.salaryType === "DAILY") {
          displaySalary = payment.employee.dailySalary
            ? Number(payment.employee.dailySalary)
            : 0;
        } else {
          displaySalary = payment.employee?.monthlySalary
            ? Number(payment.employee.monthlySalary)
            : 0;
        }
      }

      return {
        ...payment,
        // Convert Decimal to number for easier handling
        amount: payment.amount ? Number(payment.amount) : 0,
        baseAmount: payment.baseAmount ? Number(payment.baseAmount) : 0,
        overtimeAmount: payment.overtimeAmount
          ? Number(payment.overtimeAmount)
          : 0,
        overtimeHours: payment.overtimeHours
          ? Number(payment.overtimeHours)
          : 0,
        regularHours: payment.regularHours ? Number(payment.regularHours) : 0,
        daysWorked: payment.daysWorked || 0,
        worker: worker
          ? {
              ...worker,
              isFreelancer,
              workerNumber: isFreelancer
                ? (worker as any).freeLancerNumber
                : (worker as any).employeeNumber,
              salary: displaySalary,
              salaryType: isFreelancer ? "DAILY" : payment.employee?.salaryType,
            }
          : null,
      };
    });

    return NextResponse.json({
      ...payroll,
      createdByName: creator?.name || "Unknown",
      payments: processedPayments,
    });
  } catch (error) {
    console.error("Failed to fetch payroll:", error);
    return NextResponse.json(
      { error: "Failed to fetch payroll" },
      { status: 500 }
    );
  }
}
