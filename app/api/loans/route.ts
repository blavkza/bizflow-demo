import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { calculateLoan } from "@/lib/loan-calc";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      lender,
      loanType,
      referenceNumber,
      amount,
      interestRate,
      startDate,
      endDate,
      termMonths,
      description,
      monthlyPayment,
      calculationMethod,
      lenderId,
      interestType,
      primeMargin,
    } = body;

    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse("User not found in database", { status: 401 });
    }

    const parsedAmount = parseFloat(amount);
    const parsedRate = parseFloat(interestRate || "0");
    const parsedTerm = termMonths ? parseInt(termMonths) : 12;

    const { totalPayable, totalInterest } = calculateLoan(
      parsedAmount,
      parsedRate,
      parsedTerm,
      calculationMethod || "AMORTIZED",
    );

    // If user provided a manual monthly payment, total payable might differ
    let finalPayable = totalPayable;
    if (monthlyPayment && termMonths) {
      finalPayable = parseFloat(monthlyPayment) * parseInt(termMonths);
    }
    const finalInterest = finalPayable - parsedAmount;

    if (!lender || !amount || !startDate) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const loan = await db.$transaction(
      async (tx) => {
        // Find or create category
        let category = await tx.category.findFirst({
          where: { name: "Loan Income", type: "INCOME" },
        });

        if (!category) {
          category = await tx.category.create({
            data: {
              name: "Loan Income",
              type: "INCOME",
              description: "Income received from Loans",
              createdBy: user.id,
            },
          });
        }

        const newLoan = await tx.loan.create({
          data: {
            lender,
            loanType,
            referenceNumber,
            amount: parsedAmount,
            interestRate: parsedRate,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            termMonths: parsedTerm,
            description,
            monthlyPayment: monthlyPayment ? parseFloat(monthlyPayment) : null,
            interestAmount: finalInterest,
            totalPayable: finalPayable,
            calculationMethod: calculationMethod || "AMORTIZED",
            lenderId: lenderId && lenderId !== "OTHER" ? lenderId : null,
            interestType: interestType || "FIXED",
            primeMargin: primeMargin ? parseFloat(primeMargin) : 0,
            createdBy: user.id,
          },
        });

        await tx.transaction.create({
          data: {
            amount: parsedAmount,
            type: "INCOME", // Loan coming in is Income/Cash-In
            status: "COMPLETED",
            description: `Loan Disbursement: ${lender}`,
            reference: referenceNumber,
            date: new Date(startDate),
            method: "BANK_TRANSFER",
            loanId: newLoan.id,
            createdBy: user.id,
            categoryId: category.id,
          },
        });

        return newLoan;
      },
      {
        timeout: 20000,
      },
    );

    return NextResponse.json(loan);
  } catch (error) {
    console.log("[LOANS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const loans = await db.loan.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        creator: true,
        payments: {
          orderBy: { date: "desc" },
          take: 5,
          include: {
            creator: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(loans);
  } catch (error) {
    console.log("[LOANS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
