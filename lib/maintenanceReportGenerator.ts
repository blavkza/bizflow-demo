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

export class MaintenanceReportGenerator {
  static generateReportHTML(
    maintenance: any,
    companyInfo?: CompanyInfo | null,
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

    const fullAddress = [
      companyAddress,
      companyCity,
      companyProvince,
      companyPostCode,
    ]
      .filter((part) => part && part.trim() !== "")
      .join(", ");

    const visits = maintenance.visits || [];
    const completedVisits = visits.filter(
      (v: any) => v.status === "COMPLETED",
    ).length;

    // Financials
    const calculateRecurringTotal = (items: any) => {
      if (!Array.isArray(items)) return 0;
      return items.reduce((sum, item) => {
        const q = Number(item.quantity) || 0;
        const p = Number(item.unitPrice) || 0;
        return sum + q * p;
      }, 0);
    };

    const recurringAmount = maintenance.recurringInvoice
      ? calculateRecurringTotal(maintenance.recurringInvoice.items)
      : 0;

    const billingArrangement = maintenance.invoice
      ? "Single Invoice"
      : maintenance.recurringInvoice
        ? "Recurring Schedule"
        : "None";

    const baseAmount = maintenance.invoice
      ? Number(maintenance.invoice.totalAmount)
      : recurringAmount;

    const currency =
      maintenance.invoice?.currency ||
      maintenance.recurringInvoice?.currency ||
      "ZAR";

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Maintenance Report - ${maintenance.id.slice(-8).toUpperCase()}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              color: #333;
              background: #fff;
              font-size: 14px;
            }
            .header { 
              text-align: center;
              margin-bottom: 30px; 
              border-bottom: 3px solid #2563eb; 
              padding-bottom: 15px; 
            }
            .logo {
              max-width: 150px;
              max-height: 100px;
              object-fit: contain;
              margin-bottom: 10px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 5px;
            }
            .company-details {
              font-size: 12px;
              color: #666;
              margin-bottom: 2px;
            }
            .document-title {
              font-size: 20px;
              font-weight: bold;
              margin: 20px 0 10px 0;
              text-transform: uppercase;
            }
            .section { 
              margin-bottom: 20px; 
              padding: 15px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              background: #f9fafb;
            }
            .section-title { 
              font-weight: bold; 
              border-bottom: 2px solid #2563eb; 
              padding-bottom: 5px; 
              margin-bottom: 15px;
              color: #2563eb;
              text-transform: uppercase;
              font-size: 13px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: 600;
              color: #4b5563;
              display: block;
              font-size: 11px;
              text-transform: uppercase;
            }
            .info-value {
              font-size: 14px;
              font-weight: 500;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
            }
            th, td { 
              border: 1px solid #e5e7eb; 
              padding: 10px; 
              text-align: left; 
            }
            th { 
              background-color: #f3f4f6; 
              font-weight: 600;
              font-size: 12px;
            }
            .badge {
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-completed { background: #d1fae5; color: #065f46; }
            .status-cancelled { background: #fee2e2; color: #991b1b; }
            
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 11px;
              color: #9ca3af;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${logo ? `<img src="${logo}" class="logo" />` : ""}
            <div class="company-name">${companyName}</div>
            <div class="company-details">${fullAddress}</div>
            <div class="company-details">Tel: ${companyPhone} | Email: ${companyEmail}</div>
            <div class="document-title">Maintenance Record Report</div>
            <div><strong>Record ID:</strong> ${maintenance.id.slice(-8).toUpperCase()}</div>
            <div><strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="section">
            <div class="section-title">General Information</div>
            <div class="grid">
              <div>
                <div class="info-item">
                  <span class="info-label">Client</span>
                  <div class="info-value">${maintenance.client.name}</div>
                  <div class="info-value" style="font-size: 12px; color: #666;">${maintenance.client.company || ""}</div>
                </div>
                <div class="info-item">
                  <span class="info-label">Location</span>
                  <div class="info-value">${maintenance.location}</div>
                </div>
                <div class="info-item">
                  <span class="info-label">Task Type</span>
                  <div class="info-value">${maintenance.type} ${maintenance.type === "ROUTINE" ? `(${maintenance.frequency})` : ""}</div>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">Status</span>
                  <div class="info-value">
                    <span class="badge status-${maintenance.status.toLowerCase()}">${maintenance.status}</span>
                  </div>
                </div>
                <div class="info-item">
                  <span class="info-label">Start Date</span>
                  <div class="info-value">${new Date(maintenance.date).toLocaleDateString()}</div>
                </div>
                <div class="info-item">
                  <span class="info-label">Progress</span>
                  <div class="info-value">${completedVisits} of ${visits.length} visits completed</div>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Task Scope</div>
            <div class="info-value" style="white-space: pre-wrap;">${maintenance.task || "No task scope defined."}</div>
          </div>

          <div class="section">
            <div class="section-title">Financial Details</div>
            <div class="grid">
              <div>
                <div class="info-item">
                  <span class="info-label">Billing Arrangement</span>
                  <div class="info-value">${billingArrangement}</div>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">Base Amount</span>
                  <div class="info-value">${currency} ${baseAmount.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Visit History</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Task/Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${visits
                  .map(
                    (v: any) => `
                  <tr>
                    <td>${new Date(v.date).toLocaleDateString()}</td>
                    <td>${v.location}</td>
                    <td>${v.task || "Regular maintenance"}</td>
                    <td>
                      <span class="badge status-${v.status.toLowerCase()}">${v.status}</span>
                    </td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="footer">
            Generated by ${companyName} Maintenance System<br>
            Thank you for choosing our services.
          </div>
          
          <div class="no-print" style="position: fixed; bottom: 20px; right: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              Print This Report
            </button>
          </div>
        </body>
      </html>
    `;
  }
}
