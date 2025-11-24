import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, commentId, projectId, commenterId, commenterName } = body;

    if (!content || !commentId || !projectId || !commenterId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify User
    const user = await db.user.findUnique({
      where: { id: commenterId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify Project Access
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { managerId: commenterId },
          {
            teamMembers: {
              some: { userId: commenterId },
            },
          },
        ],
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Unauthorized to Reply or Project not found" },
        { status: 401 }
      );
    }

    // Determine Role
    const isManager = project.managerId === commenterId;
    let role = "User";

    if (isManager) {
      role = "Project Manager";
    } else {
      const teamMember = await db.projectTeam.findFirst({
        where: {
          projectId,
          userId: commenterId,
        },
        select: {
          role: true,
        },
      });
      role = teamMember?.role || "User";
    }

    // Create Reply
    const reply = await db.commentReply.create({
      data: {
        content,
        commentId,
        commenterName: commenterName || user.name || "Anonymous",
        commenterId: commenterId,
        commenterAvatar: user.avatar || null,
        commenterRole: role,
      },
    });

    return NextResponse.json(reply);
  } catch (error) {
    console.error("[COMMENT_REPLY_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create reply" },
      { status: 500 }
    );
  }
}
