import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const refundId = params.id;
    const body = await request.json();
    const { notes } = body;

    // Validate input
    if (typeof notes !== "string" && notes !== null) {
      return NextResponse.json(
        { success: false, error: "Notes must be a string or null" },
        { status: 400 }
      );
    }

    // Check if refund exists
    const existingRefund = await db.refund.findUnique({
      where: { id: refundId },
    });

    if (!existingRefund) {
      return NextResponse.json(
        { success: false, error: "Refund not found" },
        { status: 404 }
      );
    }

    // Get user info for audit trail
    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 401 });
    }

    // Update refund notes
    const updatedRefund = await db.refund.update({
      where: { id: refundId },
      data: {
        notes: notes?.trim() || null,
        updatedAt: new Date(),
      },
      include: {
        sale: {
          select: {
            id: true,
            saleNumber: true,
            customerName: true,
            customerPhone: true,
            customerEmail: true,
            total: true,
            paymentMethod: true,
            saleDate: true,
          },
        },
        items: {
          include: {
            saleItem: {
              include: {
                ShopProduct: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRefund,
      message: "Notes updated successfully",
    });
  } catch (error) {
    console.error("Error updating refund notes:", error);

    if (error instanceof Error) {
      if (error.message.includes("Record to update not found")) {
        return NextResponse.json(
          { success: false, error: "Refund not found" },
          { status: 404 }
        );
      }

      if (error.message.includes("Unique constraint failed")) {
        return NextResponse.json(
          {
            success: false,
            error: "A refund with these details already exists",
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update refund notes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
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

    const refundId = params.id;

    const refund = await db.refund.findUnique({
      where: { id: refundId },
      select: {
        id: true,
        refundNumber: true,
        notes: true,
        updatedAt: true,
      },
    });

    if (!refund) {
      return NextResponse.json(
        { success: false, error: "Refund not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        notes: refund.notes,
        updatedAt: refund.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching refund notes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch refund notes" },
      { status: 500 }
    );
  }
}
