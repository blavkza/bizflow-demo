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

    const client = await db.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return new NextResponse("Client not found", { status: 404 });
    }

    const subpackage = await db.subpackage.findUnique({
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
    });

    if (!subpackage) {
      return new NextResponse("Subpackage not found", { status: 404 });
    }

    const creator = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!creator) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const settings = await db.generalSetting.findFirst();

    // Calculate totals
    let subtotal = 0;
    interface QuotationItemInput {
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      shopProductId?: string;
      serviceId?: string;
      itemDiscountType: DiscountType | null;
      itemDiscountAmount: number;
    }

    const items: QuotationItemInput[] = [];

    // Process products
    for (const product of subpackage.products) {
      const unitPrice = Number(product.unitPrice || product.product.price || 0);
      const quantity = product.quantity || 1;
      const amount = unitPrice * quantity;
      subtotal += amount;

      items.push({
        description: product.product.name,
        quantity: quantity,
        unitPrice: unitPrice,
        taxRate: 15,
        shopProductId: product.product.id,
        itemDiscountType: null,
        itemDiscountAmount: 0,
      });
    }

    // Process services
    for (const service of subpackage.services) {
      const unitPrice = Number(
        service.unitPrice || service.service.amount || 0
      );
      const quantity = service.quantity || 1;
      const amount = unitPrice * quantity;
      subtotal += amount;

      items.push({
        description: service.service.name,
        quantity: quantity,
        unitPrice: unitPrice,
        taxRate: 15,
        serviceId: service.service.id,
        itemDiscountType: null,
        itemDiscountAmount: 0,
      });
    }

    // Apply subpackage discount if exists
    let discountAmount = 0;
    let discountType: DiscountType = "AMOUNT";

    if (subpackage.discount && subpackage.discountType) {
      const discountValue = Number(subpackage.discount);
      const priceValue = Number(subpackage.price);

      if (subpackage.discountType === "percentage") {
        discountAmount = discountValue;
        discountType = "PERCENTAGE";
      } else {
        discountAmount = discountValue;
        discountType = "AMOUNT";
      }
    }

    const amountAfterDiscount = subtotal - discountAmount;

    // Calculate tax
    const taxRate = 15;
    const taxAmount = (amountAfterDiscount * taxRate) / 100;
    const totalAmount = amountAfterDiscount + taxAmount;

    // Generate quotation number
    const lastQuotation = await db.quotation.findFirst({
      orderBy: { createdAt: "desc" },
      select: { quotationNumber: true },
    });

    const quotationNumber = lastQuotation
      ? `QT-${(parseInt(lastQuotation.quotationNumber.split("-")[1]) + 1)
          .toString()
          .padStart(4, "0")}`
      : "QT-0001";

    // Create quotation with transaction
    const result = await db.$transaction(async (prisma) => {
      const quotation = await prisma.quotation.create({
        data: {
          quotationNumber,
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

          taxAmount: taxAmount,
          taxRate: taxRate,

          discountAmount: discountAmount,
          discountType: discountType,
          totalAmount: totalAmount,

          depositRequired: false,
          depositType: "AMOUNT",

          notes: settings?.note || "Terms and conditions apply",
          paymentTerms: settings?.paymentTerms || "Net 30 days",
          deliveryTerms: "Standard delivery",

          packageId: subpackage.packageId,
          subpackageId: subpackage.id,
          createdBy: creator.id,
        },
      });

      // Create quotation items
      if (items.length > 0) {
        await prisma.quotationItem.createMany({
          data: items.map((item, index) => ({
            quotationId: quotation.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.unitPrice * item.quantity,
            taxRate: item.taxRate,
            taxAmount: (item.unitPrice * item.quantity * item.taxRate) / 100,
            shopProductId: item.shopProductId || null,
            serviceId: item.serviceId || null,
            itemDiscountType: item.itemDiscountType,
            itemDiscountAmount: item.itemDiscountAmount,
            sortOrder: index,
          })),
        });
      }

      // Create notification
      await prisma.notification.create({
        data: {
          title: "Quotation Created from Subpackage",
          message: `Quotation ${quotationNumber} has been created from subpackage "${subpackage.name}" for ${client.name}.`,
          type: "QUOTATION",
          isRead: false,
          actionUrl: `/dashboard/quotations/${quotation.id}`,
          userId: creator.id,
        },
      });

      return quotation;
    });

    // Return the quotation ID for redirection
    return NextResponse.json({
      success: true,
      quotationId: result.id,
      redirectUrl: `/dashboard/quotations/${result.id}/edit`,
    });
  } catch (error) {
    console.error("[SUBPACKAGE_CONVERT_TO_QUOTATION]", error);
    return new NextResponse(
      JSON.stringify({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
