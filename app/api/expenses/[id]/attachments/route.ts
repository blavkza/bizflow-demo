import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(
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

    const { attachment } = await request.json();

    if (!attachment || !attachment.url) {
      return NextResponse.json(
        { error: "Invalid attachment data" },
        { status: 400 }
      );
    }

    // Get current expense to check existing attachments
    const currentExpense = await db.expense.findUnique({
      where: {
        id: params.id,
      },
      select: {
        attachments: true,
      },
    });

    if (!currentExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Parse existing attachments or initialize empty array
    const currentAttachments = currentExpense.attachments
      ? (currentExpense.attachments as any[])
      : [];

    // Add new attachment
    const updatedAttachments = [...currentAttachments, attachment];

    // Update expense with new attachments
    const expense = await db.expense.update({
      where: {
        id: params.id,
      },
      data: {
        attachments: updatedAttachments,
      },
    });

    return NextResponse.json({ success: true, attachment });
  } catch (error) {
    console.error("Failed to add attachment:", error);
    return NextResponse.json(
      { error: "Failed to add attachment" },
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

    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json(
        { error: "Attachment ID is required" },
        { status: 400 }
      );
    }

    // Get current expense
    const currentExpense = await db.expense.findUnique({
      where: {
        id: params.id,
        userId: user.id,
      },
      select: {
        attachments: true,
      },
    });

    if (!currentExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Parse existing attachments
    const currentAttachments = currentExpense.attachments
      ? (currentExpense.attachments as any[])
      : [];

    // Filter out the attachment to delete
    const updatedAttachments = currentAttachments.filter(
      (att: any) => att.id !== attachmentId
    );

    // Update expense with filtered attachments
    const expense = await db.expense.update({
      where: {
        id: params.id,
        userId: user.id,
      },
      data: {
        attachments: updatedAttachments,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete attachment:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
