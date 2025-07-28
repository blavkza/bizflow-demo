import { NextResponse } from "next/server";
import db from "@/lib/db";
import { chatSession } from "@/configs/AiModel";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
  }

  try {
    const currentDate = new Date();

    // Fetch all relevant data
    const [
      clients,
      invoices,
      transactions,
      quotations,
      departments,
      employees,
      categories,
      products,
    ] = await Promise.all([
      db.client.findMany({
        include: {
          invoices: {
            include: {
              payments: true,
              items: true,
            },
          },
          quotations: {
            include: {
              items: true,
            },
          },
          projects: true,
          documents: true,
        },
      }),
      db.invoice.findMany({
        include: {
          client: true,
          payments: true,
          items: true,
          Project: true,
          Transaction: true,
        },
        orderBy: {
          dueDate: "asc",
        },
      }),
      db.transaction.findMany({
        include: {
          invoice: {
            include: { client: true, items: true, payments: true },
          },
          category: true,
          splits: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
      }),
      db.quotation.findMany({
        include: {
          client: true,
          items: true,
          project: true,
          Department: true,
        },
      }),
      db.department.findMany({
        include: {
          manager: true,
          parent: true,
          children: true,
          employees: true,
          budgets: true,
          expenses: true,
        },
      }),
      db.employee.findMany({
        include: {
          department: true,
          assignedTasks: true,
          payments: true,
          documents: true,
          targets: true,
          kpiResults: true,
        },
      }),
      db.category.findMany({
        include: {
          parent: true,
          children: true,
          transactions: true,
          budgets: true,
          splits: true,
        },
      }),
      db.product.findMany(),
    ]);

    // Calculate financial metrics using TransactionType
    const payments = transactions.flatMap((t) => t.invoice?.payments ?? []);

    // Calculate income from INCOME transactions
    const incomeTransactions = transactions.filter((t) => t.type === "INCOME");
    const totalIncome = incomeTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    // Calculate expenses from EXPENSE transactions
    const expenseTransactions = transactions.filter(
      (t) => t.type === "EXPENSE"
    );
    const totalExpenses = expenseTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    // Calculate net revenue (income - expenses)
    const totalRevenue = totalIncome - totalExpenses;

    const overdueInvoices = invoices.filter(
      (inv) =>
        inv.status === "OVERDUE" ||
        (inv.dueDate < currentDate && inv.status !== "PAID")
    );

    const totalOverdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.amount)),
      0
    );

    const recentPayments = payments.filter((p) => {
      const paymentDate = new Date(p.paidAt ?? "");
      const diffDays = Math.ceil(
        Math.abs(currentDate.getTime() - paymentDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return diffDays <= 30;
    });

    // Prepare comprehensive context data
    let contextData = `
    SYSTEM DATA OVERVIEW (as of ${currentDate.toLocaleDateString()}):

    === FINANCIAL SUMMARY ===
    - Total Income: R${totalIncome.toFixed(2)} (from ${incomeTransactions.length} income transactions)
    - Total Expenses: R${totalExpenses.toFixed(2)} (from ${expenseTransactions.length} expense transactions)
    - Net Revenue: R${totalRevenue.toFixed(2)}
    - Overdue Amount: R${totalOverdueAmount.toFixed(2)}
    - Recent Payments (30 days): R${recentPayments.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)}

    === CLIENTS (${clients.length}) ===
    ${clients.map((c) => `- ${c.name} (${c.status}): ${c.invoices.length} invoices, ${c.quotations.length} quotations`).join("\n")}

    === INVOICES (${invoices.length}) ===
    Status Summary:
    - DRAFT: ${invoices.filter((i) => i.status === "DRAFT").length}
    - SENT: ${invoices.filter((i) => i.status === "SENT").length}
    - PAID: ${invoices.filter((i) => i.status === "PAID").length}
    - OVERDUE: ${overdueInvoices.length}

    === QUOTATIONS (${quotations.length}) ===
    Status Summary:
    - DRAFT: ${quotations.filter((q) => q.status === "DRAFT").length}
    - SENT: ${quotations.filter((q) => q.status === "SENT").length}
    - ACCEPTED: ${quotations.filter((q) => q.status === "ACCEPTED").length}

    === DEPARTMENTS (${departments.length}) ===
    ${departments.map((d) => `- ${d.name} (${d.status}): ${d.employees.length} employees`).join("\n")}

    === EMPLOYEES (${employees.length}) ===
    Status Summary:
    - ACTIVE: ${employees.filter((e) => e.status === "ACTIVE").length}
    - INACTIVE: ${employees.filter((e) => e.status === "INACTIVE").length}
    - ON LEAVE: ${employees.filter((e) => e.status === "ON_LEAVE").length}
    `;

    // Add more specific context based on the prompt
    if (/client/i.test(prompt)) {
      contextData += `\n\nCLIENT DETAILS:\n${clients
        .map(
          (c) => `
      Client: ${c.name} (${c.clientNumber})
      Status: ${c.status}
      Type: ${c.type}
      Contact: ${c.email} | ${c.phone}
      Invoices: ${c.invoices.length} (${c.invoices.filter((i) => i.status === "PAID").length} paid)
      Quotations: ${c.quotations.length}
      Credit Limit: R${c.creditLimit?.toFixed(2) || "0.00"}
      `
        )
        .join("\n")}`;
    }

    if (/department/i.test(prompt)) {
      contextData += `\n\nDEPARTMENT DETAILS:\n${departments
        .map(
          (d) => `
      Department: ${d.name} (${d.code})
      Manager: ${d.manager?.name || "None"} 
      Status: ${d.status}
      Employees: ${d.employees.length}
      Location: ${d.building || "N/A"} ${d.floor || ""} ${d.location || ""}
      `
        )
        .join("\n")}`;
    }

    if (/employee/i.test(prompt)) {
      contextData += `\n\nEMPLOYEE DETAILS:\n${employees
        .map(
          (e) => `
      Employee: ${e.firstName} ${e.lastName} (${e.employeeNumber})
      Position: ${e.position}
      Department: ${e.department?.name || "None"}
      Status: ${e.status}
      Salary: R${e.salary.toFixed(2)} ${e.currency}
      Hire Date: ${e.hireDate.toLocaleDateString()}
      `
        )
        .join("\n")}`;
    }

    if (/financial|revenue|payment/i.test(prompt)) {
      contextData += `\n\nFINANCIAL DETAILS:\n`;

      // Add invoice payment details
      contextData += `INVOICE PAYMENTS:\n${payments
        .slice(0, 20)
        .map(
          (p) => `
      - ${p.id}: R${p.amount} via ${p.method} on ${new Date(p.paidAt || "").toLocaleDateString()}
      `
        )
        .join("")}`;

      // Add transaction details
      contextData += `\nRECENT TRANSACTIONS:\n${transactions
        .slice(0, 20)
        .map(
          (t) => `
      - ${t.id}: R${t.amount} (${t.type}) for ${t.description || "No description"} on ${new Date(t.date).toLocaleDateString()}
      `
        )
        .join("")}`;
    }

    const fullPrompt = `User Query: ${prompt}\n\nSystem Context:\n${contextData}\n\nPlease provide a detailed response based on the above information.`;

    const result = await chatSession.sendMessage(fullPrompt);
    const AiResponse = await result.response.text();

    return NextResponse.json({
      result: AiResponse,
      context: {
        clientCount: clients.length,
        invoiceCount: invoices.length,
        departmentCount: departments.length,
        financialSummary: {
          netRevenue: totalRevenue,
          totalIncome,
          totalExpenses,
          incomeTransactionCount: incomeTransactions.length,
          expenseTransactionCount: expenseTransactions.length,
          totalOverdueAmount,
          recentPaymentsTotal: recentPayments.reduce(
            (sum, p) => sum + Number(p.amount),
            0
          ),
        },
      },
    });
  } catch (error) {
    console.error("[AI_API_ERROR]", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
