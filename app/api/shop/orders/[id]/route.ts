import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const order = await db.order.findUnique({
      where: {
        id: params.id,
      },
      include: {
        Customer: true,
        sale: {
          include: {
            items: {
              include: {
                ShopProduct: true,
              },
            },
          },
        },
        OrderItem: {
          include: {
            ShopProduct: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get assigned employee if assignedTo exists
    let assignedEmployee = null;
    if (order.assignedTo) {
      assignedEmployee = await db.employee.findUnique({
        where: {
          id: order.assignedTo,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      });
    }

    // Transform the data
    const customerName = order.Customer
      ? `${order.Customer.firstName} ${order.Customer.lastName}`
      : "Walk-in Customer";

    const items = order.OrderItem.map((item) => ({
      id: item.id,
      shopProductId: item.shopProductId,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      product: {
        name: item.ShopProduct?.name || "Product",
        sku: item.ShopProduct?.sku || "N/A",
      },
    }));

    // Use sale amounts directly without VAT calculations
    const subtotal =
      order.sale.subtotal ||
      order.OrderItem.reduce((sum, item) => sum + item.total, 0);
    const discount = order.sale?.discount || 0;
    const total = subtotal - discount;

    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName,
      customerEmail: order.Customer?.email || "",
      customerPhone: order.Customer?.phone || "",
      items,
      subtotal,
      discount,
      total,
      discountPercent: order.sale?.discountPercent || 0,
      tax: 0, // Remove VAT
      taxPercent: 0, // Remove VAT
      status: order.status,
      paymentStatus: order.sale?.paymentStatus || "PENDING",
      orderDate: order.createdAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      shippingAddress: order.Customer?.address || "",
      shippingCity: order.Customer?.city || "",
      shippingProvince: order.Customer?.province || "",
      shippingPostal: order.Customer?.postalCode || "",
      shippingCountry: order.Customer?.country || "South Africa",
      assignedTo: order.assignedTo,
      assignedEmployee: assignedEmployee
        ? {
            id: assignedEmployee.id,
            name: `${assignedEmployee.firstName} ${assignedEmployee.lastName}`,
            email: assignedEmployee.email,
            phone: assignedEmployee.phone,
          }
        : null,
      processedBy: order.User
        ? {
            id: order.User.id,
            name: order.User.name,
            email: order.User.email,
          }
        : null,
      carrier: order.carrier,
      deliveryDate: order.deliveryDate,
      notes: "",
      shippedDate: order.deliveryDate || null,
      deliveredDate: null,
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
