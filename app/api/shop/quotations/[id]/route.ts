import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
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
      select: { id: true, name: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, action } = body;

    const existingQuotation = await db.saleQuote.findUnique({
      where: { id },
    });

    if (!existingQuotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    let newStatus = status;

    if (action === "cancel") {
      newStatus = "CANCELLED";
    } else if (action === "undo-cancel") {
      newStatus = "PENDING";
    } else if (action === "mark-expired") {
      newStatus = "EXPIRED";
    }

    if (existingQuotation.status === "CONVERTED") {
      return NextResponse.json(
        { error: "Cannot modify a converted quotation" },
        { status: 400 }
      );
    }

    if (existingQuotation.status === "CANCELLED" && newStatus === "CANCELLED") {
      return NextResponse.json(
        { error: "Quotation is already cancelled" },
        { status: 400 }
      );
    }

    if (existingQuotation.status === "EXPIRED" && newStatus === "EXPIRED") {
      return NextResponse.json(
        { error: "Quotation is already expired" },
        { status: 400 }
      );
    }

    const updatedQuotation = await db.saleQuote.update({
      where: { id },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedQuotation,
      message:
        newStatus === "CANCELLED"
          ? "Quotation cancelled successfully"
          : newStatus === "PENDING"
            ? "Quotation restored successfully"
            : "Quotation updated successfully",
    });
  } catch (error) {
    console.error("Error updating quotation:", error);
    return NextResponse.json(
      { error: "Failed to update quotation" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    const quotation = await db.saleQuote.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            shopProduct: true,
          },
        },
        customer: true,
        convertedTo: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(quotation);
  } catch (error) {
    console.error("Error fetching quotation:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotation" },
      { status: 500 }
    );
  }
}
