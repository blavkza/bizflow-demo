import { ReceiptCompanyInfo, ReceiptData } from "./receipt-generator";

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
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch("/api/shop/sales/send-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject: `Order Receipt - ${saleNumber}`,
          html: receiptHTML,
          saleNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send email");
      }

      const result = await response.json();
      return { success: result.success };
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      };
    }
  }

  async sendOrderUpdate(
    email: string,
    orderNumber: string,
    status: string,
    trackingNumber?: string,
    carrier?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const subject = `Order Update - ${orderNumber}`;
      const html = this.generateOrderUpdateEmail(
        orderNumber,
        status,
        trackingNumber,
        carrier
      );

      const response = await fetch("/api/shop/sales/send-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject,
          html,
          saleNumber: orderNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send email");
      }

      const result = await response.json();
      return { success: result.success };
    } catch (error) {
      console.error("Error sending order update email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      };
    }
  }

  private generateOrderUpdateEmail(
    orderNumber: string,
    status: string,
    trackingNumber?: string,
    carrier?: string
  ): string {
    const statusMessage = this.getStatusMessage(status);

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #333; margin-bottom: 10px;">Order Update</h1>
          <p style="color: #666; font-size: 16px;">Your order status has been updated</p>
        </div>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-bottom: 10px;">Order #${orderNumber}</h2>
          <p style="margin: 5px 0;"><strong>Status:</strong> ${status}</p>
          ${trackingNumber ? `<p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ""}
          ${carrier ? `<p style="margin: 5px 0;"><strong>Carrier:</strong> ${carrier}</p>` : ""}
        </div>
        
        <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="color: #2e7d32; margin-bottom: 10px;">Update Details</h3>
          <p style="color: #333; line-height: 1.6;">${statusMessage}</p>
        </div>
        
        <div style="text-align: center; padding-top: 20px; border-top: 2px solid #333; color: #666;">
          <p>Thank you for your business!</p>
          <p>If you have any questions, please contact our customer service.</p>
        </div>
      </div>
    `;
  }

  private getStatusMessage(status: string): string {
    const messages: { [key: string]: string } = {
      PENDING: "Your order has been received and is being processed.",
      CONFIRMED:
        "Your order has been confirmed and is being prepared for shipment.",
      PROCESSING: "Your order is currently being processed in our warehouse.",
      SHIPPED: "Your order has been shipped and is on its way to you.",
      DELIVERED: "Your order has been delivered. Thank you for your purchase!",
      CANCELLED: "Your order has been cancelled as requested.",
    };

    return messages[status] || "Your order status has been updated.";
  }
}

export const emailService = new EmailService();
