import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const trainees = await db.trainee.findMany({
      include: {
        tools: true,
      },
    });

    const stats = trainees.map((trainee) => {
      // @ts-ignore
      const tools = trainee.tools || [];
      const toolsCount = tools.reduce(
        (sum: number, t: any) => sum + (t.quantity || 1),
        0,
      );
      const totalValue = tools.reduce(
        (sum: number, t: any) =>
          sum + Number(t.purchasePrice) * (t.quantity || 1),
        0,
      );
      const damageCost = tools.reduce(
        (sum: number, t: any) => sum + Number(t.damageCost || 0),
        0,
      );

      return {
        id: trainee.id,
        name: `${trainee.firstName} ${trainee.lastName}`,
        workerNumber: trainee.traineeNumber,
        toolsCount,
        totalValue,
        damageCost,
        type: "TRAINEE",
      };
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.log("[EMPLOYEE_TOOLS_STATS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
