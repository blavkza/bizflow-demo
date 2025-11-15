import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { InvoiceStatus, StockMovementType } from "@prisma/client";

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

    // Store the ORIGINAL discount values, not calculated amounts
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

    // Handle deposit - ALWAYS treat depositAmount as monetary value
    const depositAmount = invoiceData.depositAmount || 0;

    let calculatedDepositAmount = 0;
    if (invoiceData.depositRequired) {
      if (
        invoiceData.depositType === "PERCENTAGE" &&
        invoiceData.depositAmount
      ) {
        calculatedDepositAmount =
          totalAmount * (invoiceData.depositAmount / 100);
      } else if (
        invoiceData.depositType === "AMOUNT" &&
        invoiceData.depositAmount
      ) {
        calculatedDepositAmount = invoiceData.depositAmount;
      }

      // Ensure deposit cannot exceed total amount
      calculatedDepositAmount = Math.min(calculatedDepositAmount, totalAmount);
    }

    // Check if deposit requirements changed
    const originalDepositRequired = originalInvoice.depositRequired || false;
    const originalDepositAmount = Number(originalInvoice.depositAmount) || 0;
    const depositChanged =
      originalDepositRequired !== invoiceData.depositRequired ||
      originalDepositAmount !== depositAmount;

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
            // Add deposit fields to recurring invoice
            depositRequired: invoiceData.depositRequired || false,
            depositType: invoiceData.depositType,
            depositAmount: calculatedDepositAmount,
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
            // Add deposit fields to recurring invoice
            depositRequired: invoiceData.depositRequired || false,
            depositType: invoiceData.depositType,
            depositAmount: depositAmount,
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

        // Deposit fields - same as POST handler
        depositRequired: invoiceData.depositRequired || false,
        depositType: invoiceData.depositType,
        depositAmount: calculatedDepositAmount,
        depositRate:
          invoiceData.depositType === "PERCENTAGE"
            ? invoiceData.depositAmount
            : 0,
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

    // Handle deposit payment updates if deposit requirements changed
    if (depositChanged) {
      await handleDepositPaymentUpdate(
        updatedInvoice,
        calculatedDepositAmount,
        totalAmount,
        invoiceData,
        updater,
        originalDepositAmount
      );
    }

    // Check if invoice has shop products and handle stock adjustments
    const itemsWithProducts = itemsWithAmounts.filter(
      (item: any) => item.shopProductId
    );

    // Calculate product-specific totals for sales
    const productsSubtotal = itemsWithProducts.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity,
      0
    );

    const productsTax = itemsWithProducts.reduce(
      (sum: number, item: any) => sum + (item.taxAmount || 0),
      0
    );

    const productsTotal = productsSubtotal + productsTax;

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
            subtotal: Number(productsSubtotal),
            tax: Number(productsTax),
            total: Number(productsTotal),
            amountReceived: Number(productsTotal),
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
              subtotal: Number(productsSubtotal),
              tax: Number(productsTax),
              total: Number(productsTotal),
              paymentStatus: "COMPLETED",
              paymentMethod: "INVOICE",
              amountReceived: Number(productsTotal),
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
        message: `Invoice ${updatedInvoice.invoiceNumber} has been updated by ${updater.name}.${depositChanged ? " Deposit requirements have been updated." : ""}`,
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

// Helper function to handle deposit payment updates
async function handleDepositPaymentUpdate(
  invoice: any,
  calculatedDepositAmount: number,
  totalAmount: number,
  invoiceData: any,
  updater: any,
  originalDepositAmount: number
) {
  // Find the FIRST deposit payment (there should only be one)
  const existingDepositPayment = await db.invoicePayment.findFirst({
    where: {
      invoiceId: invoice.id,
      reference: {
        contains: "DEPOSIT",
      },
    },
    orderBy: {
      createdAt: "asc", // Get the first one created
    },
  });

  if (existingDepositPayment) {
    // Check if deposit amount actually changed
    const depositAmountChanged =
      existingDepositPayment.amount.toNumber() !== calculatedDepositAmount;

    if (depositAmountChanged || !invoiceData.depositRequired) {
      if (invoiceData.depositRequired && calculatedDepositAmount > 0) {
        // Update existing deposit payment with new amount
        await db.invoicePayment.update({
          where: { id: existingDepositPayment.id },
          data: {
            amount: calculatedDepositAmount,
            notes: `Deposit payment for invoice ${invoice.invoiceNumber} - UPDATED from ${existingDepositPayment.amount} to ${calculatedDepositAmount}`,
            status: "COMPLETED", // Ensure it's still active
          },
        });

        // Update corresponding transaction
        await db.transaction.updateMany({
          where: {
            reference: existingDepositPayment.id,
            type: "INCOME",
          },
          data: {
            amount: calculatedDepositAmount,
            netAmount: calculatedDepositAmount,
            description: `Deposit payment for invoice ${invoice.invoiceNumber} - UPDATED from ${existingDepositPayment.amount} to ${calculatedDepositAmount}`,
            status: "COMPLETED",
          },
        });
      } else {
        // Deposit is being removed - mark as cancelled
        await db.invoicePayment.update({
          where: { id: existingDepositPayment.id },
          data: {
            status: "CANCELLED",
            notes: `Deposit cancelled for invoice ${invoice.invoiceNumber} - deposit requirement removed`,
          },
        });

        // Also update the transaction
        await db.transaction.updateMany({
          where: {
            reference: existingDepositPayment.id,
            type: "INCOME",
          },
          data: {
            status: "CANCELLED",
            description: `Deposit cancelled for invoice ${invoice.invoiceNumber}`,
          },
        });
      }

      // Update invoice status based on new deposit situation
      let newStatus = invoice.status;

      if (invoiceData.depositRequired && calculatedDepositAmount > 0) {
        if (calculatedDepositAmount >= totalAmount) {
          newStatus = InvoiceStatus.PAID;
        } else if (calculatedDepositAmount > 0) {
          newStatus = InvoiceStatus.PARTIALLY_PAID;
        }
      } else {
        // Deposit was removed, revert to appropriate status
        if (
          invoice.status === InvoiceStatus.PAID ||
          invoice.status === InvoiceStatus.PARTIALLY_PAID
        ) {
          newStatus = InvoiceStatus.SENT;
        }
      }

      if (newStatus !== invoice.status) {
        await db.invoice.update({
          where: { id: invoice.id },
          data: { status: newStatus },
        });
      }
    }
    // If deposit amount didn't change and deposit is still required, do nothing
  } else if (invoiceData.depositRequired && calculatedDepositAmount > 0) {
    // Create new deposit payment since none exists
    const paymentCategory = await getPaymentCategory(updater.id);

    // Create invoice payment for deposit
    const payment = await db.invoicePayment.create({
      data: {
        invoiceId: invoice.id,
        amount: calculatedDepositAmount,
        method: "INVOICE",
        reference: `DEPOSIT-${invoice.invoiceNumber}`,
        notes: `Initial deposit payment for invoice ${invoice.invoiceNumber}`,
        paidAt: new Date(invoiceData.issueDate),
        status: "COMPLETED",
      },
    });

    // Create transaction record for deposit
    await db.transaction.create({
      data: {
        amount: calculatedDepositAmount,
        currency: "ZAR",
        type: "INCOME",
        status: "COMPLETED",
        description: `Deposit payment for invoice ${invoice.invoiceNumber} from ${invoiceData.clientId}`,
        reference: payment.id,
        date: new Date(invoiceData.issueDate),
        method: "INVOICE",
        invoiceId: invoice.id,
        clientId: invoiceData.clientId,
        categoryId: paymentCategory.id,
        createdBy: updater.id,
        taxAmount: 0,
        netAmount: calculatedDepositAmount,
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    // Update invoice status based on deposit
    let newStatus = invoice.status;
    if (calculatedDepositAmount >= totalAmount) {
      newStatus = InvoiceStatus.PAID;
    } else if (calculatedDepositAmount > 0) {
      newStatus = InvoiceStatus.PARTIALLY_PAID;
    }

    if (newStatus !== invoice.status) {
      await db.invoice.update({
        where: { id: invoice.id },
        data: { status: newStatus },
      });
    }
  }
  // If no deposit payment exists and deposit is not required, do nothing
}

// Helper function to get payment category
async function getPaymentCategory(updaterId: string) {
  let paymentCategory = await db.category.findFirst({
    where: {
      name: "Invoice Payments",
      type: "INCOME",
    },
  });

  if (!paymentCategory) {
    paymentCategory = await db.category.create({
      data: {
        name: "Invoice Payments",
        type: "INCOME",
        description: "Payments received from invoices",
        createdBy: updaterId,
      },
    });
  }

  return paymentCategory;
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
