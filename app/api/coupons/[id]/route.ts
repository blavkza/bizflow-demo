import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { DiscountType, UserPermission, UserRole } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const coupon = await db.coupon.findUnique({
      where: { id: params.id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true
          }
        },
        sales: {
          select: {
            id: true,
            saleNumber: true,
            total: true,
            createdAt: true,
            customerName: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!coupon) {
      return new NextResponse("Coupon not found", { status: 404 });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.log("[COUPON_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await db.user.findUnique({
      where: { userId },
      select: { permissions: true, role: true },
    });

    if (!user || (user.role !== UserRole.CHIEF_EXECUTIVE_OFFICER && !user.permissions.includes(UserPermission.Coupon_EDIT))) {
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
    
        const id = params.id;
    
        if (!code) return new NextResponse("Code is required", { status: 400 });
    
        const existing = await db.coupon.findFirst({
            where: { 
                code,
                 NOT: { id: id }
            }
        });
    
        if (existing) {
            return new NextResponse("Coupon code already exists", { status: 409 });
        }
    
        const coupon = await db.coupon.update({
            where: { id },
            data: {
                code,
                type: type as DiscountType,
                value,
                minOrderAmount: minOrderAmount || null,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                usageLimit: usageLimit || null,
                isActive,
                products: productIds ? {
                    set: productIds.map((id: string) => ({ id }))
                } : undefined
            }
        });

    return NextResponse.json(coupon);

  } catch (error) {
    console.log("[COUPON_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await db.user.findUnique({
      where: { userId },
      select: { permissions: true, role: true },
    });

    if (!user || (user.role !== UserRole.CHIEF_EXECUTIVE_OFFICER && !user.permissions.includes(UserPermission.Coupon_DELETE))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await db.coupon.delete({
        where: { id: params.id }
    });

    return new NextResponse("Coupon deleted", { status: 200 });

  } catch (error) {
    console.log("[COUPON_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
