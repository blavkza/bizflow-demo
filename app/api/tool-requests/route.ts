import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushNotification } from "@/lib/expo";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const requests = await db.toolRequest.findMany({
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            department: { select: { name: true } },
          },
        },
        freelancer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch images for tools
    const toolNames = Array.from(
      new Set(requests.map((r: any) => r.toolName as string)),
    );
    const tools = await db.employeeTool.findMany({
      where: {
        name: { in: toolNames },
        NOT: {
          images: {
            equals: [],
          },
        },
      },
      select: {
        name: true,
        images: true,
      },
    });

    // Create a map of toolName -> firstImage
    const imageMap: Record<string, string> = {};
    tools.forEach((t: any) => {
      if (t.images && t.images.length > 0 && !imageMap[t.name]) {
        imageMap[t.name] = t.images[0];
      }
    });

    const enrichedRequests = requests.map((r: any) => ({
      ...r,
      toolImage: imageMap[r.toolName] || null,
    }));

    return NextResponse.json(enrichedRequests);
  } catch (error) {
    console.error("[TOOL_REQUESTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      toolName,
      type,
      priority,
      description,
      employeeId,
      freelancerId,
      notes,
    } = body;

    const request = await db.toolRequest.create({
      data: {
        toolName,
        type,
        priority, // Assuming frontend sends valid enum or string that matches
        description,
        employeeId,
        freelancerId,
        notes,
        status: "PENDING",
      },
    });

    // Send notification if it's an employee
    if (employeeId) {
      const message = `Tool Request Created: ${toolName}`;

      // 1. Push Notification
      await sendPushNotification({
        employeeId,
        title: "New Tool Request",
        body: message,
        data: { type: "TOOL_REQUEST", id: request.id },
      });

      // 2. In-App Notification Record
      await db.employeeNotification.create({
        data: {
          employeeId,
          title: "Tool Request Submitted",
          message: `Your request for ${toolName} has been submitted successfully.`,
          type: "SYSTEM", // Changed from INFO to SYSTEM
          isRead: false,
        },
      });
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("[TOOL_REQUESTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
