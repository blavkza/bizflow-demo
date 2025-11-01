export interface EmailData {
  to: string;
  subject: string;
  html: string;
  saleNumber: string;
}

class EmailService {
  async sendReceipt(
    email: string,
    receiptHTML: string,
    saleNumber: string
  ): Promise<boolean> {
    try {
      const response = await fetch("/api/shop/sales/send-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject: `Receipt ${saleNumber} - Thank you for your purchase`,
          html: receiptHTML,
          saleNumber,
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
