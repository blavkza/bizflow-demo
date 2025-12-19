import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
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
    const data = await request.json();

    const quoteCount = await db.saleQuote.count();
    const quoteNumber = `QT${(quoteCount + 1).toString().padStart(6, "0")}`;

    const quotation = await db.saleQuote.create({
      data: {
        quoteNumber,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        customerAddress: data.customerAddress,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        notes: data.notes,
        isDelivery: data.isDelivery || false,
        deliveryAddress: data.deliveryAddress,
        deliveryInstructions: data.deliveryInstructions,
        subtotal: data.subtotal,
        discount: data.discount,
        discountPercent: data.discountPercent,
        tax: data.tax,
        deliveryFee: data.deliveryAmount,
        total: data.total,
        createdBy: user.name || "System",
        items: {
          create: data.items.map((item: any) => ({
            shopProductId: item.id,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
        },
      },
      include: {
        items: {
          include: {
            shopProduct: true,
          },
        },
      },
    });

    return NextResponse.json(quotation);
  } catch (error) {
    console.error("Error creating quotation:", error);
    return NextResponse.json(
      { error: "Failed to create quotation" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { quoteNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { customerEmail: { contains: search } },
      ];
    }

    const quotations = await db.saleQuote.findMany({
      where,
      include: {
        items: {
          include: {
            shopProduct: true,
          },
        },
        convertedTo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(quotations);
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotations" },
      { status: 500 }
    );
  }
}
