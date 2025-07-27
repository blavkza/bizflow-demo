import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await params;

    const body = await req.json();
    const { name, company, email, phone, type, taxNumber, website, address } =
      body;

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!updater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedClient = await db.client.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        company,
        type,
        taxNumber,
        website,
        address,
      },
    });

    await db.notification.create({
      data: {
        title: "Client Updated",
        message: `Client ${updatedClient.name} , client number : ${updatedClient.clientNumber} has been updated By ${updater.name}.`,
        type: "CLIENT",
        isRead: false,
        actionUrl: `/dashboard/human-resources/clients/${updatedClient.id}`,
        userId: updater.id,
      },
    });

    return NextResponse.json({ updatedClient });
  } catch (error) {
    console.error("Error updating Client:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    await db.client.delete({
      where: { id },
    });

    return NextResponse.json({ message: "client deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting Client:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
