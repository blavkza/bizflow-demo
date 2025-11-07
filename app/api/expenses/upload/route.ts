import { NextResponse } from "next/server";
import { createHash } from "crypto";

const ALLOWED_FILE_TYPES = {
  image: {
    mimePrefix: "image/",
    maxSize: 5 * 1024 * 1024, // 5MB
    folder: "expenses/images",
  },
  pdf: {
    mimeTypes: ["application/pdf"],
    maxSize: 10 * 1024 * 1024, // 10MB
    folder: "expenses/documents",
  },
  document: {
    mimeTypes: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    folder: "expenses/documents",
  },
  other: {
    maxSize: 20 * 1024 * 1024, // 20MB
    folder: "expenses/uploads",
  },
};

async function generateChecksum(buffer: Buffer): Promise<string> {
  return createHash("sha256").update(buffer).digest("hex");
}

function getFileType(file: File): "IMAGE" | "PDF" | "DOCUMENT" | "OTHER" {
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type === "application/pdf") return "PDF";
  if (ALLOWED_FILE_TYPES.document.mimeTypes.includes(file.type))
    return "DOCUMENT";
  return "OTHER";
}

function getFileCategory(file: File): keyof typeof ALLOWED_FILE_TYPES {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  if (ALLOWED_FILE_TYPES.document.mimeTypes.includes(file.type))
    return "document";
  return "other";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const expenseId = formData.get("expenseId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // File type detection
    const fileCategory = getFileCategory(file);
    const fileConfig = ALLOWED_FILE_TYPES[fileCategory];

    // Check file size
    if (file.size > fileConfig.maxSize) {
      return NextResponse.json(
        {
          error: `File size must be less than ${
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
      return NextResponse.json(
        { error: "Cloudinary configuration missing" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const checksum = await generateChecksum(buffer);
    const timestamp = Date.now();
    const originalFileName = file.name.replace(/\.[^/.]+$/, "");
    const safeFileName = originalFileName.replace(/[^a-zA-Z0-9-_]/g, "_");
    const fileType = getFileType(file);

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append(
      "file",
      `data:${file.type};base64,${buffer.toString("base64")}`
    );
    cloudinaryFormData.append("upload_preset", uploadPreset);
    cloudinaryFormData.append("folder", fileConfig.folder);
    cloudinaryFormData.append(
      "public_id",
      `expense_${expenseId || "temp"}_${safeFileName}_${timestamp}`
    );

    const cloudinaryResponse = await fetch(cloudinaryUrl, {
      method: "POST",
      body: cloudinaryFormData,
    });

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.json();
      console.error("Cloudinary upload failed:", errorData);
      return NextResponse.json(
        {
          error: "Cloudinary upload failed",
          details: errorData.error?.message,
        },
        { status: cloudinaryResponse.status }
      );
    }

    const cloudinaryData = await cloudinaryResponse.json();

    const attachmentData = {
      id: `attch_${timestamp}`,
      filename: file.name,
      url: cloudinaryData.secure_url,
      publicId: cloudinaryData.public_id,
      type: fileType,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      mimeType: file.type,
    };

    return NextResponse.json(attachmentData);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
