import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, projectId, commenterId, commenterName } = body;

    // Validate input
    if (!content || !projectId || !commenterId) {
      return NextResponse.json(
        { error: "Missing required fields: content, projectId, commenterId" },
        { status: 400 }
      );
    }

    // Verify User exists
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
        { error: "Unauthorized to Comment or Project not found" },
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

    // Create Comment
    const comment = await db.comment.create({
      data: {
        content,
        projectId,
        commenterName: commenterName || user.name || "Anonymous",
        commenterId: commenterId,
        commenterAvatar: user.avatar || null,
        commenterRole: role,
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("[COMMENT_CREATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
