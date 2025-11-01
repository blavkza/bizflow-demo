import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the first POS settings (global settings for all users)
    let posSettings = await db.pOSSetting.findFirst();

    // Create default settings if not exists
    if (!posSettings) {
      posSettings = await db.pOSSetting.create({
        data: {
          vatEnabled: true,
          vatRate: 0.15,
          deliveryEnabled: true,
          deliveryFee: 50.0,
          freeDeliveryAbove: 500.0,
          discountEnabled: true,
          maxDiscountRate: 20.0,
          printAutomatically: false,
          emailReceipt: true,
        },
      });
    }

    return NextResponse.json(posSettings);
  } catch (error) {
    console.error("[GET_POS_SETTINGS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get existing settings or create if doesn't exist
    let posSettings = await db.pOSSetting.findFirst();

    if (posSettings) {
      // Update existing settings
      posSettings = await db.pOSSetting.update({
        where: { id: posSettings.id },
        data: {
          vatEnabled: body.vatEnabled,
          vatRate: body.vatRate,
          deliveryEnabled: body.deliveryEnabled,
          deliveryFee: body.deliveryFee,
          freeDeliveryAbove: body.freeDeliveryAbove,
          discountEnabled: body.discounEnabled,
          maxDiscountRate: body.maxDiscountRate,
          receiptHeader: body.receiptHeader,
          receiptFooter: body.receiptFooter,
          printAutomatically: body.printAutomatically,
          emailReceipt: body.emailReceipt,
        },
      });
    } else {
      // Create new settings
      posSettings = await db.pOSSetting.create({
        data: {
          vatEnabled: body.vatEnabled,
          vatRate: body.vatRate,
          deliveryEnabled: body.deliveryEnabled,
          deliveryFee: body.deliveryFee,
          freeDeliveryAbove: body.freeDeliveryAbove,
          discountEnabled: body.discountEnabled,
          maxDiscountRate: body.maxDiscountRate,
          receiptHeader: body.receiptHeader,
          receiptFooter: body.receiptFooter,
          printAutomatically: body.printAutomatically,
          emailReceipt: body.emailReceipt,
        },
      });
    }

    return NextResponse.json(posSettings);
  } catch (error) {
    console.error("[UPDATE_POS_SETTINGS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
