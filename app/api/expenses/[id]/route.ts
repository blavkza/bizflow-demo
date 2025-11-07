import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

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

    const expense = await db.expense.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
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
          include: {
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
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Failed to fetch expense:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Check if due date is in the past and status is not paid
    const dueDate = new Date(data.dueDate);
    const today = new Date();
    if (dueDate < today && status !== "PAID") {
      status = "OVERDUE";
    }

    const priority: "LOW" | "MEDIUM" | "HIGH" = data.priority || "MEDIUM";

    const expense = await db.expense.update({
      where: {
        id: params.id,
        userId: user.id,
      },
      data: {
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
        projectId: data.projectId || null,
        accountCode: data.accountCode || null,
        projectCode: data.projectCode || null,
      },
      include: {
        category: true,
        Vendor: true,
        Invoice: {
          include: {
            Project: true,
          },
        },
        Project: true,
        payments: true,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Failed to update expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await db.expense.delete({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
