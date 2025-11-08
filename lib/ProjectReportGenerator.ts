import { Project } from "@/app/dashboard/projects/[id]/type";

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

export class ProjectReportGenerator {
  static generateProjectReportHTML(
    project: Project,
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

    // Calculate project statistics
    const totalTasks = project.tasks?.length || 0;
    const completedTasks =
      project.tasks?.filter((task) => task.status === "COMPLETED").length || 0;
    const inProgressTasks =
      project.tasks?.filter((task) => task.status === "IN_PROGRESS").length ||
      0;
    const todoTasks =
      project.tasks?.filter((task) => task.status === "TODO").length || 0;

    const progressPercentage =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate financials
    const totalBudget = project.budget || 0;
    const totalInvoiced =
      project.invoices?.reduce(
        (sum, invoice) => sum + Number(invoice.totalAmount || 0),
        0
      ) || 0;
    const totalExpenses =
      project.invoices?.reduce((sum, invoice) => {
        const invoiceExpenses =
          invoice.Expense?.reduce((expenseSum, expense) => {
            return expenseSum + Number(expense.totalAmount || 0);
          }, 0) || 0;
        return sum + invoiceExpenses;
      }, 0) || 0;

    const budgetUtilization =
      totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;
    const remainingBudget = totalBudget - totalExpenses;
    const isOverBudget = remainingBudget < 0;

    // Calculate timeline
    const startDate = project.startDate ? new Date(project.startDate) : null;
    const endDate = project.endDate ? new Date(project.endDate) : null;
    const deadline = project.deadline ? new Date(project.deadline) : null;
    const today = new Date();

    const daysRemaining = endDate
      ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const daysUntilDeadline = deadline
      ? Math.ceil(
          (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Project Report - ${project.title}</title>
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
            .project-title {
              font-size: 28px;
              font-weight: bold;
              color: #2c5aa0;
              margin: 10px 0;
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
              grid-template-columns: repeat(4, 1fr);
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
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .stat-label {
              font-size: 14px;
              color: #666;
            }
            .progress-bar {
              width: 100%;
              height: 20px;
              background-color: #e0e0e0;
              border-radius: 10px;
              margin: 10px 0;
              overflow: hidden;
            }
            .progress-fill {
              height: 100%;
              background-color: #2c5aa0;
              border-radius: 10px;
              transition: width 0.3s ease;
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
            .status-active { background: #d1fae5; color: #065f46; }
            .status-completed { background: #dbeafe; color: #1e40af; }
            .status-on-hold { background: #fef3c7; color: #92400e; }
            .status-cancelled { background: #fee2e2; color: #991b1b; }
            .priority-high { background: #fee2e2; color: #991b1b; }
            .priority-medium { background: #fef3c7; color: #92400e; }
            .priority-low { background: #d1fae5; color: #065f46; }
            .financial-positive { color: #065f46; }
            .financial-negative { color: #dc2626; }
            .financial-neutral { color: #1e40af; }
            .timeline-urgent { color: #dc2626; font-weight: bold; }
            .timeline-warning { color: #d97706; }
            .timeline-normal { color: #059669; }
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
              <div class="document-type">PROJECT REPORT</div>
              <div class="project-title">${project.title}</div>
              <div style="margin-top: 10px;">
                <div><strong>Project:</strong> ${project.projectNumber}</div>
                <div><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Project Overview</div>
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="info-label">Description:</span> ${project.description || "No description"}
                </div>
                <div class="info-item">
                  <span class="info-label">Status:</span> 
                  <span class="badge status-${project.status.toLowerCase()}">${project.status}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Priority:</span> 
                  <span class="badge priority-${project.priority.toLowerCase()}">${project.priority}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Client:</span> ${project.client?.name || "No client assigned"}
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">Project Manager:</span> ${project.manager?.name || "Unassigned"}
                </div>
                <div class="info-item">
                  <span class="info-label">Start Date:</span> ${startDate ? startDate.toLocaleDateString() : "Not set"}
                </div>
                <div class="info-item">
                  <span class="info-label">End Date:</span> 
                  <span class="${
                    daysRemaining !== null
                      ? daysRemaining < 0
                        ? "timeline-urgent"
                        : daysRemaining <= 7
                          ? "timeline-warning"
                          : "timeline-normal"
                      : ""
                  }">
                    ${endDate ? endDate.toLocaleDateString() : "Not set"}
                    ${
                      daysRemaining !== null
                        ? daysRemaining < 0
                          ? ` (${Math.abs(daysRemaining)} days overdue)`
                          : daysRemaining <= 7
                            ? ` (${daysRemaining} days remaining)`
                            : ""
                        : ""
                    }
                  </span>
                </div>
                ${
                  deadline
                    ? `<div class="info-item">
                         <span class="info-label">Deadline:</span> 
                         <span class="${
                           daysUntilDeadline !== null
                             ? daysUntilDeadline < 0
                               ? "timeline-urgent"
                               : daysUntilDeadline <= 3
                                 ? "timeline-warning"
                                 : "timeline-normal"
                             : ""
                         }">
                           ${deadline.toLocaleDateString()}
                           ${
                             daysUntilDeadline !== null
                               ? daysUntilDeadline < 0
                                 ? ` (${Math.abs(daysUntilDeadline)} days overdue)`
                                 : daysUntilDeadline <= 3
                                   ? ` (${daysUntilDeadline} days remaining)`
                                   : ""
                               : ""
                           }
                         </span>
                       </div>`
                    : ""
                }
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Project Progress</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value financial-neutral">${totalTasks}</div>
                <div class="stat-label">Total Tasks</div>
              </div>
              <div class="stat-card">
                <div class="stat-value financial-positive">${completedTasks}</div>
                <div class="stat-label">Completed</div>
              </div>
              <div class="stat-card">
                <div class="stat-value financial-neutral">${inProgressTasks}</div>
                <div class="stat-label">In Progress</div>
              </div>
              <div class="stat-card">
                <div class="stat-value financial-neutral">${todoTasks}</div>
                <div class="stat-label">To Do</div>
              </div>
            </div>
            
            <div style="margin-top: 20px;">
              <div style="display: flex; justify-content: between; margin-bottom: 5px;">
                <span>Overall Progress</span>
                <span><strong>${progressPercentage.toFixed(1)}% Complete</strong></span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercentage}%"></div>
              </div>
              <div style="display: flex; justify-content: between; font-size: 12px; color: #666;">
                <span>${completedTasks} Completed</span>
                <span>${totalTasks - completedTasks} Remaining</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Financial Summary</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value financial-neutral">R${totalBudget.toLocaleString()}</div>
                <div class="stat-label">Total Budget</div>
              </div>
              <div class="stat-card">
                <div class="stat-value financial-negative">R${totalExpenses.toLocaleString()}</div>
                <div class="stat-label">Total Expenses</div>
              </div>
              <div class="stat-card">
                <div class="stat-value financial-positive">R${totalInvoiced.toLocaleString()}</div>
                <div class="stat-label">Total Invoiced</div>
              </div>
              <div class="stat-card">
                <div class="stat-value ${isOverBudget ? "financial-negative" : "financial-positive"}">
                  ${isOverBudget ? "-" : ""}R${Math.abs(remainingBudget).toLocaleString()}
                </div>
                <div class="stat-label">${isOverBudget ? "Over Budget" : "Remaining Budget"}</div>
              </div>
            </div>
            
            <div style="margin-top: 20px;">
              <div style="display: flex; justify-content: between; margin-bottom: 5px;">
                <span>Budget Utilization</span>
                <span><strong>${budgetUtilization.toFixed(1)}% Used</strong></span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(budgetUtilization, 100)}%"></div>
              </div>
              <div style="display: flex; justify-content: between; font-size: 12px; color: #666;">
                <span>R${totalExpenses.toLocaleString()} Spent</span>
                <span>${isOverBudget ? "-" : ""}R${Math.abs(remainingBudget).toLocaleString()} ${isOverBudget ? "Over" : "Remaining"}</span>
              </div>
            </div>
          </div>

          ${
            project.tasks && project.tasks.length > 0
              ? `
          <div class="section">
            <div class="section-title">Task Summary</div>
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                  <th>Progress</th>
                </tr>
              </thead>
           <tbody>
  ${project.tasks
    .slice(0, 10)
    .map((task) => {
      const assignee = task.assignees?.[0]
        ? `${task.assignees[0].firstName} ${task.assignees[0].lastName || ""}`
        : "Unassigned";

      const progress =
        task.status === "COMPLETED"
          ? 100
          : task.status === "IN_PROGRESS"
            ? 50
            : 0;

      const dueDate = task.dueDate
        ? new Date(task.dueDate).toLocaleDateString()
        : "Not set";

      return `
        <tr>
          <td>${task.title}</td>
          <td>
            <span class="badge status-${task.status.toLowerCase()}">
              ${task.status}
            </span>
          </td>
          <td>
            <span class="badge priority-${task.priority.toLowerCase()}">
              ${task.priority}
            </span>
          </td>
          <td>${assignee}</td>
          <td>${dueDate}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="flex: 1; height: 8px; background: #e0e0e0; border-radius: 4px;">
                <div style="height: 100%; width: ${progress}%; background: #2c5aa0; border-radius: 4px;"></div>
              </div>
              <span style="font-size: 12px;">${progress}%</span>
            </div>
          </td>
        </tr>
      `;
    })
    .join("")}
</tbody>

            </table>
            ${
              project.tasks.length > 10
                ? `
              <div style="text-align: center; margin-top: 10px; color: #666;">
                ... and ${project.tasks.length - 10} more tasks
              </div>
            `
                : ""
            }
          </div>
          `
              : ""
          }

          ${
            project.invoices && project.invoices.length > 0
              ? `
          <div class="section">
            <div class="section-title">Invoice Summary</div>
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                ${project.invoices
                  .slice(0, 5)
                  .map(
                    (invoice) => `
                  <tr>
                    <td>${invoice.invoiceNumber}</td>
                    <td>R${Number(invoice.totalAmount || 0).toLocaleString()}</td>
                    <td>
                      <span class="badge status-${invoice.status.toLowerCase()}">
                        ${invoice.status}
                      </span>
                    </td>
                    <td>${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : "N/A"}</td>
                    <td>${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            ${
              project.invoices.length > 5
                ? `
              <div style="text-align: center; margin-top: 10px; color: #666;">
                ... and ${project.invoices.length - 5} more invoices
              </div>
            `
                : ""
            }
          </div>
          `
              : ""
          }

          <div class="no-print" style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #ddd;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #2c5aa0; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
              Print Project Report
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
