import db from "@/lib/db";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    console.log("Request body:", body);
    const { name, password, email, role, userName } = body;

    const client = await clerkClient();

    const clerkUser = await client.users.createUser({
      username: userName,
      password: password,
    });

    console.log("clerk user:", clerkUser);

    const user = await db.user.create({
      data: {
        userId: (await clerkUser).id,
        name,
        email,
        role,
        userName,
      },
    });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("[MESSAGE ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userName: true,
      },
      where: {
        status: "ACTIVE",
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[User ERROR]", error);
    return NextResponse.error();
  }
}
