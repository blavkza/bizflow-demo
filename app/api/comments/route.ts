import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true, avatar: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, projectId } = await request.json();

    const project = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { managerId: user.id },
          {
            teamMembers: {
              some: { userId: user.id },
            },
          },
        ],
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Unauthorized to Comment" },
        { status: 401 }
      );
    }

    const manager = await db.project.findUnique({
      where: {
        id: projectId,
        managerId: user.id,
      },
      select: {
        managerId: true,
      },
    });

    const teamMember = await db.projectTeam.findFirst({
      where: {
        projectId,
        userId: user.id,
      },
      select: {
        role: true,
      },
    });

    const comment = await db.comment.create({
      data: {
        content,
        projectId,
        commenterName: user.name || "Anonymous",
        commenterId: user.id,
        commenterAvatar: user.avatar || null,
        commenterRole: manager ? "Project Manager" : teamMember?.role || "User",
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

// Update comment (pin/like)
export async function PATCH(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { userId },
    select: { id: true, name: true, avatar: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, pinned, liked } = await request.json();

  try {
    const comment = await db.comment.update({
      where: { id },
      data: {
        pinned,
        liked,
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

// Delete comment
export async function DELETE(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { userId },
    select: { id: true, name: true, avatar: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();

  try {
    await db.comment.delete({
      where: { id, commenterId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
