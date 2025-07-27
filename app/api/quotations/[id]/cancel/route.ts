import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!updater) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentQuotation = await db.quotation.findUnique({
      where: { id },
    });

    if (!currentQuotation) {
      return new NextResponse("Quotation not found", { status: 404 });
    }

    const newStatus =
      currentQuotation.status === "CANCELLED" ? "DRAFT" : "CANCELLED";

    const updatedQuotation = await db.quotation.update({
      where: { id },
      data: { status: newStatus },
    });

    await db.notification.create({
      data: {
        title: `Quotation ${updatedQuotation.status === "CANCELLED" ? "Canceled" : "Uncanceled"} `,
        message: `Quotation ${updatedQuotation.quotationNumber} , has been ${updatedQuotation.status === "CANCELLED" ? "Canceled" : "Uncanceled"} By ${updater.name}.`,
        type: "QUOTATION",
        isRead: false,
        actionUrl: `/dashboard/quotations/${updatedQuotation.id}`,
        userId: updater.id,
      },
    });

    return NextResponse.json(updatedQuotation);
  } catch (error) {
    console.error("Error updating quotation status:", error);
    return NextResponse.json(
      { error: "Failed to update quotation status" },
      { status: 500 }
    );
  }
}
