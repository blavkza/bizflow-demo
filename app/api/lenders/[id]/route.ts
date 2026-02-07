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

    const lender = await db.lender.findUnique({
      where: {
        id: id,
      },
      include: {
        interestTiers: {
          orderBy: { termMonths: "asc" },
        },
        loans: {
          include: {
            payments: true,
            documents: true,
          },
        },
        documents: true,
      },
    });

    if (!lender) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(lender);
  } catch (error) {
    console.log("[LENDER_GET]", error);
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

    const updatedData = { ...body };
    if (updatedData.interestRate !== undefined) {
      updatedData.interestRate = updatedData.interestRate
        ? parseFloat(updatedData.interestRate)
        : null;
    }
    if (updatedData.termMonths !== undefined) {
      updatedData.termMonths = updatedData.termMonths
        ? parseInt(updatedData.termMonths)
        : null;
    }

    const { loanCalculationMethods, interestTiers, ...rest } = updatedData;

    // Update main lender fields
    const lender = await db.lender.update({
      where: {
        id: id,
      },
      data: {
        ...rest,
        loanCalculationMethods: loanCalculationMethods || undefined,
      },
    });

    // Handle tiers update if provided
    if (interestTiers) {
      // Helper to process tiers
      await db.$transaction(async (tx) => {
        // Delete existing tiers
        await tx.lenderInterestTier.deleteMany({
          where: { lenderId: id },
        });

        // Create new ones
        if (Array.isArray(interestTiers) && interestTiers.length > 0) {
          await tx.lenderInterestTier.createMany({
            data: interestTiers.map((tier: any) => ({
              lenderId: id,
              termMonths: parseInt(tier.termMonths),
              interestRate: parseFloat(tier.interestRate),
            })),
          });
        }
      });
    }

    return NextResponse.json(lender);
  } catch (error) {
    console.log("[LENDER_PATCH]", error);
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

    // Check if lender has loans
    const lender = await db.lender.findUnique({
      where: { id },
      include: {
        _count: {
          select: { loans: true },
        },
      },
    });

    if (lender?._count.loans && lender._count.loans > 0) {
      return new NextResponse("Cannot delete lender with active loans", {
        status: 400,
      });
    }

    await db.lender.delete({
      where: {
        id: id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.log("[LENDER_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
