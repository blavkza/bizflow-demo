import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
        transactions: {
          select: {
            id: true,
            amount: true,
          },
        },
      },
    });

    // Calculate transaction count and total amount for each category
    const categoriesWithStats = categories.map((category) => {
      const totalAmount = category.transactions.reduce((sum, t) => {
        return (
          sum +
          (typeof t.amount === "object"
            ? t.amount.toNumber()
            : Number(t.amount))
        );
      }, 0);

      return {
        ...category,
        transactionCount: category.transactions.length,
        totalAmount,
      };
    });

    return NextResponse.json(categoriesWithStats);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch categories", error },
      { status: 500 }
    );
  }
}
