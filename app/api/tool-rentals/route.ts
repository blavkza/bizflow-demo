import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const search = searchParams.get("search");

    const where: any = {};

    if (status && status !== "All Status") {
      where.status = status;
    }

    if (paymentStatus && paymentStatus !== "All") {
      if (paymentStatus === "Paid") {
        where.paymentStatus = "PAID";
      } else if (paymentStatus === "Pending") {
        where.paymentStatus = "PENDING";
      } else if (paymentStatus === "Overdue") {
        where.OR = [
          { paymentStatus: "OVERDUE" },
          {
            AND: [
              { paymentStatus: "PENDING" },
              { rentalEndDate: { lt: new Date() } },
            ],
          },
        ];
      }
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { tool: { name: { contains: search, mode: "insensitive" } } },
        { renterContact: { contains: search, mode: "insensitive" } },
      ];
    }

    const rentals = await db.toolRental.findMany({
      where,
      include: {
        tool: {
          select: {
            name: true,
            rentalRateDaily: true,
            images: true,
          },
        },
        quotation: {
          include: {
            client: true,
            items: true,
          },
        },
        invoice: {
          include: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(rentals);
  } catch (error) {
    console.error("Error fetching tool rentals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const {
      toolIds,
      clientId,
      businessName,
      renterContact,
      renterEmail,
      renterPhone,
      rentalStartDate,
      rentalEndDate,
      notes,
    } = body;

    // Calculate rental period
    const startDate = new Date(rentalStartDate);
    const endDate = new Date(rentalEndDate);
    const rentalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get tools with their rental rates
    const tools = await db.tool.findMany({
      where: {
        id: { in: toolIds },
      },
      select: {
        id: true,
        name: true,
        rentalRateDaily: true,
      },
    });

    // Generate quotation number atomically
    const lastQuotation = await db.quotation.findFirst({
      orderBy: { createdAt: "desc" },
      select: { quotationNumber: true },
    });
    const quotationNumber = lastQuotation
      ? `QT-${parseInt(lastQuotation.quotationNumber.split("-")[1]) + 1}`
      : "QT-0001";

    // Calculate total cost
    const totalCost = tools.reduce((sum, tool) => {
      const dailyRate = parseFloat(tool.rentalRateDaily?.toString() || "0");
      return sum + dailyRate * rentalDays;
    }, 0);

    // Create quotation first
    const quotation = await db.quotation.create({
      data: {
        quotationNumber: quotationNumber,
        clientId,
        title: `Tool Rental - ${businessName}`,
        description: `Rental of ${tools.map((t) => t.name).join(", ")}`,
        amount: totalCost,
        totalAmount: totalCost,
        issueDate: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        items: {
          create: tools.map((tool) => ({
            description: `Rental: ${tool.name} - ${rentalDays} days`,
            quantity: rentalDays,
            unitPrice: parseFloat(tool.rentalRateDaily?.toString() || "0"),
            amount:
              parseFloat(tool.rentalRateDaily?.toString() || "0") * rentalDays,
          })),
        },
        createdBy: user?.id,
      },
    });

    // Create tool rentals
    const toolRentals = await Promise.all(
      tools.map((tool) =>
        db.toolRental.create({
          data: {
            toolId: tool.id,
            businessName,
            renterContact,
            renterEmail,
            renterPhone,
            rentalStartDate: startDate,
            rentalEndDate: endDate,
            rentalRate: parseFloat(tool.rentalRateDaily?.toString() || "0"),
            rentalDays,
            totalCost:
              parseFloat(tool.rentalRateDaily?.toString() || "0") * rentalDays,
            notes,
            quotationId: quotation.id,
            status: "PENDING",
          },
          include: {
            tool: true,
            quotation: true,
          },
        })
      )
    );

    await db.tool.updateMany({
      where: {
        id: { in: toolIds },
      },
      data: {
        status: "RENTED",
      },
    });

    return NextResponse.json({ toolRentals, quotation });
  } catch (error) {
    console.error("Error creating tool rental:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
