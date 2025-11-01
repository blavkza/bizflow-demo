import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, saleNumber } = await request.json();

    const companyInfo = await db.generalSetting.findFirst();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"${companyInfo?.companyName || "FinanceFlow POS"}" <${process.env.SMTP_MAIL}>`,
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px;
              color: #333;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              color: #333;
              margin-bottom: 10px;
            }
            .receipt-title {
              font-size: 20px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
            }
            .info-section {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${companyInfo?.companyName || "FinanceFlow Solutions"}</div>
            <div>${companyInfo?.Address || "456 Corporate Ave, Sandton, 2196, South Africa"}</div>
            <div>Tel: ${companyInfo?.phone || "+27 11 987 6543"} | Email: ${companyInfo?.email || "sales@financeflow.co.za"}</div>
            ${companyInfo?.taxId ? `<div>VAT Number: ${companyInfo.taxId}</div>` : ""}
          </div>
          <div class="receipt-title">SALES RECEIPT</div>
          <div class="info-section">
            <div><strong>Receipt Number:</strong> ${saleNumber}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleString()}</div>
          </div>
          ${html}
          <div style="margin-top: 40px; text-align: center; padding-top: 20px; border-top: 2px solid #333; color: #666;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Thank You for Your Business!</div>
            <div>For any queries, please contact us at ${companyInfo?.phone || "+27 11 987 6543"}</div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
