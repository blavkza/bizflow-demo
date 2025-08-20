import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const creator = await db.user.findUnique({
    where: { userId },
    select: { id: true, name: true },
  });

  if (!creator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = await request.json();

  try {
    const currentUserMembership = await db.project.findFirst({
      where: {
        id: params.id,
        managerId: creator.id,
      },
    });

    if (!currentUserMembership) {
      return NextResponse.json(
        { error: "You do not have permission to update roles" },
        { status: 403 }
      );
    }

    const updatedMember = await db.projectTeam.update({
      where: {
        projectId_userId: {
          projectId: params.id,
          userId: params.userId,
        },
      },
      data: {
        role,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}
