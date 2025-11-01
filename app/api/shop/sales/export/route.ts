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
        { saleNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "All") {
      where.status = status;
    }

    if (paymentStatus && paymentStatus !== "All") {
      where.paymentStatus = paymentStatus;
    }

    const sales = await db.sale.findMany({
      where,
      include: {
        items: {
          include: {
            ShopProduct: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data for Excel export
    const excelData = sales.map((sale) => {
      const itemsCount = sale.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const itemsDetails = sale.items
        .map(
          (item) =>
            `${item.quantity}x ${item.ShopProduct.name} (${item.ShopProduct.sku}) - R${item.total.toFixed(2)}`
        )
        .join("; ");

      return {
        "Sale Number": sale.saleNumber,
        "Sale Date": new Date(sale.saleDate).toLocaleDateString("en-US"),
        "Sale Time": new Date(sale.createdAt).toLocaleTimeString("en-US"),
        "Customer Name": sale.customerName || "Walk-in Customer",
        "Customer Email": sale.customerEmail || "",
        "Customer Phone": sale.customerPhone || "",
        "Items Count": itemsCount,
        "Items Details": itemsDetails,
        Subtotal: `R${sale.subtotal.toFixed(2)}`,
        Discount: `R${(sale.discount || 0).toFixed(2)}`,
        "Total Amount": `R${(sale.subtotal + sale.discount).toFixed(2)}`,
        "Tax Amount": `R${(sale.tax || 0).toFixed(2)}`,
        "Payment Method": sale.paymentMethod,
        "Payment Status": sale.paymentStatus,
        "Amount Received": `R${(sale.amountReceived || 0).toFixed(2)}`,
        "Change Given": `R${(sale.change || 0).toFixed(2)}`,
        "Sale Status": sale.status,
        "Processed By": sale.createdBy || "",
        "Created At": new Date(sale.createdAt).toLocaleDateString("en-US"),
      };
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const colWidths = [
      { wch: 15 }, // Sale Number
      { wch: 12 }, // Sale Date
      { wch: 12 }, // Sale Time
      { wch: 20 }, // Customer Name
      { wch: 25 }, // Customer Email
      { wch: 15 }, // Customer Phone
      { wch: 10 }, // Items Count
      { wch: 50 }, // Items Details
      { wch: 12 }, // Subtotal
      { wch: 12 }, // Discount
      { wch: 12 }, // Tax
      { wch: 12 }, // Total Amount
      { wch: 15 }, // Payment Method
      { wch: 15 }, // Payment Status
      { wch: 15 }, // Amount Received
      { wch: 12 }, // Change Given
      { wch: 12 }, // Sale Status
      { wch: 20 }, // Processed By
      { wch: 12 }, // Created At
    ];

    worksheet["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");

    // Generate buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `sales-export-${timestamp}.xlsx`;

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
    console.error("Error exporting sales:", error);
    return NextResponse.json(
      { error: "Failed to export sales" },
      { status: 500 }
    );
  }
}
