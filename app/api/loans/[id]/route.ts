import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { calculateLoan } from "@/lib/loan-calc";

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

    const loan = await db.loan.findUnique({
      where: {
        id: id,
      },
      include: {
        creator: true,
        payments: {
          orderBy: {
            date: "desc",
          },
          include: {
            documents: true,
            creator: true,
          },
        },
        documents: true,
      },
    });

    if (!loan) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(loan);
  } catch (error) {
    console.log("[LOAN_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
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

    const currentLoan = await db.loan.findUnique({ where: { id } });
    if (!currentLoan) return new NextResponse("Not Found", { status: 404 });

    const updatedData = { ...body };

    // Check if calculation needed
    const needsRecalc = [
      "amount",
      "interestRate",
      "termMonths",
      "monthlyPayment",
      "calculationMethod",
      "interestType",
      "primeMargin",
    ].some((k) => k in body);

    if (needsRecalc) {
      const principal =
        body.amount !== undefined
          ? parseFloat(body.amount)
          : currentLoan.amount;
      const rate =
        body.interestRate !== undefined
          ? parseFloat(body.interestRate)
          : currentLoan.interestRate;
      const term =
        body.termMonths !== undefined
          ? parseInt(body.termMonths)
          : currentLoan.termMonths || 12;
      const method =
        body.calculationMethod !== undefined
          ? body.calculationMethod
          : currentLoan.calculationMethod;
      const monthly =
        body.monthlyPayment !== undefined
          ? parseFloat(body.monthlyPayment)
          : currentLoan.monthlyPayment;

      const { totalPayable } = calculateLoan(principal, rate, term, method);

      let finalPayable = totalPayable;
      if (monthly && term) {
        finalPayable = monthly * term;
      }

      updatedData.interestAmount = finalPayable - principal;
      updatedData.totalPayable = finalPayable;
      updatedData.amount = principal;
      updatedData.interestRate = rate;
      updatedData.termMonths = term;
      updatedData.monthlyPayment = monthly;
    }

    if (body.lenderId !== undefined) {
      updatedData.lenderId = body.lenderId === "OTHER" ? null : body.lenderId;
    }

    const loan = await db.loan.update({
      where: {
        id: id,
      },
      data: {
        ...updatedData,
        startDate: updatedData.startDate
          ? new Date(updatedData.startDate)
          : undefined,
        endDate: updatedData.endDate
          ? new Date(updatedData.endDate)
          : undefined,
      },
    });

    return NextResponse.json(loan);
  } catch (error) {
    console.log("[LOAN_PATCH]", error);
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

    const loan = await db.loan.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json(loan);
  } catch (error) {
    console.log("[LOAN_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
