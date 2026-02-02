import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const payment = await db.loanPayment.findUnique({
      where: { id },
      include: {
        loan: true,
        documents: true,
        creator: true,
      },
    });

    if (!payment) {
      return new NextResponse("Payment not found", { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.log("[LOAN_PAYMENT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    // Check if user has permission (can be improved with RBAC check)
    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true, permissions: true, role: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 401 });
    }

    const hasPermission =
      user.permissions.includes("LOAN_PAYMENTS_DELETE") ||
      user.role === "CHIEF_EXECUTIVE_OFFICER" ||
      user.role === "ADMIN";

    if (!hasPermission) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const payment = await db.loanPayment.findUnique({
      where: { id },
      include: {
        transactions: true,
      },
    });

    if (!payment) {
      return new NextResponse("Payment not found", { status: 404 });
    }

    await db.$transaction(async (tx) => {
      // Delete associated transactions
      if (payment.transactions.length > 0) {
        await tx.transaction.deleteMany({
          where: {
            id: {
              in: payment.transactions.map((t) => t.id),
            },
          },
        });
      }

      // Delete the payment
      await tx.loanPayment.delete({
        where: { id },
      });

      // Check if loan status should be reverted to ACTIVE
      const loan = await tx.loan.findUnique({
        where: { id: payment.loanId },
        include: { payments: true },
      });

      if (loan && loan.status === "PAID_OFF") {
        const totalPaid = loan.payments.reduce((acc, p) => acc + p.amount, 0);
        if (loan.totalPayable && totalPaid < loan.totalPayable) {
          await tx.loan.update({
            where: { id: loan.id },
            data: { status: "ACTIVE" },
          });
        }
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.log("[LOAN_PAYMENT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
