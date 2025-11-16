import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

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

    const document = await db.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // For Cloudinary files, redirect to the download URL
    if (document.url.includes("cloudinary.com")) {
      // Add download parameters to Cloudinary URL
      let downloadUrl = document.url;

      if (
        document.mimeType?.includes("pdf") ||
        document.originalName?.match(/\.(docx?|xlsx?|pptx?|txt)$/i)
      ) {
        downloadUrl += "?fl_attachment";
      } else {
        downloadUrl += "?dl=1";
      }

      return NextResponse.redirect(downloadUrl);
    }

    // For local files, you would serve the file directly
    return NextResponse.json(
      { error: "Direct download not implemented for local files" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error downloading document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
