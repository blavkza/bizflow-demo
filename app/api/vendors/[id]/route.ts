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

    const updateData = {
      name: data.name,
      email: data.email === "NONE" || data.email === "" ? null : data.email,
      phone: data.phone === "NONE" || data.phone === "" ? null : data.phone,
      website:
        data.website === "NONE" || data.website === "" ? null : data.website,
      address:
        data.address === "NONE" || data.address === "" ? null : data.address,
      taxNumber:
        data.taxNumber === "NONE" || data.taxNumber === ""
          ? null
          : data.taxNumber,
      category:
        data.category === "NONE" || data.category === "" ? null : data.category,
      paymentTerms:
        data.paymentTerms === "NONE" || data.paymentTerms === ""
          ? null
          : data.paymentTerms,
      notes: data.notes === "NONE" || data.notes === "" ? null : data.notes,
      status: data.status,
      tags: data.tags || [],
    };

    const vendor = await db.vendor.update({
      where: {
        id: params.id,
      },
      data: updateData,
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
      },
    });

    return NextResponse.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}
