import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { toDecimal, toNumber } from "@/lib/decimal";
import { Decimal } from "@prisma/client/runtime/library";

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
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            taxNumber: true,
            company: true,
          },
        },
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
        items: {
          orderBy: {
            sortOrder: "asc",
          },
        },
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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // First delete all items to recreate them
    await db.quotationItem.deleteMany({
      where: { quotationId: params.id },
    });

    // Calculate amounts
    const itemsWithAmounts = body.items.map((item: any) => {
      const quantity = toDecimal(item.quantity);
      const unitPrice = toDecimal(item.unitPrice);
      const taxRate = toDecimal(item.taxRate || 0);
      const amount = quantity.mul(unitPrice);
      const taxAmount = amount.mul(taxRate).div(100);

      return {
        description: item.description,
        quantity,
        unitPrice,
        taxRate,
        amount,
        taxAmount,
      };
    });

    const subtotal = itemsWithAmounts.reduce(
      (sum: Decimal, item: any) => sum.add(item.amount),
      new Decimal(0)
    );

    const totalTax = itemsWithAmounts.reduce(
      (sum: Decimal, item: any) => sum.add(item.taxAmount),
      new Decimal(0)
    );

    let discountAmount = new Decimal(0);
    if (body.discountType === "PERCENTAGE" && body.discountAmount) {
      discountAmount = subtotal
        .add(totalTax)
        .mul(toDecimal(body.discountAmount))
        .div(100);
    } else if (body.discountType === "AMOUNT" && body.discountAmount) {
      discountAmount = toDecimal(body.discountAmount);
    }

    const totalAmount = subtotal.add(totalTax).sub(discountAmount);

    // Update the quotation
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
        discountAmount: discountAmount,
        amount: subtotal,
        taxAmount: totalTax,
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

    return NextResponse.json(quotation);
  } catch (error) {
    console.error("Failed to update quotation:", error);
    return NextResponse.json(
      { message: "Failed to update quotation" },
      { status: 500 }
    );
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

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[QUOTATION_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
