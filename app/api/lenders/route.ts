import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      contactPerson,
      email,
      phone,
      website,
      address,
      description,
      interestRate,
      termMonths,
      loanCalculationMethods,
      interestTiers,
    } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!user) {
      return new NextResponse("User not found in database", { status: 401 });
    }

    const lender = await db.lender.create({
      data: {
        name,
        contactPerson,
        email,
        phone,
        website,
        address,
        description,
        interestRate: interestRate ? parseFloat(interestRate) : null,
        termMonths: termMonths ? parseInt(termMonths) : null,
        createdBy: user.id,
        loanCalculationMethods: loanCalculationMethods || [],
        interestTiers: {
          create: (interestTiers || []).map((tier: any) => ({
            termMonths: parseInt(tier.termMonths),
            interestRate: parseFloat(tier.interestRate),
          })),
        },
      },
    });

    return NextResponse.json(lender);
  } catch (error) {
    console.log("[LENDERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const lenders = await db.lender.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        interestTiers: {
          orderBy: { termMonths: "asc" },
        },
        creator: true,
        loans: {
          include: {
            payments: true,
          },
        },
      },
    });

    return NextResponse.json(lenders);
  } catch (error) {
    console.log("[LENDERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
