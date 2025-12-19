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

    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Check if quotation exists and is not converted
    const existingQuotation = await db.saleQuote.findUnique({
      where: {
        id,
        status: "PENDING", // Only update pending quotations
      },
    });

    if (!existingQuotation) {
      return NextResponse.json(
        { error: "Quotation not found or already converted" },
        { status: 404 }
      );
    }

    // Update quotation in transaction
    const updatedQuotation = await db.$transaction(async (tx) => {
      // Delete existing items
      await tx.saleQuoteItem.deleteMany({
        where: { quoteId: id },
      });

      // Update quotation
      const quotation = await tx.saleQuote.update({
        where: { id },
        data: {
          customerName: body.customerName || null,
          customerPhone: body.customerPhone || null,
          customerEmail: body.customerEmail || null,
          customerAddress: body.customerAddress || null,
          expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
          notes: body.notes || null,
          isDelivery: body.isDelivery || false,
          deliveryAddress: body.deliveryAddress || null,
          deliveryInstructions: body.deliveryInstructions || null,
          subtotal: parseFloat(body.subtotal.toFixed(2)),
          discount: parseFloat(body.discount.toFixed(2)),
          discountPercent: parseFloat(body.discountPercent.toFixed(2)),
          tax: parseFloat(body.tax.toFixed(2)),
          deliveryFee: parseFloat(body.deliveryAmount.toFixed(2)),
          total: parseFloat(body.total.toFixed(2)),
        },
      });

      // Create new items
      if (body.items && body.items.length > 0) {
        await tx.saleQuoteItem.createMany({
          data: body.items.map((item: any) => ({
            quoteId: id,
            shopProductId: item.id,
            quantity: item.quantity,
            price: parseFloat(item.price.toFixed(2)),
            total: parseFloat(item.total.toFixed(2)),
          })),
        });
      }

      return quotation;
    });

    // Fetch complete updated quotation
    const completeQuotation = await db.saleQuote.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            shopProduct: true,
          },
        },
        customer: true,
      },
    });

    return NextResponse.json(completeQuotation);
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
        convertedTo: true,
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
