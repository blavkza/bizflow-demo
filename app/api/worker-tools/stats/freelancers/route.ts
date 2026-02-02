import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const freelancers = await db.freeLancer.findMany({
      include: {
        tools: true,
      },
    });

    const stats = freelancers.map((f) => {
      // @ts-ignore
      const tools = f.tools || [];
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
        id: f.id,
        name: `${f.firstName} ${f.lastName}`,
        workerNumber: f.freeLancerNumber,
        toolsCount,
        totalValue,
        damageCost,
        type: "FREELANCER",
      };
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.log("[FREELANCER_TOOLS_STATS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
