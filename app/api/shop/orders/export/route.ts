import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import * as XLSX from "xlsx";

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
            address: true,
            city: true,
            province: true,
            postalCode: true,
            country: true,
          },
        },
        sale: {
          select: {
            total: true,
            paymentStatus: true,
            paymentMethod: true,
          },
        },
        OrderItem: {
          include: {
            ShopProduct: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data for Excel export
    const excelData = orders.map((order) => {
      const customerName = order.Customer
        ? `${order.Customer.firstName} ${order.Customer.lastName}`
        : "Walk-in Customer";

      const subtotal = order.OrderItem.reduce(
        (sum, item) => sum + item.total,
        0
      );
      const total = order.sale?.total || subtotal;

      return {
        "Order Number": order.orderNumber,
        "Order Date": new Date(order.createdAt).toLocaleDateString("en-US"),
        "Order Time": new Date(order.createdAt).toLocaleTimeString("en-US"),
        "Customer Name": customerName,
        "Customer Email": order.Customer?.email || "",
        "Customer Phone": order.Customer?.phone || "",
        "Shipping Address": order.Customer?.address || "",
        "Shipping City": order.Customer?.city || "",
        "Shipping Province": order.Customer?.province || "",
        "Shipping Postal Code": order.Customer?.postalCode || "",
        "Shipping Country": order.Customer?.country || "",
        "Order Status": order.status,
        "Payment Status": order.sale?.paymentStatus || "PENDING",
        "Payment Method": order.sale?.paymentMethod || "N/A",
        Subtotal: `R${subtotal.toFixed(2)}`,
        "Total Amount": `R${total.toFixed(2)}`,
        "Items Count": order.OrderItem.length,
        "Items Details": order.OrderItem.map(
          (item) =>
            `${item.quantity}x ${item.ShopProduct.name} (${item.ShopProduct.sku}) - R${item.total.toFixed(2)}`
        ).join("; "),
        "Processed By": order.User?.name || "",
        "Delivery Date": order.deliveryDate
          ? new Date(order.deliveryDate).toLocaleDateString("en-US")
          : "",
        Carrier: order.carrier || "",
      };
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const colWidths = [
      { wch: 15 }, // Order Number
      { wch: 12 }, // Order Date
      { wch: 12 }, // Order Time
      { wch: 20 }, // Customer Name
      { wch: 25 }, // Customer Email
      { wch: 15 }, // Customer Phone
      { wch: 25 }, // Shipping Address
      { wch: 15 }, // Shipping City
      { wch: 15 }, // Shipping Province
      { wch: 15 }, // Shipping Postal Code
      { wch: 15 }, // Shipping Country
      { wch: 12 }, // Order Status
      { wch: 12 }, // Payment Status
      { wch: 15 }, // Payment Method
      { wch: 12 }, // Subtotal
      { wch: 12 }, // Total Amount
      { wch: 10 }, // Items Count
      { wch: 50 }, // Items Details
      { wch: 20 }, // Processed By
      { wch: 12 }, // Delivery Date
      { wch: 15 }, // Carrier
    ];

    worksheet["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    // Generate buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `orders-export-${timestamp}.xlsx`;

    // Return Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error exporting orders:", error);
    return NextResponse.json(
      { error: "Failed to export orders" },
      { status: 500 }
    );
  }
}
