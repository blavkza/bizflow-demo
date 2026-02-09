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
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await db.user.findUnique({
      where: { userId: userId! },
    });

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
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
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Get tools with their rental rates
    const tools = await db.tool.findMany({
      where: {
        id: { in: toolIds },
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
        createdBy: user.id,
      },
    });

    // Create tool rentals and sub-tools
    const toolRentals = [];

    for (const tool of tools) {
      const rental = await db.$transaction(async (tx) => {
        // Fetch fresh tool data to check quantity and get full details
        const freshTool = await tx.tool.findUnique({
          where: { id: tool.id },
        });

        if (!freshTool || freshTool.quantity < 1) {
          throw new Error(`Tool ${tool.name} is out of stock`);
        }

        // Decrement parent tool quantity
        await tx.tool.update({
          where: { id: tool.id },
          data: { quantity: { decrement: 1 } },
        });

        // Create Sub-tool for the rented item
        const subTool = await tx.tool.create({
          data: {
            name: freshTool.name,
            description: freshTool.description,
            serialNumber: freshTool.serialNumber, // Copy serial
            code: freshTool.code,
            category: freshTool.category,
            purchasePrice: freshTool.purchasePrice,
            purchaseDate: freshTool.purchaseDate,
            quantity: 1, // Single rented unit
            status: "RENTED",
            condition: freshTool.condition,
            images: freshTool.images,
            parentToolId: freshTool.parentToolId || freshTool.id, // Flatten chain
            canBeRented: true,
            rentalRateDaily: freshTool.rentalRateDaily,
            rentalRateWeekly: freshTool.rentalRateWeekly,
            rentalRateMonthly: freshTool.rentalRateMonthly,
            createdBy: user.id,
            allocatedDate: new Date(),
          },
        });

        // Log Movement
        await tx.toolMovement.create({
          data: {
            toolId: subTool.parentToolId || subTool.id, // Log against Parent
            type: "CHECK_OUT",
            quantity: 1,
            notes: `Rented to ${businessName}`,
            createdBy: user.id,
          },
        });

        // Create Rental Record linked to the SUB-TOOL
        return await tx.toolRental.create({
          data: {
            toolId: subTool.id,
            businessName,
            renterContact,
            renterEmail,
            renterPhone,
            rentalStartDate: startDate,
            rentalEndDate: endDate,
            rentalRate: parseFloat(
              freshTool.rentalRateDaily?.toString() || "0",
            ),
            rentalDays,
            totalCost:
              parseFloat(freshTool.rentalRateDaily?.toString() || "0") *
              rentalDays,
            notes,
            quotationId: quotation.id,
            status: "PENDING",
          },
          include: {
            tool: true,
            quotation: true,
          },
        });
      });
      toolRentals.push(rental);
    }

    return NextResponse.json({ toolRentals, quotation });
  } catch (error) {
    console.error("Error creating tool rental:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
