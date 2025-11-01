import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { receiptGenerator } from "@/lib/receipt-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await db.order.findUnique({
      where: {
        id: params.id,
      },
      include: {
        Customer: true,
        OrderItem: {
          include: {
            ShopProduct: true,
          },
        },
        sale: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Use sale amounts directly without VAT calculations
    const subtotal =
      order.sale?.subtotal ||
      order.OrderItem.reduce((sum, item) => sum + item.total, 0);
    const discount = order.sale?.discount || 0;
    const total = subtotal - discount;

    // Transform order data to receipt format
    const receiptData = {
      id: order.id,
      saleNumber: order.orderNumber,
      saleDate: order.createdAt,
      customerName: order.Customer
        ? `${order.Customer.firstName} ${order.Customer.lastName}`
        : undefined,
      customerPhone: order.Customer?.phone,
      customerEmail: order.Customer?.email,
      items: order.OrderItem.map((item) => ({
        id: item.id,
        shopProductId: item.shopProductId,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        product: {
          name: item.ShopProduct.name || "Product",
          sku: item.ShopProduct?.sku || "N/A",
        },
      })),
      subtotal,
      discount,
      discountPercent: order.sale?.discountPercent || 0,
      tax: 0, // Remove VAT
      taxPercent: 0, // Remove VAT
      total,
      paymentMethod: order.sale?.paymentMethod || "CASH",
      amountReceived: order.sale?.amountReceived,
      change: order.sale?.change,
    };

    const receiptHTML = await receiptGenerator.generateReceiptHTML(
      receiptData,
      "A4"
    );

    return new NextResponse(receiptHTML, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error generating receipt:", error);
    return NextResponse.json(
      { error: "Failed to generate receipt" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { email } = await request.json();

    const order = await db.order.findUnique({
      where: {
        id: params.id,
      },
      include: {
        Customer: true,
        OrderItem: {
          include: {
            ShopProduct: true,
          },
        },
        sale: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Use sale amounts directly without VAT calculations
    const subtotal =
      order.sale?.subtotal ||
      order.OrderItem.reduce((sum, item) => sum + item.total, 0);
    const discount = order.sale?.discount || 0;
    const total = subtotal - discount;

    // Transform order data to receipt format
    const receiptData = {
      id: order.id,
      saleNumber: order.orderNumber,
      saleDate: order.createdAt,
      customerName: order.Customer
        ? `${order.Customer.firstName} ${order.Customer.lastName}`
        : undefined,
      customerPhone: order.Customer?.phone,
      customerEmail: order.Customer?.email,
      items: order.OrderItem.map((item) => ({
        id: item.id,
        shopProductId: item.shopProductId,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        product: {
          name: item.ShopProduct?.name || "Product",
          sku: item.ShopProduct?.sku || "N/A",
        },
      })),
      subtotal,
      discount,
      discountPercent: order.sale?.discountPercent || 0,
      tax: 0, // Remove VAT
      taxPercent: 0, // Remove VAT
      total,
      paymentMethod: order.sale?.paymentMethod || "CASH",
      amountReceived: order.sale?.amountReceived,
      change: order.sale?.change,
    };

    const receiptHTML =
      await receiptGenerator.generateReceiptForEmail(receiptData);

    // Send email
    const emailResponse = await fetch(
      `${process.env.NEXTAUTH_URL}/api/shop/sales/send-receipt`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject: `Order Receipt - ${order.orderNumber}`,
          html: receiptHTML,
          saleNumber: order.orderNumber,
        }),
      }
    );

    if (!emailResponse.ok) {
      throw new Error("Failed to send email");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending receipt:", error);
    return NextResponse.json(
      { error: "Failed to send receipt" },
      { status: 500 }
    );
  }
}
