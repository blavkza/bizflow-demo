import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { DocumentType } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const { amount, date, reference, notes, type } = body;

    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 401 });
    }

    const payment = await db.$transaction(
      async (tx) => {
        // Find or create category
        let category = await tx.category.findFirst({
          where: { name: "Loan Repayment", type: "EXPENSE" },
        });

        if (!category) {
          category = await tx.category.create({
            data: {
              name: "Loan Repayment",
              type: "EXPENSE",
              description: "Payments made towards loans",
              createdBy: user.id,
            },
          });
        }

        const loan = await tx.loan.findUnique({
          where: { id },
        });

        if (!loan) {
          throw new Error("Loan not found during payment processing");
        }

        const newPayment = await tx.loanPayment.create({
          data: {
            loanId: id,
            amount: parseFloat(amount),
            date: new Date(date),
            reference,
            notes,
            type,
            createdBy: user.id,
          },
        });

        // Create document records if attachments provided
        if (body.attachments && Array.isArray(body.attachments)) {
          for (const att of body.attachments) {
            await tx.document.create({
              data: {
                name: att.name || att.filename,
                url: att.url,
                type: (Object.values(DocumentType) as string[]).includes(
                  att.type,
                )
                  ? (att.type as any)
                  : "OTHER",
                size: att.size,
                mimeType: att.mimeType,
                loanPaymentId: newPayment.id,
              },
            });
          }
        }

        await tx.transaction.create({
          data: {
            amount: parseFloat(amount),
            type: "EXPENSE",
            status: "COMPLETED",
            description: `Loan Repayment: ${loan.lender}`,
            reference,
            date: new Date(date),
            method: "BANK_TRANSFER",
            loanId: id, // Link to loan
            loanPaymentId: newPayment.id, // Link to specific payment
            createdBy: user.id,
            categoryId: category.id,
          },
        });

        // Check if loan should be marked as PAID_OFF
        const allPayments = await tx.loanPayment.findMany({
          where: { loanId: id },
          select: { amount: true },
        });

        const totalPaid = allPayments.reduce((acc, p) => acc + p.amount, 0);

        if (loan.totalPayable && totalPaid >= loan.totalPayable) {
          await tx.loan.update({
            where: { id },
            data: { status: "PAID_OFF" },
          });
        }

        return newPayment;
      },
      {
        timeout: 20000, // Increase timeout to 20 seconds
      },
    );

    return NextResponse.json(payment);
  } catch (error) {
    console.log("[LOAN_PAYMENT_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
