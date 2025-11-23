// app/api/documents/route.ts

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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as DocumentType;
    // Get ID and Type from form data, NOT params
    const entityId = formData.get("entityId") as string;
    const entityType = formData.get("entityType") as "folder" | "project";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!documentType || !entityId) {
      return NextResponse.json(
        { error: "Document type and Entity ID are required" },
        { status: 400 }
      );
    }

    // Validate existence based on entity type
    if (entityType === "folder") {
      const folder = await db.folder.findUnique({ where: { id: entityId } });
      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 }
        );
      }
    } else if (entityType === "project") {
      const project = await db.project.findUnique({ where: { id: entityId } });
      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }
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

    let resourceType = "auto";
    if (isPDF || isDocument) {
      resourceType = "raw";
    } else if (isImage) {
      resourceType = "image";
    }

    // Cloudinary upload
    const cloudinaryFormData = new FormData();

    if (resourceType === "raw") {
      const blob = new Blob([buffer], { type: file.type });
      cloudinaryFormData.append("file", blob, file.name);
    } else {
      cloudinaryFormData.append(
        "file",
        `data:${file.type};base64,${buffer.toString("base64")}`
      );
    }

    cloudinaryFormData.append("upload_preset", uploadPreset);
    cloudinaryFormData.append("folder", "financeFlow/folders");
    cloudinaryFormData.append("resource_type", resourceType);

    const fileExtension = file.name.split(".").pop() || "bin";
    if (resourceType === "raw") {
      cloudinaryFormData.append(
        "public_id",
        `${entityType}_${entityId}_${safeFileName}_${timestamp}.${fileExtension}`
      );
    } else {
      cloudinaryFormData.append(
        "public_id",
        `${entityType}_${entityId}_${safeFileName}_${timestamp}`
      );
    }

    cloudinaryFormData.append(
      "context",
      `${entityType}_id=${entityId}|uploaded|document_type=${documentType}|resource_type=${resourceType}`
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
    // We conditionally set folderId or projectId based on entityType
    const documentData: any = {
      name: file.name,
      originalName: file.name,
      type: documentType,
      url: cloudinaryData.secure_url,
      size: file.size,
      mimeType: file.type,
      checksum,
    };

    if (entityType === "folder") {
      documentData.folderId = entityId;
    } else {
      documentData.projectId = entityId;
    }

    const document = await db.document.create({
      data: documentData,
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
