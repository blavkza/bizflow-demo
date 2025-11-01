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
    const productId = searchParams.get("productId");

    // Build where clause
    const where: any = {};
    if (productId) {
      where.shopProductId = productId;
    }

    const stockMovements = await db.stockMovement.findMany({
      where,
      include: {
        shopProduct: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Helper function to get movement type label
    const getMovementLabel = (type: string) => {
      switch (type) {
        case "IN":
          return "Stock In";
        case "OUT":
          return "Stock Out";
        case "ADJUSTMENT":
          return "Adjustment";
        case "RETURN":
          return "Return";
        default:
          return type;
      }
    };

    // Helper function to get reason label
    const getReasonLabel = (reason: string | null) => {
      if (!reason) return "N/A";

      const reasonMap: { [key: string]: string } = {
        PURCHASE_ORDER: "Purchase Order",
        SALE: "Sale",
        STOCK_TAKE: "Stock Take",
        DAMAGED: "Damaged Goods",
        EXPIRED: "Expired Goods",
        RETURN_CUSTOMER: "Customer Return",
        RETURN_SUPPLIER: "Supplier Return",
        TRANSFER_IN: "Transfer In",
        TRANSFER_OUT: "Transfer Out",
        OTHER: "Other",
      };

      return reasonMap[reason] || reason;
    };

    // Transform data for Excel export
    const excelData = stockMovements.map((movement) => {
      const changeAmount = movement.newStock - movement.previousStock;
      const changeType =
        changeAmount > 0
          ? "Increase"
          : changeAmount < 0
            ? "Decrease"
            : "No Change";

      return {
        "Movement ID": movement.id,
        "Product Name": movement.shopProduct.name,
        "Product SKU": movement.shopProduct.sku,
        "Movement Type": getMovementLabel(movement.type),
        Quantity: movement.quantity,
        "Previous Stock": movement.previousStock,
        "New Stock": movement.newStock,
        "Stock Change": changeAmount,
        "Change Type": changeType,
        Reason: getReasonLabel(movement.reason),
        Reference: movement.reference || "N/A",
        "Created By": movement.creater || "System",
        Date: new Date(movement.createdAt).toLocaleDateString("en-US"),
        Time: new Date(movement.createdAt).toLocaleTimeString("en-US"),
        Timestamp: new Date(movement.createdAt).toISOString(),
      };
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const colWidths = [
      { wch: 20 }, // Movement ID
      { wch: 25 }, // Product Name
      { wch: 15 }, // Product SKU
      { wch: 15 }, // Movement Type
      { wch: 10 }, // Quantity
      { wch: 15 }, // Previous Stock
      { wch: 12 }, // New Stock
      { wch: 12 }, // Stock Change
      { wch: 12 }, // Change Type
      { wch: 20 }, // Reason
      { wch: 20 }, // Reference
      { wch: 20 }, // Created By
      { wch: 12 }, // Date
      { wch: 12 }, // Time
      { wch: 20 }, // Timestamp
    ];

    worksheet["!cols"] = colWidths;

    // Add worksheet to workbook
    const sheetName = productId ? "Stock Movements" : "All Stock Movements";
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Create filename
    const timestamp = new Date().toISOString().split("T")[0];
    let filename = `stock-movements-${timestamp}.xlsx`;

    if (productId && stockMovements.length > 0) {
      const sku = stockMovements[0].shopProduct.sku
        .replace(/\s+/g, "-")
        .toLowerCase();
      filename = `stock-movements-${sku}-${timestamp}.xlsx`;
    }

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
    console.error("Error exporting stock movements:", error);
    return NextResponse.json(
      { error: "Failed to export stock movements" },
      { status: 500 }
    );
  }
}
