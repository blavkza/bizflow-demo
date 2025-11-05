import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, company, email, phone, type } = body;

    const lastClient = await db.client.findFirst({
      orderBy: { createdAt: "desc" },
      select: { clientNumber: true },
    });
    const clientNumber = lastClient
      ? `CNT-${parseInt(lastClient.clientNumber.split("-")[1]) + 1}`
      : "CNT-0001";

    const client = await db.client.create({
      data: {
        clientNumber,
        name,
        email,
        type,
        company,
        phone,
        createdBy: creater?.name,
      },
    });

    await db.notification.create({
      data: {
        title: "New Client Created",
        message: `Client ${client.name} , client number : ${client.clientNumber} has been created By ${creater.name}.`,
        type: "CLIENT",
        isRead: false,
        actionUrl: `/dashboard/human-resources/clients/${client.id}`,
        userId: creater.id,
      },
    });

    return NextResponse.json({ client });
  } catch (error) {
    console.error("[MESSAGE ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const clients = await db.client.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        phone: true,
        type: true,
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("[User ERROR]", error);
    return NextResponse.error();
  }
}
