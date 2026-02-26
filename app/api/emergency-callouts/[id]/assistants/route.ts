import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/expo";

// POST: Selected leader adds assistants to the callout
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: callOutId } = await params;
    const { assistantIds } = await req.json(); // Array of User IDs

    if (
      !assistantIds ||
      !Array.isArray(assistantIds) ||
      assistantIds.length === 0
    ) {
      return NextResponse.json(
        { error: "assistantIds array is required" },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({ where: { userId: clerkId } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Only the SELECTED leader can add assistants
    const callOut = await db.emergencyCallOut.findUnique({
      where: { id: callOutId },
      include: {
        leaders: { where: { userId: user.id, status: "SELECTED" } },
      },
    });

    if (!callOut) {
      return NextResponse.json(
        { error: "Call-out not found" },
        { status: 404 },
      );
    }

    // Allow if: user is the SELECTED leader OR user created the callout (self-created)
    const isSelectedLeader = callOut.leaders.length > 0;
    const isSelfCreator =
      callOut.requestedBy === user.id && callOut.leaders.length === 0;

    if (!isSelectedLeader && !isSelfCreator) {
      return NextResponse.json(
        { error: "Only the selected leader can add assistants" },
        { status: 403 },
      );
    }

    if (!callOut.allowAssistants) {
      return NextResponse.json(
        { error: "This call-out does not allow assistants" },
        { status: 400 },
      );
    }

    // Fetch assistant user data
    const assistantsData = await db.user.findMany({
      where: { id: { in: assistantIds } },
      select: {
        id: true,
        name: true,
        employeeId: true,
        freeLancerId: true,
        traineeId: true,
      },
    });

    // Skip already-added assistants
    const existing = await db.callOutAssistant.findMany({
      where: { emergencyCallOutId: callOutId, userId: { in: assistantIds } },
      select: { userId: true },
    });
    const existingIds = new Set(existing.map((e) => e.userId));
    const newAssistants = assistantsData.filter((a) => !existingIds.has(a.id));

    if (newAssistants.length === 0) {
      return NextResponse.json({
        message: "All selected users are already assistants",
        added: 0,
      });
    }

    // Create assistant records
    await db.callOutAssistant.createMany({
      data: newAssistants.map((a) => ({
        emergencyCallOutId: callOutId,
        userId: a.id,
        employeeId: a.employeeId,
        freelancerId: a.freeLancerId,
        traineeId: a.traineeId,
        status: "PENDING",
      })),
    });

    // Update worker count
    const totalAssistants = await db.callOutAssistant.count({
      where: { emergencyCallOutId: callOutId },
    });
    await db.emergencyCallOut.update({
      where: { id: callOutId },
      data: { workerCount: totalAssistants + 1 }, // +1 for the leader
    });

    // Notify new assistants
    for (const assistant of newAssistants) {
      await sendPushToUser({
        userId: assistant.id,
        title: "⚠️ Call-Out Invitation",
        body: `${user.name} has added you as an assistant for an emergency call-out at ${callOut.destination}.`,
        data: { url: `/emergency-callouts/${callOutId}` },
      });

      await db.notification.create({
        data: {
          userId: assistant.id,
          title: "⚠️ Call-Out Invitation",
          message: `${user.name} has added you as an assistant for an emergency call-out at ${callOut.destination}.`,
          type: "EMERGENCY",
          priority: "HIGH",
          actionUrl: `/emergency-callouts/${callOutId}`,
          metadata: { callOutId: callOutId },
        },
      });
    }

    return NextResponse.json({
      success: true,
      added: newAssistants.length,
      message: `${newAssistants.length} assistant(s) added`,
    });
  } catch (error) {
    console.error("[ADD_ASSISTANTS]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET: Fetch assistants for a callout
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: callOutId } = await params;

    const assistants = await db.callOutAssistant.findMany({
      where: { emergencyCallOutId: callOutId },
      include: {
        user: { select: { id: true, name: true, avatar: true, email: true } },
      },
    });

    return NextResponse.json(assistants);
  } catch (error) {
    console.error("[GET_ASSISTANTS]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
