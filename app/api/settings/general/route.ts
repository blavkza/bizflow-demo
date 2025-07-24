import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Authenticate the admin user making this request
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the requesting user has admin privileges
    const adminUser = await db.user.findUnique({
      where: { userId },
      select: { role: true },
    });

    if (
      !adminUser ||
      (adminUser.role !== "ADMIN" && adminUser.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      companyName,
      taxId,
      address,
      city,
      website,
      paymentTerms,
      note,
      bankAccount,
      postCode,
      province,
      phone,
      email,
    } = body;

    // Get all users
    const allUsers = await db.user.findMany({
      select: { id: true },
    });

    if (!allUsers.length) {
      return NextResponse.json({ error: "No users found" }, { status: 404 });
    }

    const results = [];

    for (const user of allUsers) {
      // Check if settings already exist for this user
      const existingSettings = await db.generalSetting.findFirst({
        where: { userId: user.id },
      });

      if (existingSettings) {
        const updatedSettings = await db.generalSetting.update({
          where: { id: existingSettings.id },
          data: {
            companyName,
            taxId,
            Address: address,
            city,
            website,
            paymentTerms,
            note,
            bankAccount,
            postCode,
            province,
            phone,
            email,
          },
        });
        results.push({
          userId: user.id,
          action: "updated",
          settings: updatedSettings,
        });
      } else {
        const newSettings = await db.generalSetting.create({
          data: {
            userId: user.id,
            companyName,
            taxId,
            Address: address,
            city,
            website,
            paymentTerms,
            note,
            bankAccount,
            postCode,
            province,
            phone,
            email,
          },
        });
        results.push({
          userId: user.id,
          action: "created",
          settings: newSettings,
        });
      }
    }

    return NextResponse.json({
      message: "Batch operation completed",
      results,
    });
  } catch (error) {
    console.error("[BATCH_GENERAL_SETTINGS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await db.generalSetting.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        companyName: true,
        taxId: true,
        Address: true,
        city: true,
        website: true,
        paymentTerms: true,
        note: true,
        bankAccount: true,
        logo: true,
        province: true,
        postCode: true,
        phone: true,
        email: true,
      },
    });

    if (!settings) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    const transformedSettings = {
      id: settings.id,
      companyName: settings.companyName,
      taxId: settings.taxId,
      address: settings.Address,
      city: settings.city,
      website: settings.website,
      paymentTerms: settings.paymentTerms,
      note: settings.note,
      bankAccount: settings.bankAccount,
      logo: settings.logo,
      province: settings.province,
      postCode: settings.postCode,
      phone: settings.phone,
      email: settings.email,
    };

    return NextResponse.json({ data: transformedSettings });
  } catch (error) {
    console.error("[GET_GENERAL_SETTINGS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
