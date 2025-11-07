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

    const user = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const vendor = searchParams.get("vendor");

    // Build where clause for filtering
    const where: any = {
      userId: user.id,
    };

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { expenseNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (category && category !== "all") {
      where.categoryId = category;
    }

    if (vendor && vendor !== "all") {
      where.vendorId = vendor;
    }

    const expenses = await db.expense.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
          },
        },
        Vendor: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        Invoice: {
          select: {
            invoiceNumber: true,
          },
        },
        Project: {
          select: {
            title: true,
          },
        },
        payments: {
          select: {
            amount: true,
            paymentDate: true,
            method: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data for Excel export
    const excelData = expenses.map((expense) => {
      const totalPayments = expense.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );

      return {
        "Expense Number": expense.expenseNumber,
        Description: expense.description,
        Vendor: expense.Vendor?.name || "Unknown Vendor",
        "Vendor Email": expense.Vendor?.email || "",
        "Vendor Phone": expense.Vendor?.phone || "",
        Category: expense.category?.name || "Uncategorized",
        "Expense Date": new Date(expense.expenseDate).toLocaleDateString(
          "en-US"
        ),
        "Due Date": new Date(expense.dueDate).toLocaleDateString("en-US"),
        "Total Amount": `R${Number(expense.totalAmount).toFixed(2)}`,
        "Paid Amount": `R${Number(expense.paidAmount).toFixed(2)}`,
        "Remaining Amount": `R${Number(expense.remainingAmount).toFixed(2)}`,
        Status: expense.status,
        Priority: expense.priority,
        "Payment Method": expense.paymentMethod || "Not specified",
        "Invoice Number": expense.Invoice?.invoiceNumber || "",
        Project: expense.Project?.title || "",
        "Total Payments": `R${totalPayments.toFixed(2)}`,
        "Payment Count": expense.payments.length,
        Notes: expense.notes || "",
        "Created Date": new Date(expense.createdAt).toLocaleDateString("en-US"),
      };
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const colWidths = [
      { wch: 15 }, // Expense Number
      { wch: 30 }, // Description
      { wch: 20 }, // Vendor
      { wch: 25 }, // Vendor Email
      { wch: 15 }, // Vendor Phone
      { wch: 20 }, // Category
      { wch: 12 }, // Expense Date
      { wch: 12 }, // Due Date
      { wch: 12 }, // Total Amount
      { wch: 12 }, // Paid Amount
      { wch: 12 }, // Remaining Amount
      { wch: 12 }, // Status
      { wch: 10 }, // Priority
      { wch: 15 }, // Payment Method
      { wch: 15 }, // Invoice Number
      { wch: 20 }, // Project
      { wch: 12 }, // Total Payments
      { wch: 12 }, // Payment Count
      { wch: 30 }, // Notes
      { wch: 12 }, // Created Date
    ];

    worksheet["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

    // Generate buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `expenses-export-${timestamp}.xlsx`;

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
    console.error("Error exporting expenses:", error);
    return NextResponse.json(
      { error: "Failed to export expenses" },
      { status: 500 }
    );
  }
}
