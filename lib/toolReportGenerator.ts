import { Tool } from "@/types/tool";

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

export class ToolReportGenerator {
  static generateToolReportHTML(
    tool: Tool,
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

    // Calculate statistics
    const totalRentalRevenue = (tool.rentals || []).reduce((sum, rental) => {
      return sum + (Number(rental.totalCost) || 0);
    }, 0);

    const totalMaintenanceCost = (tool.maintenanceLogs || []).reduce(
      (sum, log) => {
        return sum + (Number(log.cost) || 0);
      },
      0
    );

    const purchasePrice = Number(tool.purchasePrice) || 0;
    const depreciation = purchasePrice * 0.15;
    const remainingValue = purchasePrice - depreciation;

    const canBeRented =
      tool.canBeRented !== false &&
      tool.rentalRateDaily !== null &&
      tool.rentalRateDaily !== undefined &&
      Number(tool.rentalRateDaily) > 0;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tool Report - ${tool.name}</title>
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
            .tool-info { 
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
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .stat-card {
              background: white;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #2c5aa0;
              margin-bottom: 5px;
            }
            .stat-label {
              font-size: 14px;
              color: #666;
            }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              margin-right: 8px;
              margin-bottom: 8px;
            }
            .status-available { background: #d1fae5; color: #065f46; }
            .status-rented { background: #dbeafe; color: #1e40af; }
            .status-maintenance { background: #fef3c7; color: #92400e; }
            .status-retired { background: #fee2e2; color: #991b1b; }
            .condition-excellent { background: #d1fae5; color: #065f46; }
            .condition-good { background: #dbeafe; color: #1e40af; }
            .condition-fair { background: #fef3c7; color: #92400e; }
            .condition-poor { background: #fee2e2; color: #991b1b; }
            .notes {
              margin-top: 20px;
              padding: 15px;
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 5px;
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
              <div class="document-type">TOOL REPORT</div>
              <div style="margin-top: 10px;">
                <div><strong>Tool:</strong> ${tool.name}</div>
                <div><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div class="info-grid">
            <div class="section">
              <div class="section-title">Tool Information</div>
              <div class="info-item">
                <span class="info-label">Name:</span> ${tool.name}
              </div>
              <div class="info-item">
                <span class="info-label">Category:</span> ${tool.category || "N/A"}
              </div>
              <div class="info-item">
                <span class="info-label">Status:</span> 
                <span class="badge status-${tool.status.toLowerCase()}">${tool.status}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Condition:</span> 
                <span class="badge condition-${tool.condition.toLowerCase()}">${tool.condition}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Rental Available:</span> ${canBeRented ? "Yes" : "No"}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Purchase Details</div>
              <div class="info-item">
                <span class="info-label">Purchase Price:</span> R${purchasePrice.toFixed(2)}
              </div>
              <div class="info-item">
                <span class="info-label">Purchase Date:</span> ${tool.purchaseDate ? new Date(tool.purchaseDate).toLocaleDateString() : "N/A"}
              </div>
              <div class="info-item">
                <span class="info-label">Current Value:</span> R${remainingValue.toFixed(2)}
              </div>
              <div class="info-item">
                <span class="info-label">Created By:</span> ${tool.createdBy}
              </div>
              <div class="info-item">
                <span class="info-label">Created Date:</span> ${new Date(tool.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          ${
            canBeRented
              ? `
          <div class="section">
            <div class="section-title">Rental Rates</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Daily Rate:</span> R${Number(tool.rentalRateDaily || 0).toFixed(2)}
              </div>
              <div class="info-item">
                <span class="info-label">Weekly Rate:</span> R${Number(tool.rentalRateWeekly || 0).toFixed(2)}
              </div>
              <div class="info-item">
                <span class="info-label">Monthly Rate:</span> R${Number(tool.rentalRateMonthly || 0).toFixed(2)}
              </div>
            </div>
          </div>
          `
              : ""
          }

          <div class="section">
            <div class="section-title">Usage Statistics</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${tool.rentals?.length || 0}</div>
                <div class="stat-label">Total Rentals</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${tool.InterUse?.length || 0}</div>
                <div class="stat-label">Internal Uses</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${tool.maintenanceLogs?.length || 0}</div>
                <div class="stat-label">Maintenance Records</div>
              </div>
              ${
                canBeRented
                  ? `
              <div class="stat-card">
                <div class="stat-value">R${totalRentalRevenue.toFixed(2)}</div>
                <div class="stat-label">Total Revenue</div>
              </div>
              `
                  : ""
              }
              <div class="stat-card">
                <div class="stat-value">R${totalMaintenanceCost.toFixed(2)}</div>
                <div class="stat-label">Maintenance Cost</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">R${remainingValue.toFixed(2)}</div>
                <div class="stat-label">Current Asset Value</div>
              </div>
            </div>
          </div>

          ${
            tool.InterUse && tool.InterUse.length > 0
              ? `
          <div class="section">
            <div class="section-title">Recent Internal Use (Last 5)</div>
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Damage</th>
                </tr>
              </thead>
              <tbody>
                ${tool.InterUse.slice(0, 5)
                  .map(
                    (interUse) => `
                  <tr>
                    <td>${interUse.project?.title || "N/A"}</td>
                    <td>${new Date(interUse.useStartDate).toLocaleDateString()}</td>
                    <td>${new Date(interUse.useEndDate).toLocaleDateString()}</td>
                    <td>${interUse.status}</td>
                    <td>${interUse.damageReported ? "Yes" : "No"}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          ${
            tool.rentals && tool.rentals.length > 0
              ? `
          <div class="section">
            <div class="section-title">Recent Rentals (Last 5)</div>
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${tool.rentals
                  .slice(0, 5)
                  .map(
                    (rental) => `
                  <tr>
                    <td>${rental.businessName}</td>
                    <td>${new Date(rental.rentalStartDate).toLocaleDateString()}</td>
                    <td>${new Date(rental.rentalEndDate).toLocaleDateString()}</td>
                    <td>${rental.status}</td>
                    <td>R${Number(rental.totalCost || 0).toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          ${
            tool.maintenanceLogs && tool.maintenanceLogs.length > 0
              ? `
          <div class="section">
            <div class="section-title">Recent Maintenance (Last 5)</div>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Cost</th>
                  <th>Assigned To</th>
                </tr>
              </thead>
              <tbody>
                ${tool.maintenanceLogs
                  .slice(0, 5)
                  .map(
                    (log) => `
                  <tr>
                    <td>${log.maintenanceType}</td>
                    <td>${new Date(log.maintenanceDate).toLocaleDateString()}</td>
                    <td>R${Number(log.cost || 0).toFixed(2)}</td>
                    <td>${log.assignedTo || "N/A"}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          `
              : ""
          }

          ${
            tool.description
              ? `
          <div class="section">
            <div class="section-title">Description</div>
            <div>${tool.description}</div>
          </div>
          `
              : ""
          }

          <div class="no-print" style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #ddd;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #2c5aa0; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
              Print Tool Report
            </button>
            <p style="margin-top: 10px; color: #666; font-size: 12px;">
              This report was generated on ${new Date().toLocaleDateString()}
            </p>
          </div>
        </body>
      </html>
    `;
  }
}
