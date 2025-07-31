import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert to proper Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const data = await pdfParse(buffer);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      pageCount: data.numpages,
      text: data.text,
      previewText:
        data.text.substring(0, 500) + (data.text.length > 500 ? "..." : ""),
    });
  } catch (error) {
    console.error("PDF processing error:", error);
    return NextResponse.json(
      { error: "Failed to process PDF. Please try a different file." },
      { status: 500 }
    );
  }
}
