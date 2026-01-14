import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string;
    const clientId = formData.get("clientId") as string | null;
    const employeeId = formData.get("employeeId") as string | null;
    const settingsId = formData.get("settingsId") as string | null;
    const freelancerId = formData.get("freelancerId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Cloudinary configuration
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudinaryUrl || !uploadPreset) {
      return NextResponse.json(
        { error: "Cloudinary configuration missing" },
        { status: 500 }
      );
    }

    // Read file as buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();

    // Get current user for authorization check
    const currentUser = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine the ID to use for public_id
    const entityId =
      type === "client"
        ? clientId
        : type === "employee"
          ? employeeId
          : type === "settings"
            ? settingsId
            : type === "freelancer"
              ? freelancerId
              : userId;

    if (
      (type === "client" && !clientId) ||
      (type === "employee" && !employeeId) ||
      (type === "settings" && !settingsId) ||
      (type === "freelancer" && !freelancerId)
    ) {
      return NextResponse.json(
        { error: `Missing ${type} ID` },
        { status: 400 }
      );
    }

    // For settings type, check if user has admin permissions
    if (type === "settings") {
      if (
        currentUser.role !== UserRole.CHIEF_EXECUTIVE_OFFICER &&
        currentUser.role !== UserRole.GENERAL_MANAGER &&
        currentUser.role !== UserRole.ADMIN_MANAGER
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Upload to Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append(
      "file",
      `data:${file.type};base64,${buffer.toString("base64")}`
    );
    cloudinaryFormData.append("upload_preset", uploadPreset);
    cloudinaryFormData.append("folder", "avatars");
    cloudinaryFormData.append(
      "public_id",
      `${type}_${entityId}_avatar_${timestamp}`
    );
    const cloudinaryResponse = await fetch(cloudinaryUrl, {
      method: "POST",
      body: cloudinaryFormData,
    });

    const cloudinaryData = await cloudinaryResponse.json();

    if (!cloudinaryResponse.ok) {
      console.error("Cloudinary error:", cloudinaryData);
      throw new Error(cloudinaryData.error?.message || "Upload failed");
    }

    // Update the appropriate entity in database
    if (type === "client" && clientId) {
      await db.client.update({
        where: { id: clientId },
        data: { avatar: cloudinaryData.secure_url },
      });
    } else if (type === "employee" && employeeId) {
      await db.employee.update({
        where: { id: employeeId },
        data: { avatar: cloudinaryData.secure_url },
      });
    } else if (type === "settings" && settingsId) {
      // For settings, update logo for ALL users
      const allUsers = await db.user.findMany({
        select: { id: true },
      });

      // Use transaction for batch update
      await db.$transaction(async (tx) => {
        for (const user of allUsers) {
          const userSettings = await tx.generalSetting.findFirst({
            where: { userId: user.id },
          });

          if (userSettings) {
            // Update existing settings
            await tx.generalSetting.update({
              where: { id: userSettings.id },
              data: { logo: cloudinaryData.secure_url },
            });
          } else {
            // Create new settings with logo and default values
            await tx.generalSetting.create({
              data: {
                userId: user.id,
                logo: cloudinaryData.secure_url,
                companyName: "Company Name",
                taxId: "",
                Address: "",
                city: "",
                province: "",
                postCode: "",
                phone: "",
                phone2: null,
                phone3: null,
                email: "",
                website: "",
                bankName: "",
                bankAccount: "",
                bankName2: null,
                bankAccount2: null,
                paymentTerms: "",
                note: "",
              },
            });
          }
        }
      });

      // Create notification for system update
      await db.notification.create({
        data: {
          title: "Company Logo Updated",
          message: `Company logo has been updated by ${currentUser.name}.`,
          type: "SYSTEM",
          isRead: false,
          actionUrl: `/dashboard/settings`,
          userId: currentUser.id,
        },
      });
    } else if (type === "freelancer" && freelancerId) {
      await db.freeLancer.update({
        where: { id: freelancerId },
        data: { avatar: cloudinaryData.secure_url },
      });
    } else {
      await db.user.update({
        where: { userId },
        data: { avatar: cloudinaryData.secure_url },
      });
    }

    return NextResponse.json({
      url: cloudinaryData.secure_url,
      public_id: cloudinaryData.public_id,
      message:
        type === "settings"
          ? "Logo updated for all users"
          : "Upload successful",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
