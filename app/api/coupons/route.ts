import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { DiscountType, UserPermission, UserRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await db.user.findUnique({
      where: { userId },
      select: { permissions: true, role: true },
    });

    if (!user || (user.role !== UserRole.CHIEF_EXECUTIVE_OFFICER && !user.permissions.includes(UserPermission.Coupon_CREATE))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { 
        code, 
        type, 
        value, 
        minOrderAmount, 
        startDate, 
        endDate, 
            usageLimit, 
            isActive,
            productIds
        } = body;
    
        if (!code || !type || !value || !startDate) {
            return new NextResponse("Missing required fields", { status: 400 });
        }
    
        const existing = await db.coupon.findUnique({
            where: { code }
        });
    
        if (existing) {
            return new NextResponse("Coupon code already exists", { status: 409 });
        }
    
        const coupon = await db.coupon.create({
            data: {
                code,
                type: type as DiscountType,
                value,
                minOrderAmount: minOrderAmount || null,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                usageLimit: usageLimit || null,
                isActive,
                products: productIds && productIds.length > 0 ? {
                    connect: productIds.map((id: string) => ({ id }))
                } : undefined
            }
        });

    return NextResponse.json(coupon);

  } catch (error) {
    console.log("[COUPONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const user = await db.user.findUnique({
            where: { userId },
            select: { permissions: true, role: true },
        });

        if (!user || (user.role !== UserRole.CHIEF_EXECUTIVE_OFFICER && !user.permissions.includes(UserPermission.Coupon_VIEW))) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");

        const coupons = await db.coupon.findMany({
            where: code ? { code: { equals: code, mode: 'insensitive' } } : undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                products: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return NextResponse.json(coupons);
    } catch (error) {
        console.log("[COUPONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
