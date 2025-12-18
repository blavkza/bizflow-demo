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
      select: { id: true, name: true },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const vendors = await db.vendor.findMany({
      where: { userId: user.id },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        _count: {
          select: {
            expenses: true,
            Document: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    console.log(
      "Fetched vendors with categories:",
      vendors.map((v) => ({
        id: v.id,
        name: v.name,
        categoryCount: v.categories.length,
        categories: v.categories,
      }))
    );

    return NextResponse.json(vendors);
  } catch (error) {
    console.error("Failed to fetch vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
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
      select: { id: true, name: true },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();

    console.log("Received data for vendor creation:", data);
    console.log("Category IDs to connect:", data.categoryIds);

    // Validate and prepare category connections
    const categoryConnections =
      Array.isArray(data.categoryIds) && data.categoryIds.length > 0
        ? {
            connect: data.categoryIds.map((id: string) => ({ id })),
          }
        : undefined;

    const vendor = await db.vendor.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        phone2: data.phone2 || null,
        website: data.website || null,
        address: data.address || null,
        taxNumber: data.taxNumber || null,
        registrationNumber: data.registrationNumber || null,
        type: data.type,
        status: data.status,
        paymentTerms:
          data.paymentTerms === "no-payment-terms" ? null : data.paymentTerms,
        notes: data.notes || null,
        userId: user.id,
        categories: categoryConnections,
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    console.log("Created vendor with categories:", {
      id: vendor.id,
      name: vendor.name,
      categories: vendor.categories,
    });

    return NextResponse.json(vendor);
  } catch (error) {
    console.error("Failed to create vendor:", error);

    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }

    return NextResponse.json(
      {
        error: "Failed to create vendor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
