import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import * as XLSX from "xlsx";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const productId = await params.id;

    // Verify the product exists and get product details
    const product = await db.shopProduct.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        name: true,
        sku: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Find all sales that contain this product
    const sales = await db.sale.findMany({
      where: {
        items: {
          some: {
            shopProductId: productId,
          },
        },
      },
      include: {
        items: {
          where: {
            shopProductId: productId,
          },
          select: {
            id: true,
            quantity: true,
            price: true,
            total: true,
            shopProductId: true,
          },
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        saleDate: "desc",
      },
    });

    // Transform data for Excel export
    const excelData = sales.map((sale) => {
      const customerName = sale.customer
        ? `${sale.customer.firstName} ${sale.customer.lastName}`
        : "Walk-in Customer";

      const quantity = sale.items.reduce(
        (sum, item) => sum + Number(item.quantity),
        0
      );
      const revenue = sale.items.reduce(
        (sum, item) => sum + Number(item.total),
        0
      );
      const unitPrice = quantity > 0 ? revenue / quantity : 0;

      return {
        "Sale Number": sale.saleNumber,
        "Sale Date": new Date(sale.saleDate).toLocaleDateString("en-US"),
        "Customer Name": customerName,
        "Customer Email": sale.customer?.email || "",
        "Product Name": product.name,
        "Product SKU": product.sku,
        "Quantity Sold": quantity,
        "Unit Price": `R${unitPrice.toFixed(2)}`,
        "Total Revenue": `R${revenue.toFixed(2)}`,
        "Sale Status": sale.status,
        "Payment Method": sale.paymentMethod,
        "Payment Status":
          sale.status === "COMPLETED"
            ? "PAID"
            : sale.status === "REFUNDED"
              ? "REFUNDED"
              : sale.status === "CANCELLED"
                ? "CANCELLED"
                : "PENDING",
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
      { wch: 20 }, // Customer Name
      { wch: 25 }, // Customer Email
      { wch: 20 }, // Product Name
      { wch: 15 }, // Product SKU
      { wch: 12 }, // Quantity Sold
      { wch: 12 }, // Unit Price
      { wch: 12 }, // Total Revenue
      { wch: 15 }, // Sale Status
      { wch: 15 }, // Payment Method
      { wch: 12 }, // Payment Status
    ];

    worksheet["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales History");

    // Generate buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Create filename with timestamp and product name
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `sales-history-${timestamp}.xlsx`;

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
    console.error("Error exporting sales history:", error);
    return NextResponse.json(
      { error: "Failed to export sales history" },
      { status: 500 }
    );
  }
}
