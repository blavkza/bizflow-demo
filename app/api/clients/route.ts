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

    function generateClientNumber() {
      const randomSix = Math.floor(100000 + Math.random() * 900000);
      return `CNT-${randomSix}`;
    }

    const clientNumber = generateClientNumber();

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
