import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creator = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creator) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const adminUser = await db.user.findUnique({
      where: { userId },
      select: { role: true },
    });

    if (
      !adminUser ||
      (adminUser.role !== "CHIEF_EXECUTIVE_OFFICER" &&
        adminUser.role !== "GENERAL_MANAGER")
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
      bankAccount2,
      bankName,
      bankName2,
      postCode,
      province,
      phone,
      phone2,
      phone3,
      email,
    } = body;

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
            bankAccount2,
            bankName,
            bankName2,
            postCode,
            province,
            phone,
            phone2,
            phone3,
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
            bankAccount2,
            bankName,
            bankName2,
            postCode,
            province,
            phone,
            phone2,
            phone3,
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

    await db.notification.create({
      data: {
        title: "Settings Updated",
        message: `Settings , has been Updated By ${creator.name}.`,
        type: "SYSTEM",
        isRead: false,
        actionUrl: `/dashboard/settings`,
        userId: creator.id,
      },
    });

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
        bankAccount2: true,
        bankName: true,
        bankName2: true,
        logo: true,
        province: true,
        postCode: true,
        phone: true,
        phone2: true,
        phone3: true,
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
      bankAccount2: settings.bankAccount2,
      bankName: settings.bankName,
      bankName2: settings.bankName2,
      logo: settings.logo,
      province: settings.province,
      postCode: settings.postCode,
      phone: settings.phone,
      phone2: settings.phone2,
      phone3: settings.phone3,
      email: settings.email,
    };

    return NextResponse.json({ data: transformedSettings });
  } catch (error) {
    console.error("[GET_GENERAL_SETTINGS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
