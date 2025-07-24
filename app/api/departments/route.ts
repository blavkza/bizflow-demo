import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const departmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  managerId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = departmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, description, managerId } = validation.data;

    // Only check manager if managerId is provided
    if (managerId) {
      const managerExists = await db.user.findUnique({
        where: { id: managerId },
      });

      if (!managerExists) {
        return NextResponse.json(
          { error: "Specified manager does not exist" },
          { status: 400 }
        );
      }
    }

    function generateClientNumber() {
      const randomSix = Math.floor(100000 + Math.random() * 900000);
      return `DPT-${randomSix}`;
    }

    const code = generateClientNumber();

    const department = await db.department.create({
      data: {
        code,
        name,
        description,
        managerId, // Explicitly set to null if undefined
      },
      include: {
        manager: true,
      },
    });

    return NextResponse.json({ department });
  } catch (error) {
    console.error("[DEPARTMENT_CREATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const departments = await db.department.findMany({
      select: {
        id: true,
        name: true,
      },
      where: {
        status: "ACTIVE",
      },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("[User ERROR]", error);
    return NextResponse.error();
  }
}
