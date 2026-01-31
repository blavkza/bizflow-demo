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
import { sendPushNotification } from "@/lib/expo";

// Validation Schema
const payrollSchema = z.object({
  description: z.string().optional(),
  type: z.nativeEnum(PaymentType),
  month: z.string(),
  workerType: z.enum(["all", "employees", "freelancers"]).default("all"),
  employees: z.array(
    z.object({
      id: z.string(),
      amount: z.union([z.number(), z.string()]).transform((val) => Number(val)),
      netAmount: z
        .union([z.number(), z.string()])
        .transform((val) => Number(val)),
      baseAmount: z
        .union([z.number(), z.string()])
        .transform((val) => Number(val)),
      overtimeAmount: z
        .union([z.number(), z.string()])
        .transform((val) => Number(val)),
      bonusAmount: z
        .union([z.number(), z.string()])
        .transform((val) => Number(val)),
      deductionAmount: z
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
      // Detailed line items
      bonuses: z
        .array(
          z.object({
            type: z.string(),
            amount: z.number(),
            description: z.string().optional(),
          })
        )
        .optional(),
      deductions: z
        .array(
          z.object({
            type: z.string(),
            amount: z.number(),
            description: z.string().optional(),
          })
        )
        .optional(),
    })
  ),
  totalAmount: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val)),
  netAmount: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  totalBonuses: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .optional()
    .default(0),
  totalDeductions: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .optional()
    .default(0),
  status: z.nativeEnum(PayrollStatus).optional().default(PayrollStatus.PROCESSED),
  payrollId: z.string().optional(),
});

// Helper: Date Logic Check
async function canProcessPayroll(
  month: string,
  isDraft: boolean = false
): Promise<{ canProcess: boolean; message?: string }> {
  try {
    // Drafts ignore date restrictions
    if (isDraft) return { canProcess: true };

    const hrSettings = await db.hRSettings.findFirst();
    if (!hrSettings) {
      return {
        canProcess: true,
        message: "No HR settings found, allowing payroll processing",
      };
    }

    const [year, monthNum] = month.split("-").map(Number);
    const currentDate = new Date();

    let payday = new Date(year, monthNum - 1, hrSettings.paymentDay);

    if (hrSettings.paymentMonth === "FOLLOWING") {
      payday = new Date(year, monthNum, hrSettings.paymentDay);
    }

    const twoDaysBeforePayday = new Date(payday);
    twoDaysBeforePayday.setDate(payday.getDate() - 5);

    if (currentDate < twoDaysBeforePayday) {
      return {
        canProcess: false,
        message: `Payroll can only be processed from ${twoDaysBeforePayday.toLocaleDateString()} (5 days before payday)`,
      };
    }

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
      select: { id: true, name: true },
    });

    if (!creater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payDate = new Date();
    const json = await req.json();
    const data = payrollSchema.parse(json);

    const isDraft = data.status === PayrollStatus.DRAFT;

    // 1. Validation Checks
    const payrollCheck = await canProcessPayroll(data.month, isDraft);
    if (!payrollCheck.canProcess) {
      return NextResponse.json(
        { error: payrollCheck.message },
        { status: 400 }
      );
    }

    // 2. Filter out employees already paid for this month (Duplicate Prevention)
    // Only check if it's NOT a draft, or maybe drafts can be duplicated?
    // Actually, for consistency, we'll keep the check but maybe inform the user.
    const requestedEmployeeIds = data.employees.map((e) => e.id);
    const existingPayments = await db.payment.findMany({
      where: {
        Payroll: { 
          month: data.month,
          status: { not: PayrollStatus.CANCELLED } // Ignore cancelled ones
        },
        OR: [
          { employeeId: { in: requestedEmployeeIds } },
          { freeLancerId: { in: requestedEmployeeIds } },
        ],
      },
      select: { employeeId: true, freeLancerId: true, Payroll: { select: { status: true } } },
    });

    // If it's not a draft, we don't want to pay someone already paid (PROCESSED or PAID status)
    const alreadyPaidIds = new Set(
      existingPayments
        .filter(p => !isDraft || p.Payroll?.status !== PayrollStatus.DRAFT) // If we are saving a draft, we might be overwriting or adding to it, but standard policy is no duplicates across non-cancelled payrolls
        .flatMap((p) => [p.employeeId, p.freeLancerId])
        .filter(Boolean) as string[]
    );

    const employeesToProcess = data.employees.filter(
      (emp) => !alreadyPaidIds.has(emp.id)
    );

    if (employeesToProcess.length === 0) {
      return NextResponse.json(
        {
          error: "All selected workers have already been processed for this month.",
        },
        { status: 400 }
      );
    }

    // 3. Recalculate Totals & Aggregate Bonuses/Deductions for this Batch
    const batchTotals = employeesToProcess.reduce(
      (acc, emp) => ({
        base: acc.base + (emp.baseAmount || 0),
        overtime: acc.overtime + (emp.overtimeAmount || 0),
        bonus: acc.bonus + (emp.bonusAmount || 0),
        deduction: acc.deduction + (emp.deductionAmount || 0),
        total: acc.total + (emp.amount || 0), // Gross
        net: acc.net + (emp.netAmount || 0),
      }),
      { base: 0, overtime: 0, bonus: 0, deduction: 0, total: 0, net: 0 }
    );

    // --- AGGREGATION LOGIC (For Payroll Summary) ---
    // We group bonuses/deductions by type to create the Payroll summary records
    const aggregatedBonuses: Record<
      string,
      { amount: number; description: string }
    > = {};
    const aggregatedDeductions: Record<
      string,
      { amount: number; description: string }
    > = {};

    employeesToProcess.forEach((emp) => {
      // Aggregate Bonuses
      (emp.bonuses || []).forEach((b) => {
        const key = b.type;
        if (!aggregatedBonuses[key]) {
          aggregatedBonuses[key] = {
            amount: 0,
            description: b.description || b.type,
          };
        }
        aggregatedBonuses[key].amount += b.amount || 0;
      });

      // Aggregate Deductions
      (emp.deductions || []).forEach((d) => {
        const key = d.type;
        if (!aggregatedDeductions[key]) {
          aggregatedDeductions[key] = {
            amount: 0,
            description: d.description || d.type,
          };
        }
        aggregatedDeductions[key].amount += d.amount || 0;
      });
    });

    // 4. Ensure Category Exists
    let paymentCategory = await db.category.findFirst({
      where: { name: "Payroll Payments", type: TransactionType.EXPENSE },
    });

    if (!paymentCategory) {
      paymentCategory = await db.category.create({
        data: {
          name: "Payroll Payments",
          type: TransactionType.EXPENSE,
          description: "Payments for Payroll",
          createdBy: creater.id,
        },
      });
    }

    // 5. PROCESS TRANSACTION (The "Big Write")
    const result = await db.$transaction(
      async (prisma) => {
        let transaction;
        let payroll;

        if (data.payrollId) {
          // UPDATE EXISTING
          const existingPayroll = await prisma.payroll.findUnique({
            where: { id: data.payrollId },
            include: { transaction: true }
          });

          if (!existingPayroll) {
            throw new Error("Draft payroll not found");
          }

          // A. Update Transaction
          transaction = await prisma.transaction.update({
            where: { id: existingPayroll.transactionId },
            data: {
              amount: batchTotals.net,
              status: isDraft ? TransactionStatus.PENDING : TransactionStatus.COMPLETED,
              description: data.description || `${isDraft ? "[DRAFT] " : ""}Payroll for ${data.month} (${data.workerType})`,
              reference: existingPayroll.transaction.reference, // Keep same reference
            }
          });

          // B. Delete old relations to start fresh for this run
          await prisma.payment.deleteMany({ where: { payrollId: data.payrollId } });
          await prisma.payrollBonus.deleteMany({ where: { payrollId: data.payrollId } });
          await prisma.payrollDeduction.deleteMany({ where: { payrollId: data.payrollId } });

          // C. Update Payroll Header
          payroll = await prisma.payroll.update({
            where: { id: data.payrollId },
            data: {
              description: data.description || `${isDraft ? "[DRAFT] " : ""}Payroll for ${data.month} (${data.workerType})`,
              type: data.type,
              totalAmount: batchTotals.total,
              netAmount: batchTotals.net,
              baseAmount: batchTotals.base,
              overtimeAmount: batchTotals.overtime,
              totalBonuses: batchTotals.bonus,
              totalDeductions: batchTotals.deduction,
              status: data.status as PayrollStatus,
              
              // RE-CREATE AGGREGATED SUMMARIES
              payrollBonuses: {
                create: Object.entries(aggregatedBonuses).map(([type, data]) => ({
                  bonusType: type,
                  amount: data.amount,
                  description: `Total ${type.replace(/_/g, " ")}`,
                  isPercentage: false,
                })),
              },
              payrollDeductions: {
                create: Object.entries(aggregatedDeductions).map(
                  ([type, data]) => ({
                    deductionType: type,
                    amount: data.amount,
                    description: `Total ${type.replace(/_/g, " ")}`,
                    isPercentage: false,
                  })
                ),
              },
            }
          });
        } else {
          // CREATE NEW
          // A. Create the Financial Transaction Record
          transaction = await prisma.transaction.create({
            data: {
              amount: batchTotals.net, // Actual cash flow out
              currency: "ZAR",
              type: TransactionType.EXPENSE,
              status: isDraft ? TransactionStatus.PENDING : TransactionStatus.COMPLETED,
              description:
                data.description ||
                `${isDraft ? "[DRAFT] " : ""}Payroll for ${data.month} (${data.workerType})`,
              date: payDate,
              createdBy: creater.id,
              categoryId: paymentCategory!.id,
              reference: `PAYROLL-${Date.now()}${isDraft ? "-DRAFT" : ""}`,
            },
          });

          // B. Create the Payroll Header Record with Nested Summaries
          payroll = await prisma.payroll.create({
            data: {
              month: data.month,
              description:
                data.description ||
                `${isDraft ? "[DRAFT] " : ""}Payroll for ${data.month} (${data.workerType})`,
              type: data.type,
              totalAmount: batchTotals.total,
              netAmount: batchTotals.net,
              baseAmount: batchTotals.base,
              overtimeAmount: batchTotals.overtime,
              totalBonuses: batchTotals.bonus,
              totalDeductions: batchTotals.deduction,
              currency: "ZAR",
              status: data.status as PayrollStatus,
              transactionId: transaction.id,
              createdBy: creater.id,

              // CREATE AGGREGATED SUMMARIES (Payroll Level)
              payrollBonuses: {
                create: Object.entries(aggregatedBonuses).map(([type, data]) => ({
                  bonusType: type,
                  amount: data.amount,
                  description: `Total ${type.replace(/_/g, " ")}`,
                  isPercentage: false,
                })),
              },
              payrollDeductions: {
                create: Object.entries(aggregatedDeductions).map(
                  ([type, data]) => ({
                    deductionType: type,
                    amount: data.amount,
                    description: `Total ${type.replace(/_/g, " ")}`,
                    isPercentage: false,
                  })
                ),
              },
            },
          });
        }


        // C. Create Individual Payments with DETAILED LISTED Bonuses & Deductions
        const payments = await Promise.all(
          employeesToProcess.map(async (employee) => {
            const paymentData: any = {
              amount: employee.amount,
              netAmount: employee.netAmount,
              baseAmount: employee.baseAmount || 0,
              overtimeAmount: employee.overtimeAmount || 0,
              bonusAmount: employee.bonusAmount || 0,
              deductionAmount: employee.deductionAmount || 0,
              type: data.type,
              description: employee.description || `Salary for ${data.month}`,
              payDate: payDate,
              status: isDraft ? "PENDING" : "PAID",
              daysWorked: employee.daysWorked,
              overtimeHours: employee.overtimeHours || 0,
              regularHours: employee.regularHours || 0,
              createdBy: userId,
              transactionId: transaction.id,
              payrollId: payroll.id,

              // --- KEY STEP: CREATE INDIVIDUAL LINE ITEMS ---
              // This ensures each employee has their own list of bonuses/deductions saved
              paymentBonuses: {
                create: (employee.bonuses || []).map((bonus: any) => ({
                  bonusType: bonus.type,
                  amount: bonus.amount,
                  description: bonus.description,
                })),
              },

              paymentDeductions: {
                create: (employee.deductions || []).map((deduction: any) => ({
                  deductionType: deduction.type,
                  amount: deduction.amount,
                  description: deduction.description,
                })),
              },
            };

            // Link to correct worker type
            if (employee.isFreelancer) {
              paymentData.freeLancerId = employee.id;
            } else {
              paymentData.employeeId = employee.id;
            }

            return prisma.payment.create({
              data: paymentData,
            });
          })
        );

        return { payroll, transaction, payments };
      },
      {
        timeout: 30000,
        maxWait: 30000,
      }
    );

    // 6. Send Notifications (Push & In-App) - ONLY if NOT a draft
    if (!isDraft) {
      const employeesCount = employeesToProcess.filter(
        (e: any) => !e.isFreelancer
      ).length;
      const freelancersCount = employeesToProcess.filter(
        (e: any) => e.isFreelancer
      ).length;

      // Admin Notification
      await db.notification.create({
        data: {
          title: "New Payroll Created",
          message: `Payroll for ${data.month} created. ${employeesCount} Emp, ${freelancersCount} Free. Total Net: ${batchTotals.net.toLocaleString(
            "en-ZA",
            { style: "currency", currency: "ZAR" }
          )}`,
          type: "PAYMENT",
          isRead: false,
          actionUrl: `/dashboard/payroll`,
          userId: creater.id,
        },
      });

      // Employee Notifications
      if (result.payments && result.payments.length > 0) {
        // Process notifications asynchronously so we don't hold up the response
        (async () => {
          for (const payment of result.payments) {
            const workerId = payment.employeeId || payment.freeLancerId;
            if (!workerId) continue;

            const formattedAmount = Number(payment.netAmount).toLocaleString(
              "en-ZA",
              { style: "currency", currency: "ZAR" }
            );

            // A. Push Notification
            try {
              await sendPushNotification({
                employeeId: workerId,
                title: "Payslip Ready",
                body: `Your payslip for ${data.month} is ready. Net Pay: ${formattedAmount}`,
                data: {
                  paymentId: payment.id,
                  url: `/dashboard/payslips/${payment.id}`,
                },
              });
            } catch (e) {
              console.warn(`Push failed for ${workerId}`, e);
            }

            // B. In-App Notification (Employee Portal)
            try {
              await db.employeeNotification.create({
                data: {
                  employeeId: workerId,
                  title: "Payslip Ready",
                  message: `Your payslip for ${data.month} has been generated. Net Pay: ${formattedAmount}.`,
                  type: "PAYMENT",
                  isRead: false,
                  actionUrl: `/dashboard/payslips/${payment.id}`,
                },
              });
            } catch (e) {
              console.warn(`Employee notification failed for ${workerId}`, e);
            }
          }
        })();
      }
    }

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
