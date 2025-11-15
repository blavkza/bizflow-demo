import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { toDecimal, toNumber } from "@/lib/decimal";
import { Decimal } from "@prisma/client/runtime/library";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!updater) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();

    await db.quotationItem.deleteMany({
      where: { quotationId: params.id },
    });

    // 1. Calculate subtotal first
    const subtotal = body.items.reduce(
      (sum: Decimal, item: any) =>
        sum.add(toDecimal(item.quantity).mul(toDecimal(item.unitPrice))),
      new Decimal(0)
    );

    // 2. Calculate discount amount
    let discountAmount = new Decimal(0);
    let discountAmountToStore = toDecimal(body.discountAmount || 0);

    if (body.discountType === "PERCENTAGE" && body.discountAmount) {
      discountAmount = subtotal.mul(toDecimal(body.discountAmount)).div(100);
      discountAmountToStore = toDecimal(body.discountAmount);
    } else if (body.discountType === "AMOUNT" && body.discountAmount) {
      discountAmount = toDecimal(body.discountAmount);
      discountAmountToStore = toDecimal(body.discountAmount);
    }

    if (discountAmount.greaterThan(subtotal)) {
      discountAmount = subtotal;
    }

    const discountedSubtotal = subtotal.sub(discountAmount);

    const discountRatio = subtotal.greaterThan(0)
      ? discountAmount.div(subtotal)
      : new Decimal(0);

    const itemsWithAmounts = body.items.map((item: any) => {
      const quantity = toDecimal(item.quantity);
      const unitPrice = toDecimal(item.unitPrice);
      const taxRate = toDecimal(item.taxRate || 0);

      const amount = quantity.mul(unitPrice);

      const discountedAmount = amount.sub(amount.mul(discountRatio));

      const taxAmount = discountedAmount.mul(taxRate).div(100);

      return {
        description: item.description,
        quantity,
        unitPrice,
        taxRate,
        amount,
        taxAmount,
      };
    });

    const totalTax = itemsWithAmounts.reduce(
      (sum: Decimal, item: any) => sum.add(item.taxAmount),
      new Decimal(0)
    );

    const totalAmount = discountedSubtotal.add(totalTax);

    const taxRate = discountedSubtotal.greaterThan(0)
      ? totalTax.div(discountedSubtotal).mul(100)
      : new Decimal(0);

    let calculatedDepositAmount = new Decimal(0);
    if (body.depositRequired) {
      if (body.depositType === "PERCENTAGE" && body.depositAmount) {
        calculatedDepositAmount = totalAmount
          .mul(toDecimal(body.depositAmount))
          .div(100);
      } else if (body.depositType === "AMOUNT" && body.depositAmount) {
        calculatedDepositAmount = toDecimal(body.depositAmount);
      }

      if (calculatedDepositAmount.greaterThan(totalAmount)) {
        calculatedDepositAmount = totalAmount;
      }
    }

    const quotation = await db.quotation.update({
      where: { id: params.id },
      data: {
        clientId: body.clientId,
        title: body.title,
        issueDate: new Date(body.issueDate),
        validUntil: new Date(body.validUntil),
        description: body.description,
        paymentTerms: body.paymentTerms,
        notes: body.notes,
        discountType: body.discountType,
        discountAmount: discountAmountToStore,
        depositRequired: body.depositRequired,
        depositType: body.depositType,
        depositAmount: calculatedDepositAmount.greaterThan(0)
          ? calculatedDepositAmount
          : null,
        depositRate: body.depositType === "PERCENTAGE" ? body.depositAmount : 0,
        amount: subtotal,
        taxAmount: totalTax,
        taxRate: taxRate,
        totalAmount,
        items: {
          create: itemsWithAmounts,
        },
      },
      include: {
        client: true,
        items: true,
      },
    });

    await db.notification.create({
      data: {
        title: "Quotation Updated",
        message: `Quotation ${quotation.quotationNumber} has been updated by ${updater.name}.`,
        type: "QUOTATION",
        isRead: false,
        actionUrl: `/dashboard/quotations/${quotation.id}`,
        userId: updater.id,
      },
    });

    return NextResponse.json(quotation);
  } catch (error) {
    console.error("Failed to update quotation:", error);
    return NextResponse.json(
      { message: "Failed to update quotation" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const quotation = await db.quotation.findUnique({
      where: {
        id,
      },
      include: {
        client: true,
        creator: {
          include: {
            GeneralSetting: {
              select: {
                logo: true,
                companyName: true,
                Address: true,
                city: true,
                taxId: true,
                province: true,
                postCode: true,
                email: true,
                phone: true,
                phone2: true,
                phone3: true,
                website: true,
                bankAccount: true,
                bankAccount2: true,
                bankName: true,
                bankName2: true,
              },
            },
          },
        },

        items: true,
      },
    });

    if (!quotation) {
      return new NextResponse("Quotation not found", { status: 404 });
    }

    return NextResponse.json(quotation);
  } catch (error) {
    console.error("[QUOTATION_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = await params.id;
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

    const existingQuotation = await db.quotation.findUnique({
      where: {
        id,
      },
    });

    if (!existingQuotation) {
      return new NextResponse("Quotation not found", { status: 404 });
    }

    await db.quotation.delete({
      where: {
        id,
      },
    });

    await db.notification.create({
      data: {
        title: "Quotation Deleted",
        message: `Quotation ${existingQuotation?.quotationNumber} , has been deleted By ${creator.name}.`,
        type: "QUOTATION",
        isRead: false,
        userId: creator.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[QUOTATION_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
