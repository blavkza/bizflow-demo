import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const employees = await db.employee.findMany({
      include: {
        tools: true,
      },
    });

    const stats = employees.map((emp) => {
      // @ts-ignore
      const tools = emp.tools || [];
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
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        workerNumber: emp.employeeNumber,
        toolsCount,
        totalValue,
        damageCost,
        type: "EMPLOYEE",
      };
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.log("[EMPLOYEE_TOOLS_STATS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
