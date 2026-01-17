import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { DiscountType } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const subpackageId = params.id;

    const body = await req.json();
    const clientId = body.clientId;

    if (!clientId) {
      return new NextResponse("Client ID is required", { status: 400 });
    }

    // Generate quotation number outside transaction to reduce transaction time
    const lastQuotation = await db.quotation.findFirst({
      orderBy: { createdAt: "desc" },
      select: { quotationNumber: true },
    });

    const quotationNumber =
      lastQuotation && lastQuotation.quotationNumber
        ? (() => {
            const match = lastQuotation.quotationNumber.match(/QT-(\d+)/);
            if (match) {
              const lastNumber = parseInt(match[1]);
              return `QT-${(lastNumber + 1).toString().padStart(4, "0")}`;
            }
            return "QT-0001";
          })()
        : "QT-0001";

    // Fetch data outside transaction
    const [client, subpackage, creator, settings] = await Promise.all([
      db.client.findUnique({
        where: { id: clientId },
      }),
      db.subpackage.findUnique({
        where: { id: subpackageId },
        include: {
          package: true,
          products: {
            include: {
              product: true,
            },
          },
          services: {
            include: {
              service: true,
            },
          },
        },
      }),
      db.user.findUnique({
        where: { userId },
        select: { id: true, name: true },
      }),
      db.generalSetting.findFirst(),
    ]);

    if (!client) {
      return new NextResponse("Client not found", { status: 404 });
    }

    if (!subpackage) {
      return new NextResponse("Subpackage not found", { status: 404 });
    }

    if (!creator) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Calculate totals USING EXISTING VALUES FROM SUBPACKAGE
    let subtotal = 0;
    let totalItemDiscounts = 0;
    let totalTaxAmount = 0;

    interface QuotationItemInput {
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      taxAmount: number;
      shopProductId?: string;
      serviceId?: string;
      itemDiscountType: DiscountType | null;
      itemDiscountAmount: number;
      amount: number; // Total amount (net + tax)
    }

    const items: QuotationItemInput[] = [];

    // Process products WITH EXISTING DISCOUNTS AND TAX
    for (const product of subpackage.products) {
      const unitPrice = Number(product.unitPrice || product.product.price || 0);
      const quantity = product.quantity || 1;
      const baseAmount = unitPrice * quantity;
      subtotal += baseAmount;

      // Use existing item discount values
      const itemDiscountAmount = product.itemDiscountAmount
        ? Number(product.itemDiscountAmount)
        : 0;
      const itemDiscountType = product.itemDiscountType as DiscountType | null;

      if (itemDiscountAmount > 0) {
        totalItemDiscounts += itemDiscountAmount;
      }

      // Use existing tax values or calculate from tax rate
      const taxRate = product.taxRate ? Number(product.taxRate) : 15;
      const taxAmount = product.taxAmount
        ? Number(product.taxAmount)
        : ((baseAmount - itemDiscountAmount) * taxRate) / 100;

      totalTaxAmount += taxAmount;

      // Calculate item total (base - discount + tax)
      const itemNetAmount = baseAmount - itemDiscountAmount;
      const itemTotalAmount = itemNetAmount + taxAmount;

      items.push({
        description: product.product.name,
        quantity: quantity,
        unitPrice: unitPrice,
        taxRate: taxRate,
        taxAmount: taxAmount,
        shopProductId: product.product.id,
        itemDiscountType: itemDiscountType,
        itemDiscountAmount: itemDiscountAmount,
        amount: itemTotalAmount,
      });
    }

    // Process services WITH EXISTING DISCOUNTS AND TAX
    for (const service of subpackage.services) {
      const unitPrice = Number(
        service.unitPrice || service.service.amount || 0
      );
      const quantity = service.quantity || 1;
      const baseAmount = unitPrice * quantity;
      subtotal += baseAmount;

      // Use existing item discount values
      const itemDiscountAmount = service.itemDiscountAmount
        ? Number(service.itemDiscountAmount)
        : 0;
      const itemDiscountType = service.itemDiscountType as DiscountType | null;

      if (itemDiscountAmount > 0) {
        totalItemDiscounts += itemDiscountAmount;
      }

      // Use existing tax values or calculate from tax rate
      const taxRate = service.taxRate ? Number(service.taxRate) : 15;
      const taxAmount = service.taxAmount
        ? Number(service.taxAmount)
        : ((baseAmount - itemDiscountAmount) * taxRate) / 100;

      totalTaxAmount += taxAmount;

      // Calculate item total (base - discount + tax)
      const itemNetAmount = baseAmount - itemDiscountAmount;
      const itemTotalAmount = itemNetAmount + taxAmount;

      items.push({
        description: service.service.name,
        quantity: quantity,
        unitPrice: unitPrice,
        taxRate: taxRate,
        taxAmount: taxAmount,
        serviceId: service.service.id,
        itemDiscountType: itemDiscountType,
        itemDiscountAmount: itemDiscountAmount,
        amount: itemTotalAmount,
      });
    }

    // Use subpackage discount as is (global discount)
    let globalDiscountAmount = 0;
    let discountType: DiscountType | null = null;

    if (subpackage.discount && subpackage.discountType) {
      globalDiscountAmount = Number(subpackage.discount);

      if (subpackage.discountType === "percentage") {
        discountType = "PERCENTAGE";
      } else {
        discountType = "AMOUNT";
      }
    }

    // Use the subpackage final price as the total amount
    const subpackageFinalPrice = Number(subpackage.price || 0);

    // Create quotation with INCREASED TIMEOUT
    const result = await db.$transaction(
      async (prisma) => {
        const quotation = await prisma.quotation.create({
          data: {
            quotationNumber, // Use pre-generated number
            clientId: clientId,
            projectId: null,
            amount: subtotal,
            status: "DRAFT",
            issueDate: new Date(),
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            title: `Quotation for ${subpackage.name}`,
            description:
              subpackage.description ||
              `Quotation generated from ${subpackage.name} subpackage for ${client.name}`,
            taxAmount: totalTaxAmount,
            taxRate: 15,
            discountAmount: globalDiscountAmount,
            discountType: discountType,
            totalAmount: subpackageFinalPrice,
            depositRequired: false,
            depositType: "AMOUNT",
            depositAmount: 0,
            notes: settings?.note || "Terms and conditions apply",
            paymentTerms: settings?.paymentTerms || "Net 30 days",
            deliveryTerms: "Standard delivery",
            packageId: subpackage.packageId,
            subpackageId: subpackage.id,
            createdBy: creator.id,
          },
        });

        // Create quotation items in batch
        if (items.length > 0) {
          await prisma.quotationItem.createMany({
            data: items.map((item, index) => ({
              quotationId: quotation.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
              taxRate: item.taxRate,
              taxAmount: item.taxAmount,
              shopProductId: item.shopProductId || null,
              serviceId: item.serviceId || null,
              itemDiscountType: item.itemDiscountType,
              itemDiscountAmount: item.itemDiscountAmount,
              sortOrder: index,
            })),
          });
        }

        // Create notification outside transaction to reduce transaction time
        // We'll do this after the transaction commits
        return quotation;
      },
      {
        maxWait: 10000, // Increased max wait time
        timeout: 15000, // Increased timeout to 15 seconds
      }
    );

    // Create notification AFTER transaction completes
    await db.notification.create({
      data: {
        title: "Quotation Created from Subpackage",
        message: `Quotation ${result.quotationNumber} has been created from subpackage "${subpackage.name}" for ${client.name}.`,
        type: "QUOTATION",
        isRead: false,
        actionUrl: `/dashboard/quotations/${result.id}`,
        userId: creator.id,
      },
    });

    // Return the quotation ID for redirection
    return NextResponse.json({
      success: true,
      quotationId: result.id,
      quotationNumber: result.quotationNumber,
      redirectUrl: `/dashboard/quotations/${result.id}/edit`,
    });
  } catch (error: any) {
    console.error("[SUBPACKAGE_CONVERT_TO_QUOTATION]", error);

    // Return more specific error messages
    if (error.code === "P2028") {
      return new NextResponse(
        JSON.stringify({
          message:
            "Transaction timeout. The operation took too long. Please try again.",
          error: "Transaction timeout",
        }),
        { status: 408 } // Request Timeout
      );
    }

    if (error.code === "P2025") {
      return new NextResponse(
        JSON.stringify({
          message:
            "One or more records were not found. Please refresh and try again.",
          error: "Record not found",
        }),
        { status: 404 }
      );
    }

    return new NextResponse(
      JSON.stringify({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
