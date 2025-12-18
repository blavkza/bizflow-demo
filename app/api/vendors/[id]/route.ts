import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
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
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const vendor = await db.vendor.findUnique({
      where: {
        id: params.id,
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        expenses: {
          include: {
            Project: {
              select: {
                id: true,
                title: true,
                projectNumber: true,
              },
            },
            Invoice: {
              select: {
                id: true,
                invoiceNumber: true,
              },
            },
          },
          orderBy: {
            dueDate: "asc",
          },
        },
        Document: {
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            expenses: true,
            Document: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error) {
    console.error("Failed to fetch vendor:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();

    // Prepare update data
    const updateData: any = {
      name: data.name?.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      phone2: data.phone2?.trim() || null,
      website: data.website?.trim() || null,
      address: data.address?.trim() || null,
      taxNumber: data.taxNumber?.trim() || null,
      registrationNumber: data.registrationNumber?.trim() || null,
      type: data.type || "SUPPLIER",
      paymentTerms: data.paymentTerms?.trim() || null,
      notes: data.notes?.trim() || null,
      status: data.status || "ACTIVE",
      tags: data.tags || [],
    };

    // Handle categories update
    if (data.categoryIds) {
      updateData.categories = {
        set: [], // Clear existing categories
        connect: data.categoryIds.map((id: string) => ({ id })),
      };
    }

    const vendor = await db.vendor.update({
      where: {
        id: params.id,
        userId: user.id, // Ensure user owns this vendor
      },
      data: updateData,
      include: {
        categories: true,
      },
    });

    return NextResponse.json(vendor);
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db.vendor.delete({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Failed to delete vendor:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}
