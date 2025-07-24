import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { createHash } from "crypto";
import { DocumentType } from "@prisma/client";

const ALLOWED_FILE_TYPES = {
  image: {
    mimePrefix: "image/",
    maxSize: 5 * 1024 * 1024,
    folder: "images",
  },
  pdf: {
    mimeTypes: ["application/pdf"],
    maxSize: 10 * 1024 * 1024,
    folder: "documents",
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
    maxSize: 10 * 1024 * 1024,
    folder: "documents",
  },
  other: {
    maxSize: 20 * 1024 * 1024,
    folder: "uploads",
  },
};

async function generateChecksum(buffer: Buffer): Promise<string> {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as DocumentType;
    const entityType = formData.get("entityType") as
      | "employee"
      | "client"
      | "transaction"
      | null;
    const entityId = formData.get("entityId") as string | null;
    const parentId = formData.get("parentId") as string | null;

    if (!file)
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!documentType)
      return NextResponse.json(
        { error: "Document type is required" },
        { status: 400 }
      );

    // File type detection
    let fileCategory: keyof typeof ALLOWED_FILE_TYPES = "other";
    if (file.type.startsWith("image/")) fileCategory = "image";
    else if (file.type === "application/pdf") fileCategory = "pdf";
    else if (ALLOWED_FILE_TYPES.document.mimeTypes.includes(file.type))
      fileCategory = "document";

    const fileConfig = ALLOWED_FILE_TYPES[fileCategory];
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

    // Cloudinary configuration - using only allowed parameters
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`;
    const uploadPreset = "financeFlow"; // Your unsigned preset name

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

    // ONLY include parameters allowed for unsigned uploads
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append(
      "file",
      `data:${file.type};base64,${buffer.toString("base64")}`
    );
    cloudinaryFormData.append("upload_preset", uploadPreset);
    cloudinaryFormData.append("folder", "financeFlow");
    cloudinaryFormData.append(
      "public_id",
      `${documentType}_${entityId || userId}_${safeFileName}_${timestamp}`
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

    // Create database record
    const document = await db.document.create({
      data: {
        name: `${safeFileName}_${timestamp}`,
        originalName: file.name,
        type: documentType,
        url: cloudinaryData.secure_url,
        size: file.size,
        mimeType: file.type,
        checksum,
        ...(entityType && entityId && { [`${entityType}Id`]: entityId }),
        ...(parentId && { parentId }),
      },
    });

    return NextResponse.json({
      document,
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

// GET endpoint remains unchanged from your original
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const employeeId = searchParams.get("employeeId");
    const transactionId = searchParams.get("transactionId");

    if (!clientId && !employeeId && !transactionId) {
      return NextResponse.json(
        { error: "At least one entity ID is required" },
        { status: 400 }
      );
    }

    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (employeeId) where.employeeId = employeeId;
    if (transactionId) where.transactionId = transactionId;

    const documents = await db.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true } },
        employee: { select: { firstName: true, lastName: true } },
        transaction: { select: { id: true } },
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// Frontend URL formatter utility
export function formatCloudinaryUrl(url: string, forDownload = false): string {
  const isDocument = /\.(pdf|docx?|xlsx?|pptx?|txt)$/i.test(url);
  let formattedUrl = url;

  // Fix URL structure for documents
  if (isDocument) {
    formattedUrl = url.includes("image/upload")
      ? url.replace("image/upload", "raw/upload")
      : url;
  }

  // Add download flag if needed
  if (forDownload) {
    formattedUrl = isDocument
      ? `${formattedUrl}?fl_attachment`
      : `${formattedUrl}?dl=1`;
  }

  return formattedUrl;
}
