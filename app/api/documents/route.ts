import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { createHash } from "crypto";
import { DocumentType } from "@prisma/client";

const ALLOWED_FILE_TYPES = {
  image: {
    mimePrefix: "image/",
    maxSize: 5 * 1024 * 1024,
  },
  pdf: {
    mimeTypes: ["application/pdf"],
    maxSize: 10 * 1024 * 1024,
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
  },
  other: {
    maxSize: 20 * 1024 * 1024,
  },
};

async function generateChecksum(buffer: Buffer): Promise<string> {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if folder exists
    const folder = await db.folder.findUnique({
      where: { id },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as DocumentType;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!documentType) {
      return NextResponse.json(
        { error: "Document type is required" },
        { status: 400 }
      );
    }

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

    // Cloudinary configuration
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`;
    const uploadPreset = "financeFlow";

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

    // Determine resource type for Cloudinary
    const isPDF = file.type === "application/pdf";
    const isDocument = ALLOWED_FILE_TYPES.document.mimeTypes.includes(
      file.type
    );
    const isImage = file.type.startsWith("image/");

    // Use "raw" resource type for PDFs and documents to preserve file format
    // Use "image" for images, "auto" for others
    let resourceType = "auto";
    if (isPDF || isDocument) {
      resourceType = "raw";
    } else if (isImage) {
      resourceType = "image";
    }

    // Cloudinary upload
    const cloudinaryFormData = new FormData();

    if (resourceType === "raw") {
      // For raw files, send the file as-is without base64 encoding
      const blob = new Blob([buffer], { type: file.type });
      cloudinaryFormData.append("file", blob, file.name);
    } else {
      // For images and other files, use base64 encoding
      cloudinaryFormData.append(
        "file",
        `data:${file.type};base64,${buffer.toString("base64")}`
      );
    }

    cloudinaryFormData.append("upload_preset", uploadPreset);
    cloudinaryFormData.append("folder", "financeFlow/folders");
    cloudinaryFormData.append("resource_type", resourceType);

    // For raw files, include the original filename in public_id
    const fileExtension = file.name.split(".").pop() || "bin";
    if (resourceType === "raw") {
      cloudinaryFormData.append(
        "public_id",
        `folder_${id}_${safeFileName}_${timestamp}.${fileExtension}`
      );
    } else {
      cloudinaryFormData.append(
        "public_id",
        `folder_${id}_${safeFileName}_${timestamp}`
      );
    }

    // Add context for better organization
    cloudinaryFormData.append(
      "context",
      `folder_id=${id}|uploaded_by user|document_type=${documentType}|resource_type=${resourceType}`
    );

    console.log("Cloudinary upload details:", {
      resourceType,
      fileType: file.type,
      fileName: file.name,
      public_id:
        resourceType === "raw"
          ? `folder_${id}_${safeFileName}_${timestamp}.${fileExtension}`
          : `folder_${id}_${safeFileName}_${timestamp}`,
    });

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
          resourceType,
          fileType: file.type,
        },
        { status: cloudinaryResponse.status }
      );
    }

    const cloudinaryData = await cloudinaryResponse.json();
    console.log("Cloudinary upload success:", {
      resource_type: cloudinaryData.resource_type,
      url: cloudinaryData.secure_url,
      format: cloudinaryData.format,
    });

    // Create database record
    const document = await db.document.create({
      data: {
        name: file.name, // Use original file name
        originalName: file.name,
        type: documentType,
        url: cloudinaryData.secure_url,
        size: file.size,
        mimeType: file.type,
        checksum,
        folderId: id,
      },
    });

    // Transform response for frontend
    const transformedDocument = {
      ...document,
      uploadedAt: document.createdAt,
      lastModified: document.updatedAt,
      starred: false,
      shared: false,
      tags: [],
      type: document.mimeType || "application/octet-stream",
    };

    return NextResponse.json(transformedDocument);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const documents = await db.document.findMany({
      where: { folderId: id },
      orderBy: { createdAt: "desc" },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        client: { select: { name: true } },
      },
    });

    // Transform the data
    const transformedDocuments = documents.map((doc) => ({
      ...doc,
      uploadedAt: doc.createdAt,
      lastModified: doc.updatedAt,
      starred: false,
      shared: false,
      tags: [],
      type: doc.mimeType || "application/octet-stream",
    }));

    return NextResponse.json(transformedDocuments);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
