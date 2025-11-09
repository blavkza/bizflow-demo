import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { StockMovementType } from "@prisma/client";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!updater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { items, ...invoiceData } = body;

    // Get the original invoice with items to compare stock changes
    const originalInvoice = await db.invoice.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            shopProduct: true,
          },
        },
      },
    });

    if (!originalInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Calculate amounts from items
    const itemsWithAmounts = items.map((item: any) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const taxRate = Number(item.taxRate || 0);
      const amount = quantity * unitPrice;
      const taxAmount = amount * (taxRate / 100);

      return {
        ...item,
        quantity,
        unitPrice,
        taxRate,
        amount,
        taxAmount,
      };
    });

    const subtotal = itemsWithAmounts.reduce(
      (sum: number, item: any) => sum + item.amount,
      0
    );

    const totalTax = itemsWithAmounts.reduce(
      (sum: number, item: any) => sum + (item.taxAmount || 0),
      0
    );

    // FIX: Store the ORIGINAL discount values, not calculated amounts
    const discountAmount = invoiceData.discountAmount || 0;
    const discountType = invoiceData.discountType;

    // Calculate the actual discount amount for financial calculations only
    let calculatedDiscountAmount = 0;
    if (discountType === "PERCENTAGE" && discountAmount) {
      calculatedDiscountAmount = subtotal * (discountAmount / 100);
    } else if (discountType === "AMOUNT" && discountAmount) {
      calculatedDiscountAmount = discountAmount;
    }

    const totalAmount = subtotal + totalTax - calculatedDiscountAmount;

    // Handle recurring invoice logic
    let recurringInvoiceData = {};
    if (invoiceData.isRecurring && invoiceData.frequency) {
      // Check if this invoice already has a recurring template
      const existingRecurring = await db.recurringInvoice.findFirst({
        where: { id: originalInvoice.recurringId || undefined },
      });

      if (existingRecurring) {
        // Update existing recurring invoice
        await db.recurringInvoice.update({
          where: { id: existingRecurring.id },
          data: {
            frequency: invoiceData.frequency,
            interval: invoiceData.interval || 1,
            startDate: new Date(invoiceData.issueDate),
            endDate: invoiceData.endDate ? new Date(invoiceData.endDate) : null,
            nextDate: invoiceData.nextDate
              ? new Date(invoiceData.nextDate)
              : new Date(invoiceData.issueDate),
            description: invoiceData.description,
            items: itemsWithAmounts,
            currency: invoiceData.currency || "ZAR",
            discountAmount: discountAmount, // Store original value
            discountType: discountType, // Store original type
            paymentTerms: invoiceData.paymentTerms,
            notes: invoiceData.notes,
          },
        });
        recurringInvoiceData = {
          recurringId: existingRecurring.id,
        };
      } else {
        // Create new recurring invoice
        const nextDate = calculateNextDate(
          new Date(invoiceData.issueDate),
          invoiceData.frequency,
          invoiceData.interval || 1
        );

        const recurringInvoice = await db.recurringInvoice.create({
          data: {
            clientId: invoiceData.clientId,
            frequency: invoiceData.frequency,
            interval: invoiceData.interval || 1,
            startDate: new Date(invoiceData.issueDate),
            endDate: invoiceData.endDate ? new Date(invoiceData.endDate) : null,
            nextDate,
            status: "ACTIVE",
            description: invoiceData.description,
            items: itemsWithAmounts,
            currency: invoiceData.currency || "ZAR",
            discountAmount: discountAmount, // Store original value
            discountType: discountType, // Store original type
            paymentTerms: invoiceData.paymentTerms,
            notes: invoiceData.notes,
            creator: updater.id,
          },
        });
        recurringInvoiceData = {
          recurringId: recurringInvoice.id,
        };
      }
    } else if (originalInvoice.recurringId) {
      // If changing from recurring to non-recurring, remove the link
      recurringInvoiceData = {
        recurringId: null,
      };
    }

    // Update invoice with ORIGINAL discount values and proper relation fields
    const updatedInvoice = await db.invoice.update({
      where: { id: params.id },
      data: {
        // Only include fields that belong to the Invoice model
        issueDate: new Date(invoiceData.issueDate),
        dueDate: new Date(invoiceData.dueDate),
        status: invoiceData.status,
        description: invoiceData.description,
        currency: invoiceData.currency || "ZAR",
        discountAmount: discountAmount, // Store original value (5 for 5%)
        discountType: discountType, // Store original type
        paymentTerms: invoiceData.paymentTerms,
        notes: invoiceData.notes,
        isRecurring: invoiceData.isRecurring || false,

        // Financial calculations
        amount: subtotal,
        taxAmount: totalTax,
        totalAmount,

        // Relations - use proper Prisma relation syntax
        client: {
          connect: { id: invoiceData.clientId },
        },

        // Recurring invoice data
        ...recurringInvoiceData,
      },
    });

    // Delete existing items
    await db.invoiceItem.deleteMany({
      where: { invoiceId: params.id },
    });

    // Create new items with calculated amounts
    const createdItems = await db.invoiceItem.createMany({
      data: itemsWithAmounts.map((item: any) => ({
        invoiceId: params.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        currency: invoiceData.currency || "ZAR",
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        shopProductId: item.shopProductId || null,
      })),
    });

    // Check if invoice has shop products and handle stock adjustments
    const itemsWithProducts = itemsWithAmounts.filter(
      (item: any) => item.shopProductId
    );

    if (itemsWithProducts.length > 0) {
      // Find existing sale for this invoice
      const existingSale = await db.sale.findFirst({
        where: { orderId: params.id },
        include: {
          items: true,
        },
      });

      if (existingSale) {
        // Update existing sale - use CALCULATED discount amount for sale record
        await db.sale.update({
          where: { id: existingSale.id },
          data: {
            subtotal: Number(subtotal),
            tax: Number(totalTax),
            discount: Number(calculatedDiscountAmount), // Use calculated amount for sale
            discountPercent:
              discountType === "PERCENTAGE" && discountAmount
                ? Number(discountAmount) // Store percentage for reporting
                : 0,
            total: Number(totalAmount),
            amountReceived: Number(totalAmount),
          },
        });

        // Handle stock adjustments
        for (const newItem of itemsWithProducts) {
          const shopProductId = newItem.shopProductId;
          const newQuantity = Math.floor(Number(newItem.quantity));

          if (!shopProductId) continue;

          // Find the original sale item for this product
          const originalSaleItem = existingSale.items.find(
            (item: any) => item.shopProductId === shopProductId
          );

          const originalQuantity = originalSaleItem
            ? Math.floor(Number(originalSaleItem.quantity))
            : 0;
          const quantityDifference = newQuantity - originalQuantity;

          if (quantityDifference !== 0) {
            // Get current product stock
            const product = await db.shopProduct.findUnique({
              where: { id: shopProductId },
            });

            if (product) {
              const previousStock = product.stock;
              let newStock = previousStock;
              let movementType: StockMovementType =
                StockMovementType.ADJUSTMENT;
              let reason = `Invoice ${updatedInvoice.invoiceNumber} update`;

              if (quantityDifference > 0) {
                // More items sold - decrease stock
                newStock = previousStock - quantityDifference;
                movementType = StockMovementType.OUT;
                reason = `Additional sale from invoice ${updatedInvoice.invoiceNumber} update`;
              } else if (quantityDifference < 0) {
                // Fewer items sold - increase stock (return to inventory)
                newStock = previousStock + Math.abs(quantityDifference);
                movementType = StockMovementType.IN;
                reason = `Reduced quantity from invoice ${updatedInvoice.invoiceNumber} update`;
              }

              // Update product stock
              await db.shopProduct.update({
                where: { id: shopProductId },
                data: {
                  stock: Math.max(0, newStock),
                },
              });

              // Create stock movement record
              await db.stockMovement.create({
                data: {
                  shopProductId: shopProductId,
                  type: movementType,
                  quantity: Math.abs(quantityDifference),
                  previousStock: previousStock,
                  newStock: Math.max(0, newStock),
                  reason: reason,
                  reference: existingSale.saleNumber,
                  creater: updater.name,
                },
              });
            }
          }

          // Update or create sale item
          if (originalSaleItem) {
            // Update existing sale item
            await db.saleItem.update({
              where: { id: originalSaleItem.id },
              data: {
                quantity: newQuantity,
                price: Number(newItem.unitPrice),
                total: Number(newItem.amount),
              },
            });
          } else {
            // Create new sale item
            await db.saleItem.create({
              data: {
                saleId: existingSale.id,
                shopProductId: shopProductId,
                quantity: newQuantity,
                price: Number(newItem.unitPrice),
                total: Number(newItem.amount),
              },
            });
          }
        }

        // Remove sale items for products that are no longer in the invoice
        const remainingProductIds = itemsWithProducts
          .map((item: any) => item.shopProductId)
          .filter(Boolean);

        const itemsToRemove = existingSale.items.filter(
          (item: any) => !remainingProductIds.includes(item.shopProductId)
        );

        for (const itemToRemove of itemsToRemove) {
          const product = await db.shopProduct.findUnique({
            where: { id: itemToRemove.shopProductId },
          });

          if (product) {
            const quantityToReturn = Math.floor(Number(itemToRemove.quantity));
            const newStock = product.stock + quantityToReturn;

            // Return stock to inventory
            await db.shopProduct.update({
              where: { id: itemToRemove.shopProductId },
              data: {
                stock: newStock,
              },
            });

            // Create stock movement record for returned items
            await db.stockMovement.create({
              data: {
                shopProductId: itemToRemove.shopProductId,
                type: StockMovementType.IN,
                quantity: quantityToReturn,
                previousStock: product.stock,
                newStock: newStock,
                reason: `Item removed from invoice ${updatedInvoice.invoiceNumber}`,
                reference: existingSale.saleNumber,
                creater: updater.name,
              },
            });
          }

          // Remove the sale item
          await db.saleItem.delete({
            where: { id: itemToRemove.id },
          });
        }
      } else {
        // No existing sale found - create a new one (only if invoice is finalized/paid)
        if (
          invoiceData.status === "PAID" ||
          invoiceData.status === "COMPLETED"
        ) {
          const lastSale = await db.sale.findFirst({
            orderBy: { createdAt: "desc" },
            select: { saleNumber: true },
          });

          const saleNumber = lastSale
            ? `SALE-${parseInt(lastSale.saleNumber.split("-")[1]) + 1}`
            : "SALE-0001";

          // Get client information for the sale
          const client = await db.client.findUnique({
            where: { id: invoiceData.clientId },
            select: {
              name: true,
              email: true,
              phone: true,
              address: true,
            },
          });

          // Create or find customer
          let customerId: string | undefined;
          if (client?.email) {
            const existingCustomer = await db.customer.findFirst({
              where: { email: client.email },
            });
            if (existingCustomer) {
              customerId = existingCustomer.id;
            }
          }

          if (!customerId) {
            const customerEmail =
              client?.email ||
              `invoice-${updatedInvoice.invoiceNumber}@temp.com`;
            const newCustomer = await db.customer.create({
              data: {
                firstName: client?.name?.split(" ")[0] || "Invoice",
                lastName:
                  client?.name?.split(" ").slice(1).join(" ") || "Customer",
                email: customerEmail,
                phone: client?.phone || "",
                address: client?.address || "",
                createdBy: updater.id,
              },
            });
            customerId = newCustomer.id;
          }

          // Create the sale - use CALCULATED discount amount for sale record
          const sale = await db.sale.create({
            data: {
              saleNumber,
              customerId: customerId,
              customerName: client?.name || "Invoice Customer",
              customerEmail: client?.email,
              customerPhone: client?.phone,
              customerAddress: client?.address,
              status: "COMPLETED",
              subtotal: Number(subtotal),
              tax: Number(totalTax),
              discount: Number(calculatedDiscountAmount), // Use calculated amount for sale
              discountPercent:
                discountType === "PERCENTAGE" && discountAmount
                  ? Number(discountAmount) // Store percentage for reporting
                  : 0,
              total: Number(totalAmount),
              paymentStatus: "COMPLETED",
              paymentMethod: "INVOICE",
              amountReceived: Number(totalAmount),
              saleDate: new Date(),
              createdBy: updater.id,
              orderId: params.id,
            },
          });

          // Create sale items and update stock
          for (const item of itemsWithProducts) {
            const shopProductId = item.shopProductId;
            const quantity = Math.floor(Number(item.quantity));

            if (!shopProductId) continue;

            await db.saleItem.create({
              data: {
                saleId: sale.id,
                shopProductId: shopProductId,
                quantity: quantity,
                price: Number(item.unitPrice),
                total: Number(item.amount),
              },
            });

            // Update product stock
            const product = await db.shopProduct.findUnique({
              where: { id: shopProductId },
            });

            if (product) {
              const newStock = product.stock - quantity;

              await db.shopProduct.update({
                where: { id: shopProductId },
                data: {
                  stock: Math.max(0, newStock),
                },
              });

              await db.stockMovement.create({
                data: {
                  shopProductId: shopProductId,
                  type: StockMovementType.OUT,
                  quantity: quantity,
                  previousStock: product.stock,
                  newStock: Math.max(0, newStock),
                  reason: `Sale from invoice ${updatedInvoice.invoiceNumber}`,
                  reference: sale.saleNumber,
                  creater: updater.name,
                },
              });
            }
          }
        }
      }
    }

    await db.notification.create({
      data: {
        title: "Invoice Updated",
        message: `Invoice ${updatedInvoice.invoiceNumber} has been updated by ${updater.name}.`,
        type: "INVOICE",
        isRead: false,
        actionUrl: `/dashboard/invoices/${updatedInvoice.id}`,
        userId: updater.id,
      },
    });

    return NextResponse.json({
      ...updatedInvoice,
      items: createdItems,
    });
  } catch (error) {
    console.error("Invoice update error:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

// Helper function to calculate next invoice date
function calculateNextDate(
  startDate: Date,
  frequency: string,
  interval: number
): Date {
  const date = new Date(startDate);

  switch (frequency) {
    case "DAILY":
      date.setDate(date.getDate() + interval);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + interval * 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + interval);
      break;
    case "QUARTERLY":
      date.setMonth(date.getMonth() + interval * 3);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + interval);
      break;
  }

  return date;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        items: true,
        payments: {
          orderBy: {
            paidAt: "desc",
          },
        },
        creator: {
          select: {
            GeneralSetting: true,
            name: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const creator = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creator) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return new NextResponse("Invoice Not Found", { status: 401 });
    }

    await db.invoiceItem.deleteMany({
      where: { invoiceId: params.id },
    });

    // Then delete the invoice
    const deletedInvoice = await db.invoice.delete({
      where: { id: params.id },
    });

    await db.notification.create({
      data: {
        title: "Invoice Deleted",
        message: `Invoice ${invoice?.invoiceNumber} , has been deleted By ${creator.name}.`,
        type: "INVOICE",
        isRead: false,
        userId: creator.id,
      },
    });

    return NextResponse.json(deletedInvoice);
  } catch (error) {
    console.error("Invoice deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
