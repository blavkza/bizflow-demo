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
    const { name, description, type } = body;

    const category = await db.category.create({
      data: {
        name,
        description,
        type,
        createdBy: creater?.name,
      },
    });

    db.notification.create({
      data: {
        title: "New Category Created",
        message: `Category ${category.name} , has been created By ${creater.name}.`,
        type: "CATEGORY",
        isRead: false,
        actionUrl: `/dashboard/categories`,
        userId: creater.id,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("[MESSAGE ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const categories = await db.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        type: true,
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[User ERROR]", error);
    return NextResponse.error();
  }
}
