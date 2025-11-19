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
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    // Build where clause for filtering
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "All Categories") {
      where.category = category;
    }

    if (status && status !== "All Status") {
      if (status === "Active") {
        where.status = "ACTIVE";
      } else if (status === "Inactive") {
        where.status = "INACTIVE";
      } else if (status === "Discontinued") {
        where.status = "DISCONTINUED";
      } else if (status === "Out of Stock") {
        where.stock = 0;
      } else if (status === "Low Stock") {
        where.stock = {
          lte: db.shopProduct.fields.minStock,
          gt: 0,
        };
      }
    }

    const products = await db.shopProduct.findMany({
      where,
      include: {
        stockMovements: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data for Excel export
    const excelData = products.map((product) => {
      const stockStatus =
        product.stock === 0
          ? "Out of Stock"
          : product.stock <= product.minStock
            ? "Low Stock"
            : "In Stock";

      // Calculate profit margin safely
      const costPrice = product.costPrice || 0;
      const profitMargin =
        costPrice > 0
          ? (((product.price - costPrice) / costPrice) * 100).toFixed(2)
          : "0";

      // Calculate total inventory value
      const totalValue = costPrice * product.stock;

      // Get image count
      const imageCount = product.images ? product.images.length : 0;
      const documentCount = product.documents ? product.documents.length : 0;

      // Get last stock movement info
      const lastStockMovement = product.stockMovements?.[0];
      const lastMovementType = lastStockMovement?.type || "N/A";
      const lastMovementDate = lastStockMovement?.createdAt
        ? new Date(lastStockMovement.createdAt).toLocaleDateString("en-US")
        : "N/A";

      return {
        SKU: product.sku,
        "Product Name": product.name,
        Brand: product.brand || "N/A",
        Category: product.category,
        /*         Description: product.description || "",
         */ Status: product.status,
        Featured: product.featured ? "Yes" : "No",
        "Stock Status": stockStatus,
        "Current Stock": product.stock,
        "Minimum Stock": product.minStock,
        "Maximum Stock": product.maxStock || "N/A",
        "Cost Price": costPrice > 0 ? `R${costPrice.toFixed(2)}` : "N/A",
        "Selling Price": `R${product.price.toFixed(2)}`,
        "Profit Margin": costPrice > 0 ? `${profitMargin}%` : "N/A",
        "Total Inventory Value": `R${totalValue.toFixed(2)}`,
        "Weight (kg)": product.weight || "N/A",
        Dimensions: product.dimensions || "N/A",
        Color: product.color || "N/A",
        Size: product.size || "N/A",
        "Image Count": imageCount,
        "Document Count": documentCount,
        "Created By": product.creater,
        "Created Date": new Date(product.createdAt).toLocaleDateString("en-US"),
        "Last Updated": new Date(product.updatedAt).toLocaleDateString("en-US"),
        "Last Stock Movement": lastMovementType,
        "Last Stock Update": lastMovementDate,
      };
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const colWidths = [
      { wch: 15 }, // SKU
      { wch: 25 }, // Product Name
      { wch: 15 }, // Brand
      { wch: 15 }, // Category
      /*       { wch: 30 }, // Description
       */ { wch: 12 }, // Status
      { wch: 10 }, // Featured
      { wch: 12 }, // Stock Status
      { wch: 12 }, // Current Stock
      { wch: 12 }, // Minimum Stock
      { wch: 12 }, // Maximum Stock
      { wch: 12 }, // Cost Price
      { wch: 12 }, // Selling Price
      { wch: 12 }, // Profit Margin
      { wch: 15 }, // Total Inventory Value
      { wch: 10 }, // Weight
      { wch: 15 }, // Dimensions
      { wch: 12 }, // Color
      { wch: 10 }, // Size
      { wch: 10 }, // Image Count
      { wch: 12 }, // Document Count
      { wch: 15 }, // Created By
      { wch: 12 }, // Created Date
      { wch: 12 }, // Last Updated
      { wch: 15 }, // Last Stock Movement
      { wch: 12 }, // Last Stock Update
    ];

    worksheet["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    // Generate buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `products-export-${timestamp}.xlsx`;

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
    console.error("Error exporting products:", error);
    return NextResponse.json(
      { error: "Failed to export products" },
      { status: 500 }
    );
  }
}
