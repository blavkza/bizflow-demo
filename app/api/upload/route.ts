import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

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

    // Determine the ID to use for public_id
    const entityId =
      type === "client"
        ? clientId
        : type === "employee"
        ? employeeId
        : type === "settings"
        ? settingsId
        : userId;

    if (
      (type === "client" && !clientId) ||
      (type === "employee" && !employeeId) ||
      (type === "settings" && !settingsId)
    ) {
      return NextResponse.json(
        { error: `Missing ${type} ID` },
        { status: 400 }
      );
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
      await db.generalSetting.update({
        where: { id: settingsId },
        data: { logo: cloudinaryData.secure_url },
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
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
