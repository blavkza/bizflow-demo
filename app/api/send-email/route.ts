// app/api/send-email/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { InvoiceProps } from "@/types/invoice";
import { InvoiceEmail } from "@/components/email/invoice-email";
import db from "@/lib/db";

interface EmailRequest {
  invoice: InvoiceProps;
  toEmail: string;
}

export async function POST(request: Request) {
  try {
    const { invoice, toEmail } = (await request.json()) as EmailRequest;

    // Validate email input
    if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      return NextResponse.json(
        { error: "Invalid recipient email address" },
        { status: 400 }
      );
    }

    // Create email HTML
    const emailHtml = await render(InvoiceEmail({ invoice }));

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

    // Send email
    const info = await transporter.sendMail({
      from: `"${invoice.creator.GeneralSetting[0]?.companyName || "Rethynk Domain"}" <${process.env.SMTP_MAIL}>`,
      to: toEmail,
      subject: `Invoice #${invoice.invoiceNumber}`,
      html: emailHtml,
      attachments: [
        {
          filename: `invoice_${invoice.invoiceNumber}.pdf`,
          path: invoice.pdfUrl,
          contentType: "application/pdf",
        },
      ],
    });

    const updatedInvoiveStatus = await db.invoice.update({
      where: { id: invoice.id },
      data: { status: "SENT" },
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      updatedInvoiveStatus,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: "Failed to send email. Please try again later." },
      { status: 500 }
    );
  }
}
