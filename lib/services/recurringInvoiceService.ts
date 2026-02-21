import { db } from "@/lib/db";

export async function generateRecurringInvoices() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find recurring invoices that are due
    const dueRecurringInvoices = await db.recurringInvoice.findMany({
      where: {
        status: "ACTIVE",
        nextDate: {
          lte: today,
        },
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
      include: {
        client: true,
      },
    });

    for (const recurring of dueRecurringInvoices) {
      await generateInvoiceFromRecurring(recurring);
    }

    return { generated: dueRecurringInvoices.length };
  } catch (error) {
    console.error("[GENERATE_RECURRING_INVOICES]", error);
    throw error;
  }
}

async function generateInvoiceFromRecurring(recurring: any) {
  // Generate invoice number
  const lastInvoice = await db.invoice.findFirst({
    orderBy: { createdAt: "desc" },
    select: { invoiceNumber: true },
  });

  const invoiceNumber = lastInvoice
    ? `INV-${parseInt(lastInvoice.invoiceNumber.split("-")[1]) + 1}`
    : "INV-0001";

  // Calculate amounts
  const items = recurring.items as any[];
  const itemsWithAmounts = items.map((item) => ({
    ...item,
    amount: item.quantity * item.unitPrice,
    taxAmount: item.taxRate
      ? (item.quantity * item.unitPrice * item.taxRate) / 100
      : 0,
  }));

  const subtotal = itemsWithAmounts.reduce((sum, item) => sum + item.amount, 0);
  const totalTax = itemsWithAmounts.reduce(
    (sum, item) => sum + (item.taxAmount || 0),
    0,
  );

  let discountAmount = 0;
  if (recurring.discountType === "PERCENTAGE" && recurring.discountAmount) {
    discountAmount = subtotal * (recurring.discountAmount / 100);
  } else if (recurring.discountType === "AMOUNT" && recurring.discountAmount) {
    discountAmount = recurring.discountAmount;
  }

  const interestAmount = recurring.interestAmount
    ? parseFloat(recurring.interestAmount.toString())
    : 0;
  const totalAmount = subtotal + totalTax - discountAmount + interestAmount;

  // Create the invoice
  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      clientId: recurring.clientId,
      project:
        recurring.description ||
        `Recurring Invoice ${recurring.frequency.toLowerCase()}`,
      amount: subtotal,
      currency: recurring.currency,
      status: "DRAFT",
      issueDate: new Date(),
      dueDate: calculateDueDate(new Date(), 30), // 30 days from issue
      description: recurring.description,
      taxAmount: totalTax,
      taxRate: subtotal > 0 ? totalTax / subtotal : 0,
      discountAmount: discountAmount,
      discountType: recurring.discountType,
      totalAmount,
      paymentTerms: recurring.paymentTerms,
      notes: recurring.notes,
      interestAmount: recurring.interestAmount,
      interestRate: recurring.interestRate,
      installmentPeriod: recurring.installmentPeriod,
      createdBy: recurring.creator,
      isRecurring: true,
      recurringId: recurring.id,
    },
  });

  // Create invoice items
  await db.invoiceItem.createMany({
    data: itemsWithAmounts.map((item) => ({
      invoiceId: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      currency: recurring.currency,
      taxRate: item.taxRate ? item.taxRate / 100 : 0,
      taxAmount: item.taxAmount,
      shopProductId: item.shopProductId || null,
    })),
  });

  // Update recurring invoice
  const nextDate = calculateNextDate(
    new Date(),
    recurring.frequency,
    recurring.interval,
  );

  await db.recurringInvoice.update({
    where: { id: recurring.id },
    data: {
      nextDate,
      totalInvoicesGenerated: { increment: 1 },
      lastGeneratedAt: new Date(),
    },
  });

  return invoice;
}

function calculateDueDate(issueDate: Date, days: number): Date {
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate;
}

function calculateNextDate(
  currentDate: Date,
  frequency: string,
  interval: number,
): Date {
  const date = new Date(currentDate);

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
