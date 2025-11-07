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
    const result = await db.$transaction(
      async (tx) => {
        // 1. Check if "RENTAL_INCOME" category exists, create if not
        let rentalIncomeCategory = await tx.category.findFirst({
          where: {
            name: "RENTAL_INCOME",
            type: "INCOME",
          },
        });

        if (!rentalIncomeCategory) {
          rentalIncomeCategory = await tx.category.create({
            data: {
              name: "RENTAL_INCOME",
              description: "Income from tool rentals and equipment leasing",
              type: "INCOME",
              createdBy: user.id,
            },
          });
          console.log(
            "Created new RENTAL_INCOME category:",
            rentalIncomeCategory.id
          );
        }

        // 2. Update rental payment status
        const newAmountPaid = Number(rental.amountPaid) + Number(amount);
        const totalCost = Number(rental.totalCost) || 0;
        const remainingAmount = totalCost - newAmountPaid;

        let paymentStatus = rental.paymentStatus;
        if (newAmountPaid >= totalCost) {
          paymentStatus = "PAID";
        } else if (newAmountPaid > 0) {
          paymentStatus = "PARTIALLY_PAID";
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

        // 3. Create InvoicePayment
        const invoicePayment = await tx.invoicePayment.create({
          data: {
            invoiceId: rental.invoice!.id,
            amount: Number(amount),
            currency: "ZAR",
            method,
            reference: reference || `PAY-${Date.now()}`,
            notes,
            status: "COMPLETED",
            paidAt: new Date(),
          },
        });

        // 4. Calculate invoice status - Use proper enum values
        const totalPaid = newAmountPaid;
        const invoiceTotal = Number(rental.invoice?.totalAmount) || 0;

        let invoiceStatus: any = "PARTIALLY_PAID"; // Use 'any' to bypass TypeScript checking
        if (totalPaid >= invoiceTotal) {
          invoiceStatus = "PAID";
        } else if (totalPaid === 0) {
          invoiceStatus = "UNPAID";
        }

        // 5. Update invoice status (within transaction)
        const updatedInvoice = await tx.invoice.update({
          where: { id: rental.invoice!.id },
          data: {
            status: invoiceStatus,
            ...(totalPaid >= invoiceTotal && { paidDate: new Date() }),
          },
        });

        // 6. Create Transaction record (within transaction)
        const transaction = await tx.transaction.create({
          data: {
            amount: Number(amount),
            currency: "ZAR",
            type: "INCOME",
            status: "COMPLETED",
            description: `Payment for tool rental: ${rental.tool.name} - ${rental.businessName}`,
            reference: invoicePayment.reference,
            date: new Date(),
            method,
            invoiceId: rental.invoice!.id,
            clientId: rental.quotation?.clientId || rental.clientId,
            createdBy: user.id,
            taxAmount: 0,
            netAmount: Number(amount),
            vendor: rental.businessName,
            invoiceNumber: rental.invoice!.invoiceNumber,
            categoryId: rentalIncomeCategory.id,
          },
        });
        return {
          rental: updatedRental,
          invoicePayment,
          transaction,
          invoice: updatedInvoice,
          category: rentalIncomeCategory,
        };
      },
      {
        timeout: 30000,
        maxWait: 10000,
      }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error recording payment:", error);

    // Handle specific Prisma transaction errors
    if (error.code === "P2028") {
      return NextResponse.json(
        { error: "Transaction timeout. Please try again." },
        { status: 408 }
      );
    }

    if (error.code === "P2034") {
      return NextResponse.json(
        { error: "Transaction conflict. Please try again." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
