import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import {
  InvoiceDocumentType,
  DocumentStatus,
  DiscountType,
} from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, invoiceDocumentType, customData = {} } = body;

    if (!invoiceId || !invoiceDocumentType) {
      return NextResponse.json(
        { error: "invoiceId and invoiceDocumentType are required" },
        { status: 400 }
      );
    }

    // Fetch invoice with correct relation names (capital P for Project)
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        items: {
          include: {
            shopProduct: true,
            service: true,
          },
        },
        creator: true,
        Project: true, // Changed from project to Project
        Department: true, // Changed from department to Department
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Generate document number
    const invoiceDocumentNumber =
      await generateDocumentNumber(invoiceDocumentType);

    // Calculate subtotal from items

    // Create invoice document with proper data mapping
    const documentData: any = {
      invoiceDocumentNumber,
      invoiceDocumentType,
      status: DocumentStatus.DRAFT,
      invoiceId: invoice.id,
      originalDocumentId: invoice.id,
      clientId: invoice.clientId,
      issueDate: new Date(),
      dueDate:
        invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: invoice.totalAmount,
      taxAmount: invoice.taxAmount || 0,
      discountAmount: invoice.discountAmount || 0,
      discountType: invoice.depositType || null,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      referenceNumber: customData.referenceNumber,
      purchaseOrderNumber: customData.purchaseOrderNumber,
      deliveryNoteNumber: customData.deliveryNoteNumber,
      invoiceNumber: invoice.invoiceNumber,
      paymentTerms: invoice.paymentTerms || "Net 30",
      notes: customData.notes || invoice.notes,
      terms: customData.terms || invoice.terms,
      createdBy: user.id,
      supplierId: customData.supplierId || null,
      projectId: invoice.projectId,
      departmentId: invoice.departmentId,
    };

    // Add optional fields if they exist
    if (customData.deliveryAddress) {
      documentData.deliveryAddress = customData.deliveryAddress;
    }
    if (customData.shippingMethod) {
      documentData.shippingMethod = customData.shippingMethod;
    }
    if (customData.shippingTrackingNumber) {
      documentData.shippingTrackingNumber = customData.shippingTrackingNumber;
    }

    // Create the document with items
    const document = await db.invoiceDocument.create({
      data: {
        ...documentData,
        items: {
          create: invoice.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            currency: item.currency || "ZAR",
            productId: item.shopProductId,
            serviceId: item.serviceId,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            unitOfMeasure: "kg", // Default unit
          })),
        },
      },
      include: {
        client: true,
        items: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error converting document:", error);
    return NextResponse.json(
      {
        error: "Failed to convert document",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function generateDocumentNumber(
  invoiceDocumentType: InvoiceDocumentType
): Promise<string> {
  const prefixMap: Record<InvoiceDocumentType, string> = {
    DELIVERY_NOTE: "DN",
    PURCHASE_ORDER: "PO",
    PRO_FORMA_INVOICE: "PF",
    CREDIT_NOTE: "CN",
    SUPPLIER_LIST: "SL",
    INVOICE: "INV",
  };

  const prefix = prefixMap[invoiceDocumentType] || "DOC";

  // Get current year
  const year = new Date().getFullYear();

  // Count documents of this type for the current year
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

  const count = await db.invoiceDocument.count({
    where: {
      invoiceDocumentType,
      createdAt: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
  });

  const sequentialNumber = (count + 1).toString().padStart(4, "0");

  return `${prefix}-${year}-${sequentialNumber}`;
}
