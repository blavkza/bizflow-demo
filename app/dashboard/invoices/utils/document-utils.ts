import { InvoiceDocumentType, DocumentStatus } from "@prisma/client";

export interface DocumentConversionOptions {
  invoiceId: string;
  documentType: InvoiceDocumentType;
  customData?: {
    referenceNumber?: string;
    deliveryAddress?: any;
    shippingMethod?: string;
    shippingTrackingNumber?: string;
    notes?: string;
    terms?: string;
    purchaseOrderNumber?: string;
    deliveryNoteNumber?: string;
  };
}

export async function convertInvoiceToDocument(
  options: DocumentConversionOptions
): Promise<any> {
  const response = await fetch("/api/invoices/documents/convert", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invoiceId: options.invoiceId,
      invoiceDocumentType: options.documentType,
      customData: options.customData || {},
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to convert document");
  }

  return response.json();
}

export function getDocumentTypeLabel(type: InvoiceDocumentType): string {
  const labels: Record<InvoiceDocumentType, string> = {
    DELIVERY_NOTE: "Delivery Note",
    PURCHASE_ORDER: "Purchase Order",
    PRO_FORMA_INVOICE: "Pro Forma Invoice",
    CREDIT_NOTE: "Credit Note",
    SUPPLIER_LIST: "Supplier List",
    INVOICE: "Invoice",
  };
  return labels[type] || type;
}

export function getDocumentStatusColor(status: DocumentStatus): string {
  const colors: Record<DocumentStatus, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    SENT: "bg-blue-100 text-blue-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    PAID: "bg-emerald-100 text-emerald-800",
    PARTIALLY_PAID: "bg-yellow-100 text-yellow-800",
    OVERDUE: "bg-orange-100 text-orange-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
