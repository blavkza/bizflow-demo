import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const getCurrentUser = async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { userId },
    select: { id: true, name: true },
  });

  return user || null;
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const chatSessions = await db.chatSession.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    const formattedSessions = chatSessions.map((session) => ({
      id: session.id,
      title: session.title,
      messages: session.messages as any[],
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, messages } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Cannot create session with empty messages" },
        { status: 400 }
      );
    }

    const chatSession = await db.chatSession.create({
      data: {
        title,
        messages,
        userId: user.id,
      },
    });

    const formattedSession = {
      id: chatSession.id,
      title: chatSession.title,
      messages: chatSession.messages as any[],
      createdAt: chatSession.createdAt.toISOString(),
      updatedAt: chatSession.updatedAt.toISOString(),
    };

    return NextResponse.json(formattedSession);
  } catch (error) {
    console.error("Error creating chat session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, title, messages } = await request.json();

    const session = await db.chatSession.findUnique({ where: { id } });
    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatSession = await db.chatSession.update({
      where: { id },
      data: { title, messages, updatedAt: new Date() },
    });

    const formattedSession = {
      id: chatSession.id,
      title: chatSession.title,
      messages: chatSession.messages as any[],
      createdAt: chatSession.createdAt.toISOString(),
      updatedAt: chatSession.updatedAt.toISOString(),
    };

    return NextResponse.json(formattedSession);
  } catch (error) {
    console.error("Error updating chat session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: delete chat session
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const session = await db.chatSession.findUnique({ where: { id } });
    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.chatSession.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
