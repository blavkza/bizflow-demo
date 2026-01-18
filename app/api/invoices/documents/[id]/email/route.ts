// app/api/invoices/documents/[id]/email/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { InvoiceDocumentEmail } from "@/components/email/document-email";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { toEmail, subject, message } = await request.json();

    // Validate email input
    if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      return NextResponse.json(
        { error: "Invalid recipient email address" },
        { status: 400 }
      );
    }

    // Get the document from database
    const document = await db.invoiceDocument.findUnique({
      where: {
        id: params.id,
      },
      include: {
        creator: {
          include: {
            GeneralSetting: true,
          },
        },
        client: true,
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Get company info
    const companyInfo = document.creator?.GeneralSetting?.[0] || null;

    // Map company info to match the expected format
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

    // Generate email HTML
    const emailHtml = await render(
      InvoiceDocumentEmail({
        document,
        companyInfo: mappedCompanyInfo,
      })
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

    // Determine the contact name for the subject
    const contactName =
      document.client?.name || document.supplier?.name || "Customer";

    // Create the email subject
    const emailSubject =
      subject ||
      `${document.invoiceDocumentType}: ${document.invoiceDocumentNumber} - ${mappedCompanyInfo?.companyName || "Company"}`;

    // Send email
    const info = await transporter.sendMail({
      from: `"${mappedCompanyInfo?.companyName || "Company"}" <${process.env.SMTP_MAIL}>`,
      to: toEmail,
      subject: emailSubject,
      html: emailHtml,
      text: `Please view this email in HTML format to see the document.`,
    });

    // Update document status if it's a draft
    const updatedDocumentStatus = await db.invoiceDocument.update({
      where: {
        id: document.id,
      },
      data: {
        status: "SENT",
      },
    });

    // Log the email sending

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      updatedDocumentStatus,
      message: `${document.invoiceDocumentType} sent successfully to ${toEmail}`,
    });
  } catch (error) {
    console.error("Email sending error:", error);

    return NextResponse.json(
      { error: "Failed to send email. Please try again later." },
      { status: 500 }
    );
  }
}
