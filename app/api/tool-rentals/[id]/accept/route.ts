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

    const rentalId = params.id;

    // Get the rental with quotation and tools
    const rental = await db.toolRental.findUnique({
      where: { id: rentalId },
      include: {
        tool: true,
        quotation: {
          include: {
            client: true,
            items: true,
          },
        },
      },
    });

    if (!rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 });
    }

    // Update tool status to rented
    await db.tool.update({
      where: { id: rental.toolId },
      data: { status: "RENTED" },
    });

    // Update rental status to active
    const updatedRental = await db.toolRental.update({
      where: { id: rentalId },
      data: { status: "ACTIVE" },
      include: {
        tool: true,
        quotation: true,
      },
    });

    const lastInvoice = await db.invoice.findFirst({
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    const invoiceNumber = lastInvoice
      ? `INV-${parseInt(lastInvoice.invoiceNumber.split("-")[1]) + 1}`
      : "INV-0001";

    // Create invoice from quotation
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now()}`,
        clientId: rental?.quotation?.clientId ?? "",
        amount: rental?.quotation?.amount || 0,
        totalAmount: rental?.quotation?.totalAmount || 0,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: `Tool Rental: ${rental.tool.name}`,
        items: {
          create: rental?.quotation?.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
        },
        createdBy: user?.id,
      },
    });

    // Link invoice to rental
    await db.toolRental.update({
      where: { id: rentalId },
      data: { invoiceId: invoice.id },
    });

    await db.quotation.update({
      where: { id: rental?.quotation?.id },
      data: {
        status: "CONVERTED",
        acceptedDate: new Date(),
        convertedToInvoice: true,
        invoiceId: invoice.id,
      },
    });

    return NextResponse.json({ rental: updatedRental, invoice });
  } catch (error) {
    console.error("Error accepting rental:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
