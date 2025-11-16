import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const document = await db.document.findUnique({
      where: { id },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        client: { select: { name: true } },
        folder: { select: { title: true } },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Transform response
    const transformedDocument = {
      ...document,
      uploadedAt: document.createdAt,
      lastModified: document.updatedAt,
      starred: false,
      shared: false,
      tags: [],
      type: document.mimeType || "application/octet-stream",
    };

    return NextResponse.json(transformedDocument);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await the params promise
    const { id } = await params;

    const { starred, shared, name } = await request.json();

    // Validate that at least one field is being updated
    if (starred === undefined && shared === undefined && !name) {
      return NextResponse.json(
        { error: "At least one field (starred, shared, or name) is required" },
        { status: 400 }
      );
    }

    // Check if document exists and belongs to user (optional security check)
    const existingDocument = await db.document.findUnique({
      where: { id },
      include: {
        folder: {
          include: {
            Project: true,
          },
        },
      },
    });

    if (!existingDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (starred !== undefined) updateData.starred = starred;
    if (shared !== undefined) updateData.shared = shared;
    if (name) updateData.name = name;

    // Update the document
    const document = await db.document.update({
      where: { id },
      data: updateData,
    });

    // Transform response for frontend
    const transformedDocument = {
      ...document,
      uploadedAt: document.createdAt,
      lastModified: document.updatedAt,
      starred: document.starred || false,
      shared: document.shared || false,
      type: document.mimeType || "application/octet-stream",
    };

    return NextResponse.json(transformedDocument);
  } catch (error) {
    console.error("Error updating document:", error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("Record to update not found")) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get document first
    const document = await db.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Delete from database
    await db.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
