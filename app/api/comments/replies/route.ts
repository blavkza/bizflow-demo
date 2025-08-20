import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

  const { content, commentId, projectId } = await request.json();

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
  try {
    const reply = await db.commentReply.create({
      data: {
        content,
        commentId,
        commenterName: user.name || "Anonymous",
        commenterId: user.id,
        commenterAvatar: user.avatar || null,
        commenterRole: manager
          ? " Project Manager"
          : teamMember?.role || "User",
      },
    });

    return NextResponse.json(reply);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create reply" },
      { status: 500 }
    );
  }
}

// Like a reply
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

  const { id, liked } = await request.json();

  try {
    const reply = await db.commentReply.update({
      where: { id },
      data: {
        liked,
      },
    });

    return NextResponse.json(reply);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update reply" },
      { status: 500 }
    );
  }
}

// Delete reply
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
    await db.commentReply.delete({
      where: { id, commenterId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete reply" },
      { status: 500 }
    );
  }
}
