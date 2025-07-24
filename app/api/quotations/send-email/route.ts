// app/api/quotations/send-email/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import db from "@/lib/db";
import { QuotationWithRelations } from "@/types/quotation";
import { QuotationEmail } from "@/components/email/quotation-email";

interface EmailRequest {
  quotation: QuotationWithRelations;
  toEmail: string;
  pdfUrl?: string;
}

export async function POST(request: Request) {
  try {
    const { quotation, toEmail, pdfUrl } =
      (await request.json()) as EmailRequest;

    // Validate email input
    if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      return NextResponse.json(
        { error: "Invalid recipient email address" },
        { status: 400 }
      );
    }

    // Create email HTML - await the render function
    const emailHtml = await render(QuotationEmail({ quotation }));

    // Create secure transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Only for testing, remove in production
      },
    });

    // Verify connection
    await transporter.verify();

    // Prepare attachments if PDF URL is provided
    const attachments = pdfUrl
      ? [
          {
            filename: `quotation_${quotation.quotationNumber}.pdf`,
            path: pdfUrl,
            contentType: "application/pdf",
          },
        ]
      : [];

    // Send email
    const info = await transporter.sendMail({
      from: `"${quotation.creator?.GeneralSetting?.[0]?.companyName || "Your Company"}" <${process.env.SMTP_MAIL}>`,
      to: toEmail,
      subject: `Quotation #${quotation.quotationNumber}`,
      html: emailHtml, // Now this is a string, not a Promise
      attachments,
    });

    // Update quotation status if needed
    /*  const updatedQuotation = await db.quotation.update({
      where: { id: quotation.id },
      data: { status: "SENT" },
    }); */

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: "Failed to send email. Please try again later." },
      { status: 500 }
    );
  }
}
