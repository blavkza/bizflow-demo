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

    const body = await request.json();
    const { status, quantity, notes } = body;

    const stockAwait = await db.stockAwait.findUnique({
      where: { id: params.id },
      include: {
        sale: true,
        quote: true,
        shopProduct: true,
      },
    });

    if (!stockAwait) {
      return NextResponse.json(
        { error: "Stock await not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (status && ["PENDING", "RESOLVED", "CANCELLED"].includes(status)) {
      updateData.status = status;

      if (status === "RESOLVED") {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = user.name;
      }
    }

    if (quantity !== undefined) {
      updateData.quantity = quantity;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updatedStockAwait = await db.stockAwait.update({
      where: { id: params.id },
      data: updateData,
      include: {
        shopProduct: true,
        sale: {
          select: {
            saleNumber: true,
          },
        },
        quote: {
          select: {
            quoteNumber: true,
          },
        },
      },
    });

    return NextResponse.json(updatedStockAwait);
  } catch (error) {
    console.error("Error updating stock await:", error);
    return NextResponse.json(
      { error: "Failed to update stock await" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const stockAwait = await db.stockAwait.findUnique({
      where: { id: params.id },
    });

    if (!stockAwait) {
      return NextResponse.json(
        { error: "Stock await not found" },
        { status: 404 }
      );
    }

    await db.stockAwait.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting stock await:", error);
    return NextResponse.json(
      { error: "Failed to delete stock await" },
      { status: 500 }
    );
  }
}
