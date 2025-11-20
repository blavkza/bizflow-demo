import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch users", error },
      { status: 500 }
    );
  }
}
