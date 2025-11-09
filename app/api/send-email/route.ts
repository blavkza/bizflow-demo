// app/api/send-email/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { InvoiceProps } from "@/types/invoice";
import { InvoiceEmail } from "@/components/email/invoice-email";
import db from "@/lib/db";
import { InvoiceReportGenerator } from "@/lib/invoiceReportGenerator";
import { PDFService } from "@/lib/services/pdf-service";
import { auth } from "@clerk/nextjs/server";

interface EmailRequest {
  invoice: InvoiceProps;
  toEmail: string;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const creator = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creator) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { invoice, toEmail } = (await request.json()) as EmailRequest;

    // Validate email input
    if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      return NextResponse.json(
        { error: "Invalid recipient email address" },
        { status: 400 }
      );
    }

    // Get company info for the PDF
    const companyInfo = await db.generalSetting.findFirst();

    // Generate PDF
    let pdfBuffer: Buffer;
    let pdfGenerationMethod = "primary";

    try {
      pdfBuffer = await PDFService.generateInvoicePDF(invoice, companyInfo);
    } catch (pdfError) {
      console.error("Primary PDF generation failed:", pdfError);

      // Fallback: Try basic PDF generation
      try {
        const { PDFService } = await import("@/lib/services/pdf-service");
        pdfBuffer = await PDFService.generateInvoicePDF(invoice, companyInfo);
        pdfGenerationMethod = "fallback";
      } catch (fallbackError) {
        console.error("All PDF generation methods failed:", fallbackError);

        const companyInfo = await db.generalSetting.findFirst();

        console.log(`Starting email send to: ${toEmail}`);
        console.log(`SMTP Host: ${process.env.SMTP_HOST}`);
        console.log(`SMTP Port: ${process.env.SMTP_PORT}`);
        console.log(`SMTP User: ${process.env.SMTP_MAIL}`);

        const mappedCompanyInfo = companyInfo
          ? {
              id: companyInfo.id,
              companyName: companyInfo.companyName,
              taxId: companyInfo.taxId,
              address: companyInfo.Address,
              city: companyInfo.city,
              website: companyInfo.website || "",
              paymentTerms: companyInfo.paymentTerms || "",
              note: companyInfo.note || "",
              bankAccount: companyInfo.bankAccount || "",
              bankAccount2: companyInfo.bankAccount2 || "",
              bankName: companyInfo.bankName || "",
              bankName2: companyInfo.bankName2 || "",
              logo: companyInfo.logo || "",
              province: companyInfo.province,
              postCode: companyInfo.postCode,
              phone: companyInfo.phone,
              phone2: companyInfo.phone2 || "",
              phone3: companyInfo.phone3 || "",
              email: companyInfo.email,
            }
          : null;

        // Final fallback: Use HTML content
        const htmlContent = InvoiceReportGenerator.generateInvoiceReportHTML(
          invoice,
          mappedCompanyInfo
        );
        pdfBuffer = Buffer.from(htmlContent, "utf-8");
        pdfGenerationMethod = "html";
      }
    }

    // Create email HTML
    const emailHtml = await render(InvoiceEmail({ invoice }));

    // Create secure transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify connection
    await transporter.verify();

    // Determine attachment type
    const isPDF = pdfGenerationMethod !== "html";
    const attachment = {
      filename: `invoice_${invoice.invoiceNumber}.${isPDF ? "pdf" : "html"}`,
      content: pdfBuffer,
      contentType: isPDF ? "application/pdf" : "text/html",
    };

    // Send email with attachment
    const info = await transporter.sendMail({
      from: `"${invoice.creator.GeneralSetting[0]?.companyName || "Rethynk Domain"}" <${process.env.SMTP_MAIL}>`,
      to: toEmail,
      subject: `Invoice #${invoice.invoiceNumber} - ${invoice.creator.GeneralSetting[0]?.companyName || "Rethynk Domain"}`,
      html: emailHtml,
      attachments: [attachment],
    });

    // Update invoice status to SENT if not already PAID
    const updatedInvoiceStatus = await db.invoice.updateMany({
      where: {
        id: invoice.id,
        status: { not: "PAID" },
      },
      data: { status: "SENT" },
    });

    // Log the email sending
    await db.notification.create({
      data: {
        title: "Invoice Sent",
        message: `Invoice ${invoice.invoiceNumber} was sent to ${toEmail} (${pdfGenerationMethod} method)`,
        type: "INVOICE",
        isRead: false,
        actionUrl: `/dashboard/invoices/${invoice.id}`,
        userId: creator.id,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      updatedInvoiceStatus,
      pdfMethod: pdfGenerationMethod,
      message: `Invoice sent successfully to ${toEmail}`,
    });
  } catch (error) {
    console.error("Email sending error:", error);

    return NextResponse.json(
      { error: "Failed to send email. Please try again later." },
      { status: 500 }
    );
  }
}
