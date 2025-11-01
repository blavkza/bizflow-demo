import { OrderData } from "@/types/order";

interface CompanyInfo {
  id: string;
  companyName: string;
  taxId: string;
  address: string;
  city: string;
  website: string;
  paymentTerms: string;
  note: string;
  bankAccount: string;
  bankAccount2: string;
  bankName: string;
  bankName2: string;
  logo: string;
  province: string;
  postCode: string;
  phone: string;
  phone2: string;
  phone3: string;
  email: string;
}

export class DeliveryNoteGenerator {
  static generateDeliveryNoteHTML(
    order: OrderData,
    companyInfo?: CompanyInfo | null
  ): string {
    const companyName = companyInfo?.companyName || "YOUR COMPANY NAME";
    const companyAddress = companyInfo?.address || "";
    const companyCity = companyInfo?.city || "";
    const companyProvince = companyInfo?.province || "";
    const companyPostCode = companyInfo?.postCode || "";
    const companyPhone = companyInfo?.phone || "";
    const companyEmail = companyInfo?.email || "";
    const taxNumber = companyInfo?.taxId || "";
    const logo = companyInfo?.logo || "";

    // Build full address
    const fullAddress = [
      companyAddress,
      companyCity,
      companyProvince,
      companyPostCode,
    ]
      .filter((part) => part && part.trim() !== "")
      .join(", ");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Note - ${order.orderNumber}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              color: #333;
              background: #fff;
            }
            .header { 
              text-align: center;
              margin-bottom: 30px; 
              border-bottom: 3px solid #2c5aa0; 
              padding-bottom: 15px; 
            }
            .logo-container {
              margin-bottom: 15px;
            }
            .logo {
              max-width: 150px;
              max-height: 100px;
              object-fit: contain;
            }
            .company-info {
              text-align: center;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #2c5aa0;
              margin-bottom: 8px;
            }
            .company-details {
              font-size: 14px;
              color: #666;
              line-height: 1.4;
              margin-bottom: 4px;
            }
            .document-type {
              font-size: 20px;
              font-weight: bold;
              margin: 15px 0 10px 0;
              color: #333;
            }
            .order-info { 
              margin-bottom: 25px; 
            }
            .section { 
              margin-bottom: 25px; 
              padding: 15px;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              background: #fafafa;
            }
            .section-title { 
              font-weight: bold; 
              border-bottom: 2px solid #2c5aa0; 
              padding-bottom: 8px; 
              margin-bottom: 12px;
              color: #2c5aa0;
              font-size: 16px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px; 
              background: white;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
            }
            th { 
              background-color: #2c5aa0; 
              color: white;
              font-weight: 600;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .totals { 
              float: right; 
              width: 300px; 
              margin-top: 20px;
            }
            .totals table {
              background: #f8f9fa;
              border: 2px solid #2c5aa0;
            }
            .totals td {
              font-weight: 500;
            }
            .totals .final-total {
              font-weight: bold;
              font-size: 18px;
              color: #2c5aa0;
            }
            .signature { 
              margin-top: 60px; 
              border-top: 2px solid #333; 
              padding-top: 20px; 
              clear: both;
            }
            .signature-section {
              width: 45%;
              display: inline-block;
              vertical-align: top;
            }
            .signature-line {
              border-bottom: 1px solid #333; 
              height: 40px; 
              margin-top: 50px;
              margin-bottom: 10px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .info-item {
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: 600;
              color: #555;
            }
            .notes {
              margin-top: 20px;
              padding: 15px;
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 5px;
            }
            .order-number-date {
              display: block;
              justify-content: space-between;
              max-width: 400px;
              margin: 10px auto 0;
            }
            @media print { 
              body { 
                margin: 0; 
                padding: 15px;
              } 
              .no-print { 
                display: none; 
              }
              .section {
                break-inside: avoid;
              }
              table {
                break-inside: avoid;
              }
            }
            @page {
              margin: 0.5in;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              ${
                logo
                  ? `
                <div class="logo-container">
                  <img src="${logo}" alt="${companyName}" class="logo" onerror="this.style.display='none'" />
                </div>
              `
                  : ""
              }
              <div class="company-name">${companyName}</div>
              ${fullAddress ? `<div class="company-details">${fullAddress}</div>` : ""}
              ${companyPhone ? `<div class="company-details">Tel: ${companyPhone}</div>` : ""}
              ${companyEmail ? `<div class="company-details">Email: ${companyEmail}</div>` : ""}
              ${taxNumber ? `<div class="company-details">Tax Number: ${taxNumber}</div>` : ""}
              <div class="document-type">DELIVERY CONFIMATION</div>
              <div class="order-number-date">
                <div><strong>Order Number:</strong> ${order.orderNumber}</div>
                <div><strong>Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div class="info-grid">
            <div class="section">
              <div class="section-title">Customer Information</div>
              <div class="info-item">
                <span class="info-label">Name:</span> ${order.customerName}
              </div>
              <div class="info-item">
                <span class="info-label">Phone:</span> ${order.customerPhone || "N/A"}
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span> ${order.customerEmail || "N/A"}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Delivery Information</div>
              <div class="info-item">
                <span class="info-label">Status:</span> ${order.status}
              </div>
              ${
                order.carrier
                  ? `
                <div class="info-item">
                  <span class="info-label">Carrier:</span> ${order.carrier}
                </div>
              `
                  : ""
              }
              ${
                order.deliveryDate
                  ? `
                <div class="info-item">
                  <span class="info-label">Delivery Date:</span> ${new Date(order.deliveryDate).toLocaleDateString()}
                </div>
              `
                  : ""
              }
              ${
                order.assignedEmployee
                  ? `
                <div class="info-item">
                  <span class="info-label">Assigned To:</span> ${order.assignedEmployee.name}
                </div>
              `
                  : ""
              }
            </div>
          </div>

          <div class="section">
            <div class="section-title">Shipping Address</div>
            <div style="line-height: 1.6;">
              <div><strong>Address:</strong> ${order.shippingAddress}</div>
              <div><strong>City:</strong> ${order.shippingCity}</div>
              <div><strong>Province:</strong> ${order.shippingProvince}</div>
              <div><strong>Postal Code:</strong> ${order.shippingPostal}</div>
              <div><strong>Country:</strong> ${order.shippingCountry}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Order Items</div>
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.product.name}</td>
                    <td>${item.product.sku}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">R${item.price.toFixed(2)}</td>
                    <td style="text-align: right;">R${item.total.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="totals">
            <table>
              <tr>
                <td><strong>Subtotal:</strong></td>
                <td style="text-align: right;">R${order.subtotal.toFixed(2)}</td>
              </tr>
              ${
                order.discount > 0
                  ? `
                <tr>
                  <td><strong>Discount:</strong></td>
                  <td style="text-align: right;">-R${order.discount.toFixed(2)}</td>
                </tr>
              `
                  : ""
              }
              <tr>
                <td class="final-total">Total:</td>
                <td class="final-total" style="text-align: right;">R${order.total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div style="clear: both;"></div>

          ${
            order.notes
              ? `
            <div class="notes">
              <div class="section-title">Order Notes</div>
              <p>${order.notes}</p>
            </div>
          `
              : ""
          }

          <div class="signature">
            <div style="display: flex; justify-content: space-between;">
              <div class="signature-section">
                <p><strong>Customer Signature</strong></p>
                <p>I hereby acknowledge receipt of the above items in good condition</p>
                <div class="signature-line"></div>
                <p>Name: ___________________</p>
                <p>Date: ___________________</p>
                <p>Time: ___________________</p>
              </div>
              
              <div class="signature-section">
                <p><strong>Driver Signature</strong></p>
                <p>I confirm delivery was completed successfully</p>
                <div class="signature-line"></div>
                <p>Name: ___________________</p>
                <p>Date: ___________________</p>
                <p>Time: ___________________</p>
              </div>
            </div>
          </div>

          <div class="no-print" style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #ddd;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #2c5aa0; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
             Print Delivery Note
            </button>
            <p style="margin-top: 10px; color: #666; font-size: 12px;">
              This delivery note was generated on ${new Date().toLocaleDateString()}
            </p>
          </div>
        </body>
      </html>
    `;
  }

  static generateDeliveryNoteText(
    order: OrderData,
    companyInfo?: CompanyInfo | null
  ): string {
    const companyName = companyInfo?.companyName || "YOUR COMPANY NAME";
    const companyAddress = companyInfo?.address || "";
    const companyCity = companyInfo?.city || "";
    const companyProvince = companyInfo?.province || "";
    const companyPostCode = companyInfo?.postCode || "";
    const companyPhone = companyInfo?.phone || "";
    const companyEmail = companyInfo?.email || "";
    const taxNumber = companyInfo?.taxId || "";

    // Build full address
    const fullAddress = [
      companyAddress,
      companyCity,
      companyProvince,
      companyPostCode,
    ]
      .filter((part) => part && part.trim() !== "")
      .join(", ");

    let text = `${companyName}\n`;
    if (fullAddress) text += `${fullAddress}\n`;
    if (companyPhone) text += `Tel: ${companyPhone}\n`;
    if (companyEmail) text += `Email: ${companyEmail}\n`;
    if (taxNumber) text += `Tax Number: ${taxNumber}\n`;

    text += `\nDELIVERY NOTE - Order #${order.orderNumber}\n`;
    text += `Date: ${new Date(order.orderDate).toLocaleDateString()}\n\n`;

    text += `CUSTOMER INFORMATION:\n`;
    text += `Name: ${order.customerName}\n`;
    text += `Phone: ${order.customerPhone || "N/A"}\n`;
    text += `Email: ${order.customerEmail || "N/A"}\n\n`;

    text += `SHIPPING ADDRESS:\n`;
    text += `${order.shippingAddress}\n`;
    text += `${order.shippingCity}, ${order.shippingProvince}\n`;
    text += `${order.shippingPostal}, ${order.shippingCountry}\n\n`;

    text += `ORDER ITEMS:\n`;
    order.items.forEach((item) => {
      text += `${item.quantity}x ${item.product.name} (${item.product.sku}) - R${item.total.toFixed(2)}\n`;
    });

    text += `\nTOTALS:\n`;
    text += `Subtotal: R${order.subtotal.toFixed(2)}\n`;
    if (order.discount > 0) {
      text += `Discount: -R${order.discount.toFixed(2)}\n`;
    }
    text += `Total: R${order.total.toFixed(2)}\n`;

    return text;
  }
}
