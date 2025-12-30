import { NextResponse } from "next/server";
import { createHash } from "crypto";

const ALLOWED_FILE_TYPES = {
  image: {
    mimePrefix: "image/",
    maxSize: 5 * 1024 * 1024, // 5MB
    folder: "packages/images",
  },
};

async function generateChecksum(buffer: Buffer): Promise<string> {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const packageId = formData.get("packageId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const fileConfig = ALLOWED_FILE_TYPES.image;
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > fileConfig.maxSize) {
      return NextResponse.json(
        {
          error: `Image size must be less than ${
            fileConfig.maxSize / 1024 / 1024
          }MB`,
        },
        { status: 400 }
      );
    }

    // Cloudinary configuration
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!process.env.CLOUDINARY_CLOUD_NAME || !uploadPreset) {
      console.error("Cloudinary config missing:", {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        hasPreset: !!uploadPreset,
      });
      return NextResponse.json(
        { error: "Image upload service is not configured" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const checksum = await generateChecksum(buffer);
    const timestamp = Date.now();
    const originalFileName = file.name.replace(/\.[^/.]+$/, "");
    const safeFileName = originalFileName.replace(/[^a-zA-Z0-9-_]/g, "_");

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append(
      "file",
      `data:${file.type};base64,${buffer.toString("base64")}`
    );
    cloudinaryFormData.append("upload_preset", uploadPreset);
    cloudinaryFormData.append("folder", fileConfig.folder);
    cloudinaryFormData.append(
      "public_id",
      `package_${packageId || "temp"}_${safeFileName}_${timestamp}_${checksum.slice(0, 8)}`
    );
    cloudinaryFormData.append("resource_type", "auto");

    const cloudinaryResponse = await fetch(cloudinaryUrl, {
      method: "POST",
      body: cloudinaryFormData,
    });

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.json();
      console.error("Cloudinary upload failed:", errorData);
      return NextResponse.json(
        {
          error: "Image upload failed",
          details: errorData.error?.message,
        },
        { status: cloudinaryResponse.status }
      );
    }

    const cloudinaryData = await cloudinaryResponse.json();

    return NextResponse.json({
      url: cloudinaryData.secure_url,
      public_id: cloudinaryData.public_id,
      width: cloudinaryData.width,
      height: cloudinaryData.height,
      format: cloudinaryData.format,
      bytes: cloudinaryData.bytes,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
