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

    const folder = await db.folder.findUnique({
      where: { id },
      include: {
        Document: {
          orderBy: { createdAt: "desc" },
          include: {
            employee: { select: { firstName: true, lastName: true } },
            client: { select: { name: true } },
          },
        },
        Note: {
          orderBy: { createdAt: "desc" },
        },
        Project: {
          select: {
            title: true,
            id: true,
            managerId: true,
            teamMembers: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Transform the data to match frontend expectations
    const transformedFolder = {
      ...folder,
      documents: folder.Document.map((doc) => ({
        ...doc,
        uploadedAt: doc.createdAt,
        lastModified: doc.updatedAt,
        starred: false, // Add if you have this field
        shared: false, // Add if you have this field
        tags: [], // Add if you have this field
        type: doc.mimeType || "application/octet-stream",
      })),
      notes: folder.Note.map((note) => ({
        ...note,
        pinned: note.pinned || false,
        color: note.color || "blue",
      })),
    };

    return NextResponse.json(transformedFolder);
  } catch (error) {
    console.error("Error fetching folder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, description } = await request.json();

    const folder = await db.folder.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
      },
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Error updating folder:", error);
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

    await db.folder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
