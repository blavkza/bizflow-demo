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
        items: {
          include: {
            ShopProduct: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
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

    const result = await db.$transaction(
      async (tx) => {
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

        // Check stock levels and track negative quantities
        const stockAwaits = [];
        const itemsWithStockInfo = [];
        const stockUpdates = [];

        for (const item of items) {
          const product = products.find((p) => p.id === item.id);
          if (!product) continue;

          const quantityNeeded = item.quantity;
          const currentStock = product.stock; // Current stock (could be negative)

          // Calculate shortage: how many MORE we need beyond what we already have
          // If stock is already negative, we only care about additional shortage
          const availableStock = Math.max(0, currentStock); // Treat negative as 0 for availability
          const shortage = Math.max(0, quantityNeeded - availableStock);

          // If there's a shortage, create stock await
          if (shortage > 0) {
            const stockAwait = await tx.stockAwait.create({
              data: {
                saleId: null, // Will be set after sale creation
                shopProductId: product.id,
                quantity: shortage, // Only the NEW shortage
                status: "PENDING",
                notes: `From sale ${saleNumber} - Need ${shortage} more units`,
              },
            });
            stockAwaits.push(stockAwait);

            itemsWithStockInfo.push({
              ...item,
              hadNegativeStock: true,
              awaitedQuantity: shortage,
            });
          } else {
            itemsWithStockInfo.push({
              ...item,
              hadNegativeStock: false,
              awaitedQuantity: 0,
            });
          }

          // Always update stock (it can go more negative)
          const previousStock = currentStock;
          const newStock = previousStock - quantityNeeded;

          stockUpdates.push(
            tx.shopProduct.update({
              where: { id: product.id },
              data: {
                stock: {
                  decrement: quantityNeeded,
                },
                stockMovements: {
                  create: {
                    type: "OUT",
                    quantity: quantityNeeded,
                    reason:
                      shortage > 0
                        ? `Sale ${saleNumber} - Stock shortage (awaiting ${shortage} units)`
                        : `Sale ${saleNumber}`,
                    reference: saleNumber,
                    previousStock,
                    newStock,
                    creater: user.name,
                  },
                },
              },
            })
          );
        }

        // Determine sale status based on stock availability
        const hasNegativeStock = stockAwaits.length > 0;
        const saleStatus = hasNegativeStock ? "AWAITING_STOCK" : "COMPLETED";
        const paymentStatus = hasNegativeStock ? "PENDING" : "COMPLETED";

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
          tax: parseFloat(tax?.toFixed(2) || "0"),
          discount: parseFloat(discount?.toFixed(2) || "0"),
          discountPercent: parseFloat((discountPercent || 0).toFixed(2)),
          deliveryAmount: isDelivery
            ? parseFloat(deliveryAmount?.toFixed(2) || "0")
            : 0,
          total: parseFloat(total.toFixed(2)),
          paymentMethod,
          paymentStatus,
          amountReceived: amountReceived
            ? parseFloat(parseFloat(amountReceived).toFixed(2))
            : null,
          change: change ? parseFloat(parseFloat(change).toFixed(2)) : null,
          saleDate: new Date(),
          createdBy: user?.name || "system",
          status: saleStatus,
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

        // Update stock awaits with sale ID
        if (stockAwaits.length > 0) {
          await Promise.all(
            stockAwaits.map((stockAwait) =>
              tx.stockAwait.update({
                where: { id: stockAwait.id },
                data: {
                  saleId: sale.id,
                },
              })
            )
          );
        }

        // Create sale items in batch with stock info
        const saleItemsData = itemsWithStockInfo.map((item: any) => ({
          saleId: sale.id,
          shopProductId: item.id,
          quantity: item.quantity,
          price: parseFloat(item.price.toFixed(2)),
          total: parseFloat((item.price * item.quantity).toFixed(2)),
          hadNegativeStock: item.hadNegativeStock || false,
          awaitedQuantity: item.awaitedQuantity || 0,
        }));

        await tx.saleItem.createMany({
          data: saleItemsData,
        });

        // Execute all stock updates
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
            status:
              saleStatus === "AWAITING_STOCK" ? "PENDING_STOCK" : "PENDING",
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
          const orderItemsData = itemsWithStockInfo.map((item: any) => ({
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

        let paymentCategory = await db.category.findFirst({
          where: {
            name: "SALE_PAYMENT",
            type: "INCOME",
          },
        });

        if (!paymentCategory) {
          paymentCategory = await db.category.create({
            data: {
              name: "SALE_PAYMENT",
              description: "Payments received from sale",
              type: "INCOME",
              createdBy: user.name,
            },
          });
        }

        try {
          const transactionData: any = {
            amount: parseFloat(total.toFixed(2)),
            type: "INCOME",
            status: paymentStatus,
            description: `Sale ${saleNumber}${isDelivery ? " (Delivery)" : ""}`,
            reference: saleNumber,
            date: new Date(),
            categoryId: paymentCategory.id,
            method: paymentMethod.toUpperCase(),
            taxAmount: parseFloat(tax?.toFixed(2) || "0"),
            netAmount: parseFloat((subtotal - (discount || 0)).toFixed(2)),
            createdBy: user?.id || "",
          };

          await tx.transaction.create({
            data: transactionData,
          });
        } catch (txError) {
          console.warn("Transaction creation error:", txError);
          // Continue even if transaction record fails - sale should still complete
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

        return {
          sale,
          negativeStockProducts,
          stockAwaits: stockAwaits.length > 0 ? stockAwaits : null,
        };
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
        StockAwait: true,
      },
    });

    // Prepare response with warnings if applicable
    const response: any = { ...completeSale };

    if (
      result.negativeStockProducts &&
      result.negativeStockProducts.length > 0
    ) {
      response.warnings = {
        negativeStock: result.negativeStockProducts.map((p) => ({
          name: p.name,
          stock: p.stock,
          message: `${p.name} now has negative stock (${p.stock})`,
        })),
      };
    }

    if (result.stockAwaits) {
      response.stockAwaits = result.stockAwaits;
      response.message = `${result.stockAwaits.length} product(s) awaiting stock`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Failed to create sale: " + (error as Error).message },
      { status: 500 }
    );
  }
}
