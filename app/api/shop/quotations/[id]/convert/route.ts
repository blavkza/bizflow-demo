import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PaymentMethod } from "@prisma/client";
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
      select: { id: true, name: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 401 });
    }

    const body = await request.json();
    const { paymentMethod = PaymentMethod.CASH, amountReceived, change } = body;

    const { id } = params;

    const quotation = await db.saleQuote.findUnique({
      where: {
        id,
        status: "PENDING",
      },
      include: {
        items: {
          include: {
            shopProduct: true,
          },
        },
        customer: true,
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found or already converted" },
        { status: 404 }
      );
    }

    // Check if quotation is expired
    if (quotation.expiryDate && new Date() > quotation.expiryDate) {
      return NextResponse.json(
        { error: "Quotation has expired" },
        { status: 400 }
      );
    }

    // Increase transaction timeout to 30 seconds
    const result = await db.$transaction(
      async (tx) => {
        // Generate sale number
        const lastSale = await tx.sale.findFirst({
          orderBy: { createdAt: "desc" },
          select: { saleNumber: true },
        });

        const saleNumber = lastSale
          ? `SALE-${(parseInt(lastSale.saleNumber.split("-")[1]) + 1).toString().padStart(4, "0")}`
          : "SALE-0001";

        // Check product statuses and get current stock levels
        const productIds = quotation.items.map(
          (item: any) => item.shopProductId
        );
        const products = await tx.shopProduct.findMany({
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
          throw new Error(
            `Cannot process sale with inactive products: ${inactiveProducts.map((p) => p.name).join(", ")}`
          );
        }

        // Check stock levels and track negative quantities - SAME LOGIC AS REGULAR SALE
        const stockAwaits = [];
        const itemsWithStockInfo = [];
        const stockUpdates = [];

        for (const item of quotation.items) {
          const product = products.find((p) => p.id === item.shopProductId);
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
                notes: `From quotation ${quotation.quoteNumber} - Need ${shortage} more units`,
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
                        ? `Sale ${saleNumber} from quotation ${quotation.quoteNumber} - Stock shortage (awaiting ${shortage} units)`
                        : `Sale ${saleNumber} from quotation ${quotation.quoteNumber}`,
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

        // Create sale from quotation
        const saleData: any = {
          saleNumber,
          quoteId: quotation.id,
          customerName: quotation.customerName || null,
          customerPhone: quotation.customerPhone || null,
          customerEmail: quotation.customerEmail || null,
          customerAddress: quotation.customerAddress || null,
          status: saleStatus,
          isDelivery: quotation.isDelivery || false,
          deliveryFee: quotation.isDelivery ? quotation.deliveryFee : 0,
          deliveryAddress: quotation.isDelivery
            ? quotation.deliveryAddress
            : null,
          deliveryInstructions: quotation.isDelivery
            ? quotation.deliveryInstructions
            : null,
          subtotal: parseFloat(quotation.subtotal.toFixed(2)),
          tax: parseFloat(quotation.tax?.toFixed(2) || "0"),
          discount: parseFloat(quotation.discount?.toFixed(2) || "0"),
          discountPercent: parseFloat(
            quotation.discountPercent?.toFixed(2) || "0"
          ),
          deliveryAmount: quotation.isDelivery
            ? parseFloat(quotation.deliveryFee?.toFixed(2) || "0")
            : 0,
          total: parseFloat(quotation.total.toFixed(2)),
          paymentMethod,
          paymentStatus,
          amountReceived: amountReceived
            ? parseFloat(parseFloat(amountReceived).toFixed(2))
            : null,
          change: change ? parseFloat(parseFloat(change).toFixed(2)) : null,
          saleDate: new Date(),
          createdBy: user.name,
          receiptSent: false,
          receiptEmail: null,
          refundedAmount: 0,
          refundedTax: 0,
        };

        // Add customer relation if customer exists
        if (quotation.customer) {
          saleData.customer = {
            connect: { id: quotation.customer.id },
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
                  quoteId: null, // Remove quote reference
                },
              })
            )
          );
        }

        // Create sale items in batch with stock info
        const saleItemsData = itemsWithStockInfo.map((item: any) => ({
          saleId: sale.id,
          shopProductId: item.shopProductId,
          quantity: item.quantity,
          price: parseFloat(item.price.toFixed(2)),
          total: parseFloat(item.total.toFixed(2)),
          hadNegativeStock: item.hadNegativeStock || false,
          awaitedQuantity: item.awaitedQuantity || 0,
        }));

        await tx.saleItem.createMany({
          data: saleItemsData,
        });

        // Execute all stock updates
        await Promise.all(stockUpdates);

        // Create order if it's a delivery
        if (quotation.isDelivery) {
          const lastOrder = await tx.order.findFirst({
            orderBy: { createdAt: "desc" },
            select: { orderNumber: true },
          });

          const orderNumber = lastOrder
            ? `ORDER-${(parseInt(lastOrder.orderNumber.split("-")[1]) + 1).toString().padStart(4, "0")}`
            : "ORDER-0001";

          const orderData: any = {
            orderNumber,
            saleId: sale.id,
            status:
              saleStatus === "AWAITING_STOCK" ? "PENDING_STOCK" : "PENDING",
            deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            userId: user.id,
          };

          // Add customer relation to order if customer exists
          if (quotation.customer) {
            orderData.customerId = quotation.customer.id;
          }

          const order = await tx.order.create({
            data: orderData,
          });

          // Create order items in batch
          const orderItemsData = itemsWithStockInfo.map((item: any) => ({
            orderId: order.id,
            shopProductId: item.shopProductId,
            quantity: item.quantity,
            price: parseFloat(item.price.toFixed(2)),
            total: parseFloat(item.total.toFixed(2)),
          }));

          await tx.orderItem.createMany({
            data: orderItemsData,
          });
        }

        // Create transaction record for payment
        let paymentCategory = await tx.category.findFirst({
          where: {
            name: "SALE_PAYMENT",
            type: "INCOME",
          },
        });

        if (!paymentCategory) {
          paymentCategory = await tx.category.create({
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
            amount: parseFloat(quotation.total.toFixed(2)),
            type: "INCOME",
            status: paymentStatus === "COMPLETED" ? "COMPLETED" : "PENDING",
            description: `Sale ${saleNumber} from quotation ${quotation.quoteNumber}${quotation.isDelivery ? " (Delivery)" : ""}`,
            reference: saleNumber,
            date: new Date(),
            categoryId: paymentCategory.id,
            method: paymentMethod.toUpperCase(),
            taxAmount: parseFloat(quotation.tax?.toFixed(2) || "0"),
            netAmount: parseFloat(
              (quotation.subtotal - (quotation.discount || 0)).toFixed(2)
            ),
            createdBy: user.id,
          };

          await tx.transaction.create({
            data: transactionData,
          });
        } catch (txError) {
          console.warn("Transaction creation error:", txError);
          // Continue even if transaction record fails
        }

        // Update quotation status
        await tx.saleQuote.update({
          where: { id: quotation.id },
          data: {
            status: "CONVERTED",
            convertedTo: {
              connect: { id: sale.id },
            },
          },
        });

        // Get updated products to check for negative stock
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
    console.error("Error converting quotation:", error);
    return NextResponse.json(
      { error: "Failed to convert quotation: " + (error as Error).message },
      { status: 500 }
    );
  }
}
