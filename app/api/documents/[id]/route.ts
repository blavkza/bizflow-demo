import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    await db.document.delete({
      where: { id },
    });

    return NextResponse.json({ message: "document deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
