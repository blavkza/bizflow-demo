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
  const { id } = await params;

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, phone, status, role, permissions } = await req.json();

  if (permissions && !Array.isArray(permissions)) {
    return NextResponse.json(
      { error: "Permissions must be an array" },
      { status: 400 }
    );
  }

  try {
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        status,
        role,
        permissions: permissions || [],
      },
    });

    return NextResponse.json({ updatedUser });
  } catch (error) {
    console.error("Error updating User:", error);
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
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting User:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
