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
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.amount || data.amount <= 0) {
      return NextResponse.json(
        { error: "Valid payment amount is required" },
        { status: 400 }
      );
    }

    if (!data.paymentDate) {
      return NextResponse.json(
        { error: "Payment date is required" },
        { status: 400 }
      );
    }

    // Get the expense to validate and update
    const expense = await db.expense.findUnique({
      where: {
        id: params.id,
      },
      include: {
        payments: true,
        Vendor: true,
      },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const paymentAmount = parseFloat(data.amount);

    // Convert Decimal values to numbers for comparison
    const remainingAmount = parseFloat(expense.remainingAmount.toString());
    const totalAmount = parseFloat(expense.totalAmount.toString());
    const currentPaidAmount = parseFloat(expense.paidAmount.toString());

    // Validate payment amount doesn't exceed remaining amount
    if (paymentAmount > remainingAmount) {
      return NextResponse.json(
        { error: "Payment amount exceeds remaining balance" },
        { status: 400 }
      );
    }

    // Calculate new amounts
    const newPaidAmount = currentPaidAmount + paymentAmount;
    const newRemainingAmount = totalAmount - newPaidAmount;

    // Determine new status
    let newStatus: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED" =
      expense.status;
    if (newPaidAmount === totalAmount) {
      newStatus = "PAID";
    } else if (newPaidAmount > 0) {
      newStatus = "PARTIAL";
    }

    // Check if due date is in the past and status is not paid
    const dueDate = new Date(expense.dueDate);
    const today = new Date();
    if (dueDate < today && newStatus !== "PAID") {
      newStatus = "OVERDUE";
    }

    // Generate payment reference
    const paymentCount = expense.payments.length + 1;
    const paymentReference = `PAY-${expense.expenseNumber}-${String(paymentCount).padStart(3, "0")}`;

    // Generate transaction reference
    const transactionReference = `TXN-${paymentReference}`;

    const result = await db.$transaction(
      async (tx) => {
        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            amount: paymentAmount,
            currency: "ZAR",
            type: "EXPENSE",
            status: "COMPLETED",
            description: `Payment for expense: ${expense.expenseNumber}`,
            reference: transactionReference,
            date: new Date(data.paymentDate),
            method: data.method || "BANK_TRANSFER",
            invoiceId: expense.invoiceId || null,
            categoryId: expense.categoryId || null,
            vendor: expense.Vendor?.name || null,
            taxAmount: 0,
            taxRate: 0,
            netAmount: paymentAmount,
            createdBy: user.id,
            receiptUrl: null,
            isReconciled: false,
          },
        });

        // Create expense payment record
        const expensePayment = await tx.expensePayment.create({
          data: {
            expenseId: expense.id,
            transactionId: transaction.id,
            amount: paymentAmount,
            paymentDate: new Date(data.paymentDate),
            method: data.method || "BANK_TRANSFER",
            reference: data.reference || paymentReference,
            status: "PAID",
            paidBy: user.name || "System",
            notes:
              data.notes ||
              `Payment recorded for expense ${expense.expenseNumber}`,
          },
        });

        // Update expense with new amounts and status
        const updatedExpense = await tx.expense.update({
          where: {
            id: params.id,
          },
          data: {
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
            status: newStatus,
            paidDate:
              newStatus === "PAID"
                ? new Date(data.paymentDate)
                : expense.paidDate,
            updatedAt: new Date(),
          },
        });

        return {
          expensePayment,
          transaction,
          updatedExpense,
        };
      },
      {
        maxWait: 10000,
        timeout: 10000,
      }
    );

    // Fetch the complete expense with all relations
    const completeExpense = await db.expense.findUnique({
      where: { id: params.id },
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
          include: {
            transaction: {
              select: {
                id: true,
                reference: true,
                date: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(completeExpense);
  } catch (error) {
    console.error("Failed to record payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to fetch payments for an expense
export async function GET(
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
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the expense belongs to the user
    const expense = await db.expense.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Fetch payments for this expense
    const payments = await db.expensePayment.findMany({
      where: {
        expenseId: params.id,
      },
      include: {
        transaction: {
          select: {
            id: true,
            reference: true,
            date: true,
            method: true,
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
