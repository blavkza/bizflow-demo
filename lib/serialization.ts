export function serializeInvoice(invoice: any) {
  return {
    ...invoice,
    amount: invoice.amount?.toNumber() || 0,
    subtotal: invoice.subtotal?.toNumber() || 0,
    tax: invoice.tax?.toNumber() || 0,
    taxAmount: invoice.taxAmount?.toNumber() || 0,
    totalAmount: invoice.totalAmount?.toNumber() || 0,
    discountAmount: invoice.discountAmount?.toNumber() || 0,
    items: invoice.items?.map((item: any) => ({
      ...item,
      quantity: item.quantity?.toNumber() || 0,
      unitPrice: item.unitPrice?.toNumber() || 0,
      amount: item.amount?.toNumber() || 0,
      taxAmount: item.taxAmount?.toNumber() || 0,
    })),
    issueDate: invoice.issueDate?.toISOString(),
    dueDate: invoice.dueDate?.toISOString(),
    paidDate: invoice.paidDate?.toISOString(),
    createdAt: invoice.createdAt?.toISOString(),
    updatedAt: invoice.updatedAt?.toISOString(),
  };
}
