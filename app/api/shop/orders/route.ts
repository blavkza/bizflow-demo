import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");

    // Build where clause for filtering
    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        {
          Customer: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (status && status !== "All") {
      where.status = status;
    }

    if (paymentStatus && paymentStatus !== "All") {
      where.sale = {
        paymentStatus: paymentStatus,
      };
    }

    const orders = await db.order.findMany({
      where,
      include: {
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to match the frontend format
    const formattedOrders = orders.map((order) => {
      const customerName = order.Customer
        ? `${order.Customer.firstName} ${order.Customer.lastName}`
        : "Walk-in Customer";

      const customerEmail = order.Customer?.email || "";
      const itemsCount = order.OrderItem.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      // Calculate total from sale or order items
      const total =
        order.sale?.total ||
        order.OrderItem.reduce((sum, item) => sum + item.total, 0);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName,
        customerEmail,
        items: itemsCount,
        total,
        status: order.status,
        paymentStatus: order.sale?.paymentStatus || "PENDING",
        createdAt: order.createdAt,
        customerPhone: order.Customer?.phone,
      };
    });

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
