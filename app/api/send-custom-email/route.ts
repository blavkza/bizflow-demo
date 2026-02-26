import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

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

    const formData = await request.formData();
    const to = formData.get("to") as string;
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;
    const attachments = formData.getAll("attachments") as File[];

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get company info for "from" name
    const companyInfo = await db.generalSetting.findFirst();
    const companyName = companyInfo?.companyName || "Rethynk Domain";

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

    // Prepare attachments for nodemailer
    const nodemailerAttachments = await Promise.all(
      attachments.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return {
          filename: file.name,
          content: buffer,
          contentType: file.type,
        };
      }),
    );

    // Send email
    await transporter.sendMail({
      from: `"${companyName}" <${process.env.SMTP_MAIL}>`,
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f7f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7f9;">
              <tr>
                <td align="center" style="padding: 20px 10px;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td align="center" style="padding: 40px 20px 30px 20px;">
                        ${companyInfo?.logo ? `<img src="${companyInfo.logo}" alt="${companyName}" style="display: block; max-height: 80px; width: auto; margin-bottom: 20px;">` : ""}
                        <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">${companyName}</h1>
                      </td>
                    </tr>

                    <!-- Content Body -->
                    <tr>
                      <td style="padding: 0 30px;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #f3f4f6;">
                          <tr>
                            <td style="padding: 30px;">
                              <h2 style="margin-top: 0; margin-bottom: 20px; color: #2563eb; font-size: 20px; font-weight: 600;">${subject}</h2>
                              <div style="color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer / Contact Info -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #e5e7eb; padding-top: 30px;">
                          <tr>
                            <td style="color: #4b5563; font-size: 14px; line-height: 24px;">
                              <strong style="color: #111827; font-size: 15px; display: block; margin-bottom: 4px;">${companyName}</strong>
                              ${companyInfo?.Address ? `<p style="margin: 0; color: #6b7280;">${companyInfo.Address}<br>${companyInfo.city}, ${companyInfo.province} ${companyInfo.postCode}</p>` : ""}
                              
                              <div style="margin-top: 20px;">
                                ${companyInfo?.phone ? `<div style="margin-bottom: 4px;"><strong>T:</strong> <span style="color: #6b7280;">${companyInfo.phone}</span></div>` : ""}
                                ${companyInfo?.email ? `<div style="margin-bottom: 4px;"><strong>E:</strong> <a href="mailto:${companyInfo.email}" style="color: #2563eb; text-decoration: none;">${companyInfo.email}</a></div>` : ""}
                                ${companyInfo?.website ? `<div style="margin-bottom: 4px;"><strong>W:</strong> <a href="${companyInfo.website}" style="color: #2563eb; text-decoration: none;">${companyInfo.website.replace(/^https?:\/\//, "")}</a></div>` : ""}
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-top: 30px; border-top: 1px solid #f3f4f6; margin-top: 20px;">
                              <p style="margin: 0; font-size: 12px; color: #9ca3af; font-style: italic; text-align: center;">
                                This email was sent via the HR management system.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      attachments: nodemailerAttachments,
    });

    // Log the email sending as a notification
    await db.notification.create({
      data: {
        title: "Personal Email Sent",
        message: `Email "${subject}" was sent to ${to}`,
        type: "EMPLOYEE",
        isRead: false,
        userId: creator.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Email sent successfully to ${to}`,
    });
  } catch (error) {
    console.error("Personal email sending error:", error);
    return NextResponse.json(
      { error: "Failed to send email. Please try again later." },
      { status: 500 },
    );
  }
}
