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
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { approvedBy } = await request.json();
    const refundId = params.id;

    const refund = await db.refund.findUnique({
      where: { id: refundId },
      include: {
        items: true,
        sale: true,
      },
    });

    if (!refund) {
      return NextResponse.json(
        { success: false, error: "Refund not found" },
        { status: 404 }
      );
    }

    if (refund.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Refund is not pending approval" },
        { status: 400 }
      );
    }

    // Update refund status
    const updatedRefund = await db.refund.update({
      where: { id: refundId },
      data: {
        status: "APPROVED",
        approvedBy: user.name,
        approvedAt: new Date(),
      },
      include: {
        items: {
          include: {
            saleItem: {
              include: {
                ShopProduct: true,
              },
            },
          },
        },
        sale: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRefund,
    });
  } catch (error) {
    console.error("Error approving refund:", error);
    return NextResponse.json(
      { success: false, error: "Failed to approve refund" },
      { status: 500 }
    );
  }
}
