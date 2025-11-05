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
    });

    if (!user) {
      return new NextResponse("User Not Found", { status: 401 });
    }

    const rentalId = params.id;
    const { amount, method, reference, notes } = await request.json();

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid payment amount is required" },
        { status: 400 }
      );
    }

    if (!method) {
      return NextResponse.json(
        { error: "Payment method is required" },
        { status: 400 }
      );
    }

    // Get current rental with related data
    const rental = await db.toolRental.findUnique({
      where: { id: rentalId },
      include: {
        quotation: {
          include: {
            client: true,
          },
        },
        invoice: true,
        tool: true,
      },
    });

    if (!rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 });
    }

    if (!rental.invoice) {
      return NextResponse.json(
        { error: "No invoice found for this rental" },
        { status: 400 }
      );
    }

    // Start a transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // 1. Update rental payment status
      const newAmountPaid = rental.amountPaid + amount;
      const totalCost = Number(rental.totalCost) || 0;
      const remainingAmount = totalCost - newAmountPaid;

      let paymentStatus = rental.paymentStatus;
      if (newAmountPaid >= totalCost) {
        paymentStatus = "PAID";
      } else if (newAmountPaid > 0) {
        paymentStatus = "PAID";
      }

      const updatedRental = await tx.toolRental.update({
        where: { id: rentalId },
        data: {
          amountPaid: newAmountPaid,
          remainingAmount,
          paymentStatus,
          paidDate: newAmountPaid >= totalCost ? new Date() : undefined,
        },
        include: {
          tool: true,
          quotation: {
            include: {
              client: true,
            },
          },
          invoice: true,
        },
      });

      // 2. Create InvoicePayment
      const invoicePayment = await tx.invoicePayment.create({
        data: {
          invoiceId: rental.invoice!.id,
          amount,
          currency: "ZAR",
          method,
          reference: rental.invoice?.invoiceNumber,
          notes,
          status: "COMPLETED",
          paidAt: new Date(),
        },
      });

      const outStanding = invoicePayment.amount === rental.invoice?.totalAmount;

      const invoiceStatus = outStanding ? "PAID" : "PARTIALLY_PAID";

      const upadeteInvoiceStatus = await db.invoice.update({
        where: { id: rental?.invoice?.id },
        data: { status: invoiceStatus },
      });

      // 3. Create Transaction record
      const transaction = await tx.transaction.create({
        data: {
          amount,
          currency: "ZAR",
          type: "INCOME",
          status: "COMPLETED",
          description: `Payment for tool rental: ${rental.tool.name} - ${rental.businessName}`,
          reference: invoicePayment.reference,
          date: new Date(),
          method,
          invoiceId: rental.invoice!.id,
          clientId: rental.quotation?.clientId,
          createdBy: user.id,
          taxAmount: 0,
          netAmount: amount,
          vendor: rental.businessName,
          invoiceNumber: rental.invoice!.invoiceNumber,
        },
      });

      // 4. Update invoice status if fully paid
      if (newAmountPaid >= totalCost) {
        await tx.invoice.update({
          where: { id: rental.invoice!.id },
          data: {
            status: "PAID",
            paidDate: new Date(),
          },
        });
      }

      return {
        rental: updatedRental,
        invoicePayment,
        transaction,
        upadeteInvoiceStatus,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
