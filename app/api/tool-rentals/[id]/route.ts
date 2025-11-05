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
    });

    if (!user) {
      return new NextResponse("User Not Found", { status: 401 });
    }
    const rentalId = params.id;

    const rental = await db.toolRental.findUnique({
      where: { id: rentalId },
      include: {
        tool: {
          select: {
            name: true,
            description: true,
            primaryImage: true,
            images: true,
            condition: true,
          },
        },
        quotation: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                company: true,
                address: true,
              },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            status: true,
            invoiceNumber: true,
            createdAt: true,
          },
        },
      },
    });

    if (!rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 });
    }

    return NextResponse.json(rental);
  } catch (error) {
    console.error("Error fetching rental details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body = await request.json();

    const updatedRental = await db.toolRental.update({
      where: { id: rentalId },
      data: body,
      include: {
        tool: true,
        quotation: {
          include: {
            client: true,
          },
        },
        invoice: true,
      },
    });

    return NextResponse.json(updatedRental);
  } catch (error) {
    console.error("Error updating rental:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
