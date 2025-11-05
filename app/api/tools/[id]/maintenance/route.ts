import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return new NextResponse("User Not Found", { status: 401 });
    }

    const body = await request.json();

    const employee = await db.employee.findUnique({
      where: { id: body.assignedTo },
    });

    const assignedTo = `${employee?.firstName} ${employee?.lastName} (${employee?.employeeNumber})`;

    const result = await db.$transaction(async (tx) => {
      let maintenanceCategory = await tx.category.findFirst({
        where: {
          name: "Tool Maintenance",
          type: "EXPENSE",
        },
      });

      if (!maintenanceCategory) {
        maintenanceCategory = await tx.category.create({
          data: {
            name: "Tool Maintenance",
            description: "Costs associated with tool maintenance and repairs",
            type: "EXPENSE",
            createdBy: user.name,
          },
        });
      }

      const tool = await db.tool.findUnique({
        where: {
          id: params.id,
        },
      });

      const maintenanceLog = await tx.toolMaintenanceLog.create({
        data: {
          toolId: params.id,
          maintenanceType: body.maintenanceType,
          cost: body.cost,
          maintenanceDate: new Date(body.maintenanceDate),
          notes: body.notes,
          assignedTo: assignedTo,
          processedBy: user.name,
        },
      });

      let transaction = null;
      if (body.cost && parseFloat(body.cost) > 0) {
        transaction = await tx.transaction.create({
          data: {
            amount: body.cost,
            type: "EXPENSE",
            description: `Tool Maintenance: ${body.maintenanceType} - ${tool?.name}`,
            date: new Date(body.maintenanceDate),
            method: body.paymentMethod || "BANK_TRANSFER",
            categoryId: maintenanceCategory.id,
            createdBy: user.id,
            status: "COMPLETED",
            taxAmount: 0,
            netAmount: body.cost,
            vendor: body.vendor || "Maintenance Vendor",
            reference: `MAINT-${maintenanceLog.id}`,
          },
        });
      }

      return {
        maintenanceLog,
        transaction,
        category: maintenanceCategory,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to create maintenance record:", error);
    return NextResponse.json(
      { error: "Failed to create maintenance record" },
      { status: 500 }
    );
  }
}
