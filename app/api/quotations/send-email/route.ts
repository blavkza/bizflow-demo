import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { QuotationWithRelations } from "@/types/quotation";
import { QuotationEmail } from "@/components/email/quotation-email";
import db from "@/lib/db";
import { QuotationReportGenerator } from "@/lib/quotationReportGenerator";
import { QuotationPDFService } from "@/lib/services/quotation-pdf-service";
import { auth } from "@clerk/nextjs/server";

interface EmailRequest {
  quotation: QuotationWithRelations;
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

    const { quotation, toEmail, combineServices, hideItemPrices } =
      (await request.json()) as EmailRequest & {
        combineServices?: boolean;
        hideItemPrices?: boolean;
      };

    // Validate email input
    if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      return NextResponse.json(
        { error: "Invalid recipient email address" },
        { status: 400 }
      );
    }

    // Get company info for the PDF
    const companyInfo = await db.generalSetting.findFirst();

    // Generate PDF or fallback to HTML
    let attachment: any;
    let attachmentType: "pdf" | "html" = "pdf";
    let pdfGenerationMethod = "primary";

    try {
      const pdfBuffer = await QuotationPDFService.generateQuotationPDF(
        quotation,
        companyInfo,
        {
          combineServices: combineServices ?? true,
          hideItemPrices: hideItemPrices ?? false,
        }
      );
      attachment = {
        filename: `quotation_${quotation.quotationNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      };
    } catch (pdfError) {
      console.error("Primary PDF generation failed:", pdfError);

      // Fallback: Try basic PDF generation
      try {
        const pdfBuffer = await QuotationPDFService.generateQuotationPDF(
          quotation,
          companyInfo,
          {
            combineServices: combineServices ?? true,
            hideItemPrices: hideItemPrices ?? false,
          }
        );
        attachment = {
          filename: `quotation_${quotation.quotationNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        };
        pdfGenerationMethod = "fallback";
      } catch (fallbackError) {
        console.error("All PDF generation methods failed:", fallbackError);

        // Final fallback: Use HTML content
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

        const htmlContent =
          QuotationReportGenerator.generateQuotationReportHTML(
            quotation,
            mappedCompanyInfo,
            {
              combineServices: combineServices ?? true,
              hideItemPrices: hideItemPrices ?? false,
            }
          );

        attachment = {
          filename: `quotation_${quotation.quotationNumber}.html`,
          content: htmlContent,
          contentType: "text/html",
        };
        attachmentType = "html";
        pdfGenerationMethod = "html";
      }
    }

    // Create email HTML
    const emailHtml = await render(
      QuotationEmail({ quotation, hideItemPrices: hideItemPrices ?? false })
    );

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

    // Calculate days until expiry
    const daysUntilExpiry = Math.ceil(
      (new Date(quotation.validUntil).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Get company name from quotation or use default
    const companyName =
      quotation.creator?.GeneralSetting?.[0]?.companyName || "Your Company";

    // Send email with attachment
    const info = await transporter.sendMail({
      from: `"${companyName}" <${process.env.SMTP_MAIL}>`,
      to: toEmail,
      subject: `Quotation #${quotation.quotationNumber} - ${companyName}`,
      html: emailHtml,
      attachments: [attachment],
    });

    // Update quotation status to SENT if not already CONVERTED or CANCELLED
    if (quotation.status === "DRAFT") {
      await db.quotation.update({
        where: { id: quotation.id },
        data: { status: "SENT" },
      });
    }

    // Log the email sending
    await db.notification.create({
      data: {
        title: "Quotation Sent",
        message: `Quotation ${quotation.quotationNumber} was sent to ${toEmail} (${pdfGenerationMethod} method)`,
        type: "QUOTATION",
        isRead: false,
        actionUrl: `/dashboard/quotations/${quotation.id}`,
        userId: creator.id,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      pdfMethod: pdfGenerationMethod,
      attachmentType,
      daysUntilExpiry,
      message: `Quotation sent successfully to ${toEmail}`,
    });
  } catch (error) {
    console.error("Quotation email sending error:", error);

    return NextResponse.json(
      { error: "Failed to send quotation email. Please try again later." },
      { status: 500 }
    );
  }
}
