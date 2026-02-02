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
    const entityId = formData.get("entityId") as string;
    const entityType = formData.get("entityType") as
      | "folder"
      | "project"
      | "vender"
      | "client"
      | "employee"
      | "transaction"
      | "task"
      | "freeLancer"
      | "loan"
      | "loanPayment"
      | "lender";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!documentType || !entityId || !entityType) {
      return NextResponse.json(
        { error: "Document type, Entity ID and Entity Type are required" },
        { status: 400 },
      );
    }

    // Debug logging
    console.log("Upload request received:");
    console.log("  - Entity Type:", entityType);
    console.log("  - Entity ID:", entityId);
    console.log("  - Document Type:", documentType);
    console.log("  - File Name:", file.name);
    console.log("  - File Size:", file.size);
    console.log("  - File Type:", file.type);

    // Validate entity existence based on entity type
    switch (entityType) {
      case "folder":
        const folder = await db.folder.findUnique({ where: { id: entityId } });
        if (!folder) {
          console.log("Folder not found:", entityId);
          return NextResponse.json(
            { error: "Folder not found" },
            { status: 404 },
          );
        }
        break;
      case "project":
        const project = await db.project.findUnique({
          where: { id: entityId },
        });
        if (!project) {
          console.log("Project not found:", entityId);
          return NextResponse.json(
            { error: "Project not found" },
            { status: 404 },
          );
        }
        break;
      case "vender":
        const vendor = await db.vendor.findUnique({ where: { id: entityId } });
        if (!vendor) {
          console.log("Vendor not found:", entityId);
          return NextResponse.json(
            { error: "Vendor not found" },
            { status: 404 },
          );
        }
        break;
      case "client":
        const client = await db.client.findUnique({ where: { id: entityId } });
        if (!client) {
          console.log("Client not found:", entityId);
          return NextResponse.json(
            { error: "Client not found" },
            { status: 404 },
          );
        }
        break;
      case "employee":
        const employee = await db.employee.findUnique({
          where: { id: entityId },
        });
        if (!employee) {
          console.log("Employee not found:", entityId);
          return NextResponse.json(
            { error: "Employee not found" },
            { status: 404 },
          );
        }
        break;
      case "transaction":
        const transaction = await db.transaction.findUnique({
          where: { id: entityId },
        });
        if (!transaction) {
          console.log("Transaction not found:", entityId);
          return NextResponse.json(
            { error: "Transaction not found" },
            { status: 404 },
          );
        }
        break;
      case "task":
        const task = await db.task.findUnique({ where: { id: entityId } });
        if (!task) {
          console.log("Task not found:", entityId);
          return NextResponse.json(
            { error: "Task not found" },
            { status: 404 },
          );
        }
        break;
      case "freeLancer":
        const freeLancer = await db.freeLancer.findUnique({
          where: { id: entityId },
        });
        if (!freeLancer) {
          console.log("FreeLancer not found:", entityId);
          return NextResponse.json(
            { error: "FreeLancer not found" },
            { status: 404 },
          );
        }
        break;
      case "loan":
        const loan = await db.loan.findUnique({ where: { id: entityId } });
        if (!loan) {
          console.log("Loan not found:", entityId);
          return NextResponse.json(
            { error: "Loan not found" },
            { status: 404 },
          );
        }
        break;
      case "loanPayment":
        const loanPayment = await db.loanPayment.findUnique({
          where: { id: entityId },
        });
        if (!loanPayment) {
          console.log("LoanPayment not found:", entityId);
          return NextResponse.json(
            { error: "LoanPayment not found" },
            { status: 404 },
          );
        }
        break;
      case "lender":
        const lender = await db.lender.findUnique({ where: { id: entityId } });
        if (!lender) {
          console.log("Lender not found:", entityId);
          return NextResponse.json(
            { error: "Lender not found" },
            { status: 404 },
          );
        }
        break;
      default:
        console.log("Invalid entity type:", entityType);
        return NextResponse.json(
          {
            error: `Invalid entity type: ${entityType}. Must be one of: folder, project, vender, client, employee, transaction, task, freeLancer, loan, loanPayment, lender`,
          },
          { status: 400 },
        );
    }

    console.log("Entity validation passed for:", entityId);

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
        { status: 400 },
      );
    }

    // Cloudinary configuration
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`;
    const uploadPreset = "financeFlow";

    if (!process.env.CLOUDINARY_CLOUD_NAME || !uploadPreset) {
      return NextResponse.json(
        { error: "Cloudinary configuration missing" },
        { status: 500 },
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
      file.type,
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
        `data:${file.type};base64,${buffer.toString("base64")}`,
      );
    }

    cloudinaryFormData.append("upload_preset", uploadPreset);
    cloudinaryFormData.append("folder", "financeFlow/folders");
    cloudinaryFormData.append("resource_type", resourceType);

    const fileExtension = file.name.split(".").pop() || "bin";
    if (resourceType === "raw") {
      cloudinaryFormData.append(
        "public_id",
        `${entityType}_${entityId}_${safeFileName}_${timestamp}.${fileExtension}`,
      );
    } else {
      cloudinaryFormData.append(
        "public_id",
        `${entityType}_${entityId}_${safeFileName}_${timestamp}`,
      );
    }

    cloudinaryFormData.append(
      "context",
      `${entityType}_id=${entityId}|uploaded|document_type=${documentType}|resource_type=${resourceType}`,
    );

    console.log("Uploading to Cloudinary...");
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
        { status: cloudinaryResponse.status },
      );
    }

    const cloudinaryData = await cloudinaryResponse.json();
    console.log("Cloudinary upload successful:", cloudinaryData.secure_url);

    // Create database record
    const baseDocumentData = {
      name: file.name,
      originalName: file.name,
      type: Object.values(DocumentType).includes(documentType)
        ? documentType
        : "OTHER",
      url: cloudinaryData.secure_url,
      size: file.size,
      mimeType: file.type,
      checksum,
      starred: false,
      shared: false,
    };

    let documentData: any = { ...baseDocumentData };

    // Set the correct foreign key based on entityType
    switch (entityType) {
      case "folder":
        documentData.folderId = entityId;
        break;
      case "project":
        documentData.projectId = entityId;
        break;
      case "vender":
        documentData.venderId = entityId; // Note: matches your schema field name 'venderId'
        break;
      case "client":
        documentData.clientId = entityId;
        break;
      case "employee":
        documentData.employeeId = entityId;
        break;
      case "transaction":
        documentData.transactionId = entityId;
        break;
      case "task":
        documentData.taskId = entityId;
        break;
      case "freeLancer":
        documentData.freeLancerId = entityId;
        break;
      case "loan":
        documentData.loanId = entityId;
        break;
      case "loanPayment":
        documentData.loanPaymentId = entityId;
        break;
      case "lender":
        documentData.lenderId = entityId;
        break;
    }

    console.log("Creating document record with data:", documentData);

    const document = await db.document.create({
      data: documentData,
    });

    console.log("Document created successfully:", document.id);

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

    // Check if it's a Prisma error
    if (error instanceof Error && "code" in error) {
      const prismaError = error as any;
      console.error("Prisma error code:", prismaError.code);
      console.error("Prisma error meta:", prismaError.meta);

      if (prismaError.code === "P2003") {
        return NextResponse.json(
          {
            error: "Foreign key constraint violation",
            details: "The referenced entity does not exist",
            code: prismaError.code,
            meta: prismaError.meta,
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}

// Also add a GET endpoint to fetch documents for a specific entity
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType");

    if (!entityId || !entityType) {
      return NextResponse.json({
        message: "Documents API is working",
        supportedEntityTypes: [
          "folder",
          "project",
          "vender",
          "client",
          "employee",
          "transaction",
          "task",
          "freeLancer",
          "loan",
          "loanPayment",
          "lender",
        ],
      });
    }

    const query: any = {};
    switch (entityType) {
      case "folder":
        query.folderId = entityId;
        break;
      case "project":
        query.projectId = entityId;
        break;
      case "vender":
        query.venderId = entityId;
        break;
      case "client":
        query.clientId = entityId;
        break;
      case "employee":
        query.employeeId = entityId;
        break;
      case "transaction":
        query.transactionId = entityId;
        break;
      case "task":
        query.taskId = entityId;
        break;
      case "freeLancer":
        query.freeLancerId = entityId;
        break;
      case "loan":
        query.loanId = entityId;
        break;
      case "loanPayment":
        query.loanPaymentId = entityId;
        break;
      case "lender":
        query.lenderId = entityId;
        break;
    }

    const documents = await db.document.findMany({
      where: query,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("[DOCUMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
