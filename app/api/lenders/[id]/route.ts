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

    const lender = await db.lender.update({
      where: {
        id: id,
      },
      data: updatedData,
    });

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
