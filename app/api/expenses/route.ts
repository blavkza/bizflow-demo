import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all expenses for the user without filtering
    const expenses = await db.expense.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            type: true,
          },
        },
        Vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        Invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            Project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        Project: {
          select: {
            id: true,
            title: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();

    // Calculate remaining amount and determine status
    const totalAmount = parseFloat(data.totalAmount);
    const paidAmount = parseFloat(data.paidAmount) || 0;
    const remainingAmount = totalAmount - paidAmount;

    let status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" = "PENDING";
    if (paidAmount === totalAmount) {
      status = "PAID";
    } else if (paidAmount > 0) {
      status = "PARTIAL";
    }

    const dueDate = new Date(data.dueDate);
    const today = new Date();
    if (dueDate < today && status !== "PAID") {
      status = "OVERDUE";
    }

    const priority: "LOW" | "MEDIUM" | "HIGH" = data.priority || "MEDIUM";

    // Generate expense number
    const lastExpense = await db.expense.findFirst({
      orderBy: { createdAt: "desc" },
      select: { expenseNumber: true },
    });

    const expenseNumber = lastExpense?.expenseNumber
      ? `EXP-${String(parseInt(lastExpense.expenseNumber.split("-")[1]) + 1).padStart(4, "0")}`
      : "EXP-0001";

    let projectIdFromInvoice = null;
    if (data.invoiceId) {
      const invoice = await db.invoice.findUnique({
        where: {
          id: data.invoiceId,
        },
        include: {
          Project: true,
        },
      });

      if (invoice?.Project?.id) {
        projectIdFromInvoice = invoice.Project.id;
      }
    }

    const result = await db.$transaction(
      async (tx) => {
        const expense = await tx.expense.create({
          data: {
            expenseNumber: expenseNumber,
            description: data.description,
            categoryId: data.categoryId,
            vendorId: data.vendorId,
            vendorEmail: data.vendorEmail || null,
            vendorPhone: data.vendorPhone || null,
            totalAmount: totalAmount,
            paidAmount: paidAmount,
            remainingAmount: remainingAmount,
            status: status,
            priority: priority,
            expenseDate: new Date(data.expenseDate),
            dueDate: dueDate,
            paidDate: data.paidDate ? new Date(data.paidDate) : null,
            paymentMethod: data.paymentMethod || null,
            notes: data.notes || null,
            invoiceId: data.invoiceId || null,
            projectId: projectIdFromInvoice || data.projectId || null,
            accountCode: data.accountCode || null,
            projectCode: data.projectCode || null,
            userId: user.id,
          },
        });

        if (paidAmount > 0) {
          const paymentStatus =
            paidAmount === totalAmount ? "COMPLETED" : "PARTIAL";
          const paymentReference = `PAY-${expenseNumber}-001`;

          const transaction = await tx.transaction.create({
            data: {
              amount: paidAmount,
              currency: "ZAR",
              type: "EXPENSE",
              status: "COMPLETED",
              description: `Payment for expense: ${data.description}`,
              reference: `TXN-${paymentReference}`,
              date: data.paidDate ? new Date(data.paidDate) : new Date(),
              method: data.paymentMethod || "BANK_TRANSFER",
              invoiceId: data.invoiceId || null,
              categoryId: data.categoryId || null,
              vendor: data.vendorId
                ? (
                    await tx.vendor.findUnique({
                      where: { id: data.vendorId },
                      select: { name: true },
                    })
                  )?.name
                : null,
              taxAmount: 0,
              taxRate: 0,
              netAmount: paidAmount,
              invoiceNumber: data.invoiceId
                ? (
                    await tx.invoice.findUnique({
                      where: { id: data.invoiceId },
                      select: { invoiceNumber: true },
                    })
                  )?.invoiceNumber
                : null,
              createdBy: user.id,
              receiptUrl: null,
              isReconciled: false,
            },
          });

          await tx.expensePayment.create({
            data: {
              expenseId: expense.id,
              transactionId: transaction.id,
              amount: paidAmount,
              paymentDate: data.paidDate ? new Date(data.paidDate) : new Date(),
              method: data.paymentMethod || "BANK_TRANSFER",
              reference: paymentReference,
              status: "PAID",
              paidBy: user.name || "System",
              notes: `Initial payment for expense ${expenseNumber}`,
            },
          });
        }

        return expense.id;
      },
      {
        maxWait: 10000,
        timeout: 10000,
      }
    );

    const completeExpense = await db.expense.findUnique({
      where: { id: result },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        Vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        Invoice: {
          include: {
            Project: true,
          },
        },
        Project: true,
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
      },
    });

    return NextResponse.json(completeExpense);
  } catch (error) {
    console.error("Failed to create expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
