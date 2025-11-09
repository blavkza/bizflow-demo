import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const sales = await db.sale.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: sales,
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const {
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      items,
      subtotal,
      tax,
      discount,
      discountPercent,
      deliveryAmount,
      total,
      paymentMethod,
      amountReceived,
      change,
      isDelivery,
      deliveryAddress,
      deliveryInstructions,
    } = body;

    const lastSale = await db.sale.findFirst({
      orderBy: { createdAt: "desc" },
      select: { saleNumber: true },
    });

    const saleNumber = lastSale
      ? `SALE-${parseInt(lastSale.saleNumber.split("-")[1]) + 1}`
      : "SALE-0001";

    // Increase transaction timeout to 30 seconds
    const result = await db.$transaction(
      async (tx) => {
        // Find or create customer if customer info is provided (do this first)
        let customer = null;
        if (customerEmail && customerName) {
          const nameParts = customerName.split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";

          customer = await tx.customer.upsert({
            where: { email: customerEmail },
            update: {
              firstName,
              lastName,
              phone: customerPhone || undefined,
              address: customerAddress || undefined,
            },
            create: {
              firstName,
              lastName,
              email: customerEmail,
              phone: customerPhone || undefined,
              address: customerAddress || undefined,
              createdBy: user?.name || "system",
            },
          });
        }

        // Create sale first
        const sale = await tx.sale.create({
          data: {
            saleNumber,
            customerId: customer?.id || null,
            customerName: customerName || null,
            customerPhone: customerPhone || null,
            customerEmail: customerEmail || null,
            customerAddress: customerAddress || null,
            isDelivery: isDelivery || false,
            deliveryFee: isDelivery ? deliveryAmount : 0,
            deliveryAddress: isDelivery ? deliveryAddress : null,
            deliveryInstructions: isDelivery ? deliveryInstructions : null,
            subtotal,
            tax,
            discount,
            discountPercent,
            deliveryAmount: isDelivery ? deliveryAmount : 0,
            total,
            paymentMethod,
            amountReceived: amountReceived || null,
            change: change || null,
            saleDate: new Date(),
            createdBy: user?.name || "system",
          },
        });

        // Create sale items in batch
        const saleItemsData = items.map((item: any) => ({
          saleId: sale.id,
          shopProductId: item.id,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        }));

        await tx.saleItem.createMany({
          data: saleItemsData,
        });

        // Update product stock in batch
        const stockUpdates = items.map((item: any) =>
          tx.shopProduct.update({
            where: { id: item.id },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })
        );

        await Promise.all(stockUpdates);

        const lastOrder = await db.order.findFirst({
          orderBy: { createdAt: "desc" },
          select: { orderNumber: true },
        });

        const orderNumber = lastOrder
          ? `ORDER-${parseInt(lastOrder.orderNumber.split("-")[1]) + 1}`
          : "ORDER-0001";

        // Create order and order items if it's a delivery
        if (isDelivery) {
          const order = await tx.order.create({
            data: {
              orderNumber,
              saleId: sale.id,
              status: "PENDING",
              deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
              customerId: customer?.id,
              userId: user.id,
            },
          });

          // Create order items in batch
          const orderItemsData = items.map((item: any) => ({
            orderId: order.id,
            shopProductId: item.id,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          }));

          await tx.orderItem.createMany({
            data: orderItemsData,
          });
        }

        // Create transaction record
        await tx.transaction.create({
          data: {
            amount: total,
            type: "INCOME",
            status: "COMPLETED",
            description: `Sale ${saleNumber}${isDelivery ? " (Delivery)" : ""}`,
            reference: saleNumber,
            date: new Date(),
            method: paymentMethod.toUpperCase(),
            taxAmount: tax,
            netAmount: subtotal - discount,
            createdBy: user?.id || "",
          },
        });

        return sale;
      },
      {
        maxWait: 30000, // Increase max wait time to 30 seconds
        timeout: 30000, // Increase timeout to 30 seconds
      }
    );

    // Fetch complete sale with all relations
    const completeSale = await db.sale.findUnique({
      where: { id: result.id },
      include: {
        items: {
          include: {
            ShopProduct: true,
          },
        },
        customer: true,
        Order: {
          include: {
            OrderItem: {
              include: {
                ShopProduct: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(completeSale);
  } catch (error) {
    console.error("Error creating sale:", error);
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 }
    );
  }
}
