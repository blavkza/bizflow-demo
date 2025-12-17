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
      ? `SALE-${(parseInt(lastSale.saleNumber.split("-")[1]) + 1).toString().padStart(4, "0")}`
      : "SALE-0001";

    // First, check product statuses and get current stock levels
    const productIds = items.map((item: any) => item.id);
    const products = await db.shopProduct.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        status: true,
      },
    });

    // Check for inactive products
    const inactiveProducts = products.filter((p) => p.status !== "ACTIVE");
    if (inactiveProducts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot process sale with inactive products",
          inactiveProducts: inactiveProducts.map((p) => p.name),
        },
        { status: 400 }
      );
    }

    // Check for negative stock warnings (for logging only, not blocking)
    const negativeStockWarnings = items
      .filter((item: any) => {
        const product = products.find((p) => p.id === item.id);
        return product && item.quantity > product.stock;
      })
      .map((item: any) => {
        const product = products.find((p) => p.id === item.id);
        return {
          productName: product?.name,
          ordered: item.quantity,
          available: product?.stock || 0,
          exceedsBy: item.quantity - (product?.stock || 0),
        };
      });

    console.log("Negative stock warnings:", negativeStockWarnings);

    // Increase transaction timeout to 30 seconds
    const result = await db.$transaction(
      async (tx) => {
        // Find or create customer if customer info is provided
        let customer = null;
        if (customerEmail || customerName) {
          const nameParts = (customerName || "").split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";

          if (customerEmail) {
            customer = await tx.customer.upsert({
              where: { email: customerEmail },
              update: {
                firstName: firstName || undefined,
                lastName: lastName || undefined,
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
          } else if (customerName) {
            // Create customer without email if only name is provided
            customer = await tx.customer.create({
              data: {
                firstName,
                lastName,
                phone: customerPhone || undefined,
                address: customerAddress || undefined,
                createdBy: user?.name || "system",
              },
            });
          }
        }

        // Create sale - Match your exact Prisma schema
        const saleData: any = {
          saleNumber,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          customerEmail: customerEmail || null,
          customerAddress: customerAddress || null,
          isDelivery: isDelivery || false,
          deliveryFee: isDelivery ? deliveryAmount : 0,
          deliveryAddress: isDelivery ? deliveryAddress : null,
          deliveryInstructions: isDelivery ? deliveryInstructions : null,
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax: parseFloat(tax.toFixed(2)),
          discount: parseFloat(discount.toFixed(2)),
          discountPercent: parseFloat((discountPercent || 0).toFixed(2)),
          deliveryAmount: isDelivery
            ? parseFloat(deliveryAmount.toFixed(2))
            : 0,
          total: parseFloat(total.toFixed(2)),
          paymentMethod,
          amountReceived: amountReceived
            ? parseFloat(parseFloat(amountReceived).toFixed(2))
            : null,
          change: change ? parseFloat(parseFloat(change).toFixed(2)) : null,
          saleDate: new Date(),
          createdBy: user?.name || "system",
          status: "COMPLETED",
          paymentStatus: "COMPLETED",
          receiptSent: false,
          receiptEmail: null,
          refundedAmount: 0,
          refundedTax: 0,
        };

        // Add customer relation if customer exists
        if (customer) {
          saleData.customer = {
            connect: { id: customer.id },
          };
        }

        const sale = await tx.sale.create({
          data: saleData,
        });

        const saleItemsData = items.map((item: any) => ({
          saleId: sale.id,
          shopProductId: item.id,
          quantity: item.quantity,
          price: parseFloat(item.price.toFixed(2)),
          total: parseFloat((item.price * item.quantity).toFixed(2)),
        }));

        await tx.saleItem.createMany({
          data: saleItemsData,
        });

        // Update product stock in batch - allow negative values
        const stockUpdates = items.map((item: any) => {
          const product = products.find((p) => p.id === item.id);
          const previousStock = product?.stock || 0;
          const newStock = previousStock - item.quantity;

          return tx.shopProduct.update({
            where: { id: item.id },
            data: {
              stock: {
                decrement: item.quantity,
              },
              // Add stock movement record for tracking
              stockMovements: {
                create: {
                  type: "OUT",
                  quantity: item.quantity,
                  reason: `Sale ${saleNumber}`,
                  reference: saleNumber,
                  previousStock,
                  newStock,
                  creater: user?.name || "system",
                },
              },
            },
          });
        });

        await Promise.all(stockUpdates);

        const lastOrder = await db.order.findFirst({
          orderBy: { createdAt: "desc" },
          select: { orderNumber: true },
        });

        const orderNumber = lastOrder
          ? `ORDER-${(parseInt(lastOrder.orderNumber.split("-")[1]) + 1).toString().padStart(4, "0")}`
          : "ORDER-0001";

        // Create order and order items if it's a delivery
        if (isDelivery) {
          const orderData: any = {
            orderNumber,
            saleId: sale.id,
            status: "PENDING",
            deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            userId: user.id,
          };

          // Add customer relation to order if customer exists
          if (customer) {
            orderData.customerId = customer.id;
          }

          const order = await tx.order.create({
            data: orderData,
          });

          // Create order items in batch
          const orderItemsData = items.map((item: any) => ({
            orderId: order.id,
            shopProductId: item.id,
            quantity: item.quantity,
            price: parseFloat(item.price.toFixed(2)),
            total: parseFloat((item.price * item.quantity).toFixed(2)),
          }));

          await tx.orderItem.createMany({
            data: orderItemsData,
          });
        }

        // Check for negative stock and log warnings
        const updatedProducts = await tx.shopProduct.findMany({
          where: {
            id: { in: productIds },
          },
          select: {
            id: true,
            name: true,
            stock: true,
          },
        });

        const negativeStockProducts = updatedProducts.filter(
          (p) => p.stock < 0
        );
        if (negativeStockProducts.length > 0) {
          console.warn(
            "Products with negative stock after sale:",
            negativeStockProducts.map((p) => ({
              name: p.name,
              stock: p.stock,
            }))
          );
        }

        return { sale, negativeStockProducts };
      },
      {
        maxWait: 30000,
        timeout: 30000,
      }
    );

    // Fetch complete sale with all relations
    const completeSale = await db.sale.findUnique({
      where: { id: result.sale.id },
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

    // Add negative stock warning to response if applicable
    if (
      result.negativeStockProducts &&
      result.negativeStockProducts.length > 0
    ) {
      return NextResponse.json({
        ...completeSale,
        warnings: {
          negativeStock: result.negativeStockProducts.map((p) => ({
            name: p.name,
            stock: p.stock,
            message: `${p.name} now has negative stock (${p.stock})`,
          })),
        },
      });
    }

    return NextResponse.json(completeSale);
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Failed to create sale: " + (error as Error).message },
      { status: 500 }
    );
  }
}
