import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 401 });
    }

    const body = await request.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No items selected" }, { status: 400 });
    }

    if (!["PENDING", "RESOLVED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: any = {
      status: status,
      updatedAt: new Date(),
    };

    // If marking as resolved, add resolved info
    if (status === "RESOLVED") {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = user.name;
    }

    // Update all selected stock awaits
    const result = await db.stockAwait.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      message: `Updated ${result.count} stock awaits to ${status}`,
    });
  } catch (error) {
    console.error("Error in bulk update:", error);
    return NextResponse.json(
      { error: "Failed to update stock awaits" },
      { status: 500 }
    );
  }
}
