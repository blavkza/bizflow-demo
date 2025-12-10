import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { UserPermission, UserRole } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

// Define permission sets for different roles
const ROLE_PERMISSIONS: Record<string, UserPermission[]> = {
  CHIEF_EXECUTIVE_OFFICER: [
    "INVOICES_CREATE",
    "INVOICES_EDIT",
    "INVOICES_DELETE",
    "INVOICES_VIEW",
    "QUOTATIONS_CREATE",
    "QUOTATIONS_EDIT",
    "QUOTATIONS_DELETE",
    "QUOTATIONS_VIEW",
    "Expanses_CREATE",
    "Expanses_EDIT",
    "Expanses_DELETE",
    "Expanses_VIEW",
    "USERS_CREATE",
    "USERS_EDIT",
    "USERS_DELETE",
    "USERS_VIEW",
    "EMPLOYEES_CREATE",
    "EMPLOYEES_EDIT",
    "EMPLOYEES_DELETE",
    "EMPLOYEES_VIEW",
    "Freelancer_CREATE",
    "Freelancer_EDIT",
    "Freelancer_DELETE",
    "Freelancer_VIEW",
    "DEPARTMENT_CREATE",
    "DEPARTMENT_EDIT",
    "DEPARTMENT_DELETE",
    "DEPARTMENT_VIEW",
    "SETTINGS_MANAGE",
    "SETTINGS_VIEW",
    "TRANSACTIONS_MANAGE",
    "TRANSACTIONS_VIEW",
    "PAYROLL_MANAGE",
    "PAYROLL_VIEW",
    "CATEGORY_MANAGE",
    "CATEGORY_VIEW",
    "INVENTORY_MANAGE",
    "INVENTORY_VIEW",
    "SYSTEMS_AI",
    "SYSTEMS_DASHBOARD",
    "SYSTEMS_NOTIFICATIONS",
    "DASHBOARD_FINANCES",
    "DASHBOARD_PROJECTS",
    "DASHBOARD_TASKs",
    "DASHBOARD_WORKS",
    "PROJECTS_CREATE",
    "PROJECTS_DELETE",
    "PROJECTS_VIEW",
    "Clients_CREATE",
    "Clients_EDIT",
    "Clients_DELETE",
    "Clients_VIEW",
    "Attendence_VIEW",
    "Attendence_CREATE",
    "Attendence_EDIT",
    "Attendence_DELETE",
    "Perfomance_VIEW",
    "Perfomance_CREATE",
    "Perfomance_EDIT",
    "Perfomance_DELETE",
    "POS_VIEW",
    "Order_VIEW",
    "Order_CREATE",
    "Order_EDIT",
    "Order_DELETE",
    "Sale_VIEW",
    "Sale_CREATE",
    "Sale_EDIT",
    "Sale_DELETE",
    "Product_VIEW",
    "Product_CREATE",
    "Product_EDIT",
    "Product_DELETE",
    "Tool_VIEW",
    "Tool_CREATE",
    "Tool_EDIT",
    "Tool_DELETE",
    "ToolRental_VIEW",
    "ToolRental_CREATE",
    "ToolRental_EDIT",
    "ToolRental_DELETE",
    "Refund_VIEW",
    "Refund_CREATE",
    "Refund_EDIT",
    "Refund_DELETE",
    "Vender_VIEW",
    "Vender_CREATE",
    "Vender_EDIT",
    "Vender_DELETE",
    "Leave_VIEW",
    "Leave_CREATE",
    "Leave_EDIT",
    "Leave_DELETE",
    "Service_VIEW",
    "Service_CREATE",
    "Service_EDIT",
    "Service_DELETE",
  ],
  ADMIN_MANAGER: [
    "INVOICES_VIEW",
    "INVOICES_CREATE",
    "INVOICES_EDIT",
    "QUOTATIONS_VIEW",
    "QUOTATIONS_CREATE",
    "QUOTATIONS_EDIT",
    "Expanses_VIEW",
    "Expanses_CREATE",
    "Expanses_EDIT",
    "USERS_VIEW",
    "USERS_CREATE",
    "USERS_EDIT",
    "EMPLOYEES_VIEW",
    "EMPLOYEES_CREATE",
    "EMPLOYEES_EDIT",
    "Freelancer_VIEW",
    "Freelancer_CREATE",
    "Freelancer_EDIT",
    "DEPARTMENT_VIEW",
    "DEPARTMENT_CREATE",
    "DEPARTMENT_EDIT",
    "SETTINGS_VIEW",
    "TRANSACTIONS_VIEW",
    "TRANSACTIONS_MANAGE",
    "PAYROLL_VIEW",
    "PAYROLL_MANAGE",
    "CATEGORY_VIEW",
    "CATEGORY_MANAGE",
    "INVENTORY_VIEW",
    "INVENTORY_MANAGE",
    "SYSTEMS_DASHBOARD",
    "SYSTEMS_NOTIFICATIONS",
    "DASHBOARD_FINANCES",
    "DASHBOARD_PROJECTS",
    "DASHBOARD_TASKs",
    "DASHBOARD_WORKS",
    "PROJECTS_VIEW",
    "PROJECTS_CREATE",
    "PROJECTS_DELETE",
    "Clients_VIEW",
    "Clients_CREATE",
    "Clients_EDIT",
    "Attendence_VIEW",
    "Attendence_CREATE",
    "Attendence_EDIT",
    "Perfomance_VIEW",
    "Perfomance_CREATE",
    "Perfomance_EDIT",
    "POS_VIEW",
    "Order_VIEW",
    "Order_CREATE",
    "Order_EDIT",
    "Sale_VIEW",
    "Sale_CREATE",
    "Sale_EDIT",
    "Product_VIEW",
    "Product_CREATE",
    "Product_EDIT",
    "Tool_VIEW",
    "Tool_CREATE",
    "Tool_EDIT",
    "ToolRental_VIEW",
    "ToolRental_CREATE",
    "ToolRental_EDIT",
    "Refund_VIEW",
    "Refund_CREATE",
    "Refund_EDIT",
    "Vender_VIEW",
    "Vender_CREATE",
    "Vender_EDIT",
    "Leave_VIEW",
    "Leave_CREATE",
    "Leave_EDIT",
    "Service_VIEW",
    "Service_CREATE",
    "Service_EDIT",
  ],
  GENERAL_MANAGER: [
    "INVOICES_VIEW",
    "INVOICES_CREATE",
    "QUOTATIONS_VIEW",
    "QUOTATIONS_CREATE",
    "Expanses_VIEW",
    "Expanses_CREATE",
    "EMPLOYEES_VIEW",
    "EMPLOYEES_CREATE",
    "EMPLOYEES_EDIT",
    "Freelancer_VIEW",
    "Freelancer_CREATE",
    "Freelancer_EDIT",
    "DEPARTMENT_VIEW",
    "DEPARTMENT_CREATE",
    "DEPARTMENT_EDIT",
    "TRANSACTIONS_VIEW",
    "PAYROLL_VIEW",
    "CATEGORY_VIEW",
    "INVENTORY_VIEW",
    "DASHBOARD_FINANCES",
    "DASHBOARD_PROJECTS",
    "DASHBOARD_TASKs",
    "PROJECTS_VIEW",
    "PROJECTS_CREATE",
    "PROJECTS_DELETE",
    "Clients_VIEW",
    "Clients_CREATE",
    "Attendence_VIEW",
    "Attendence_CREATE",
    "Attendence_EDIT",
    "Perfomance_VIEW",
    "Perfomance_CREATE",
    "Perfomance_EDIT",
    "Order_VIEW",
    "Order_CREATE",
    "Sale_VIEW",
    "Sale_CREATE",
    "Product_VIEW",
    "Tool_VIEW",
    "ToolRental_VIEW",
    "ToolRental_CREATE",
    "Vender_VIEW",
    "Vender_CREATE",
    "Leave_VIEW",
    "Leave_CREATE",
    "Leave_EDIT",
    "Service_VIEW",
    "Service_CREATE",
  ],
  MANAGER: [
    "INVOICES_VIEW",
    "QUOTATIONS_VIEW",
    "Expanses_VIEW",
    "Expanses_CREATE",
    "EMPLOYEES_VIEW",
    "Freelancer_VIEW",
    "DEPARTMENT_VIEW",
    "TRANSACTIONS_VIEW",
    "PROJECTS_VIEW",
    "PROJECTS_CREATE",
    "Clients_VIEW",
    "Attendence_VIEW",
    "Attendence_CREATE",
    "Attendence_EDIT",
    "Perfomance_VIEW",
    "Perfomance_CREATE",
    "Order_VIEW",
    "Sale_VIEW",
    "Product_VIEW",
    "Tool_VIEW",
    "ToolRental_VIEW",
    "Vender_VIEW",
    "Leave_VIEW",
    "Leave_CREATE",
    "Leave_EDIT",
    "Service_VIEW",
  ],
  VIEWER: [
    "INVOICES_VIEW",
    "QUOTATIONS_VIEW",
    "Expanses_VIEW",
    "EMPLOYEES_VIEW",
    "Freelancer_VIEW",
    "DEPARTMENT_VIEW",
    "TRANSACTIONS_VIEW",
    "PROJECTS_VIEW",
    "Clients_VIEW",
    "Attendence_VIEW",
    "Perfomance_VIEW",
    "Order_VIEW",
    "Sale_VIEW",
    "Product_VIEW",
    "Tool_VIEW",
    "ToolRental_VIEW",
    "Vender_VIEW",
    "Leave_VIEW",
    "Service_VIEW",
  ],
  EMPLOYEE: ["Attendence_VIEW", "Leave_VIEW", "Leave_CREATE"],
};

const hasPermissionToView = (
  userPermissions: string[],
  type: string
): boolean => {
  const typePermissionMap: Record<string, UserPermission> = {
    quotation: "QUOTATIONS_VIEW",
    invoice: "INVOICES_VIEW",
    project: "PROJECTS_VIEW",
    client: "Clients_VIEW",
    department: "DEPARTMENT_VIEW",
    employee: "EMPLOYEES_VIEW",
    freelancer: "Freelancer_VIEW",
    transaction: "TRANSACTIONS_VIEW",
    leave: "Leave_VIEW",
    tool: "Tool_VIEW",
    vendor: "Vender_VIEW",
    expense: "Expanses_VIEW",
    recurring_invoice: "INVOICES_VIEW",
    task: "DASHBOARD_TASKs",
    service: "Service_VIEW",
    product: "Product_VIEW",
    sale: "Sale_VIEW",
    order: "Order_VIEW",
    refund: "Refund_VIEW",
  };

  const requiredPermission = typePermissionMap[type];
  return !requiredPermission || userPermissions.includes(requiredPermission);
};

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const user = await db.user.findUnique({
      where: { userId },
      select: { id: true, name: true, role: true },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userRole = user.role as UserRole;
    const userPermissions =
      ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.VIEWER;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const searchQuery = query.trim();

    // Store operations with their type to prevent index shifting
    const searchOperations: Array<{ type: string; promise: Promise<any[]> }> =
      [];

    if (hasPermissionToView(userPermissions, "quotation")) {
      searchOperations.push({
        type: "quotation",
        promise: db.quotation.findMany({
          where: {
            OR: [
              {
                quotationNumber: { contains: searchQuery, mode: "insensitive" },
              },
              { title: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: { client: { select: { name: true, company: true } } },
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "invoice")) {
      searchOperations.push({
        type: "invoice",
        promise: db.invoice.findMany({
          where: {
            OR: [
              { invoiceNumber: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: { client: { select: { name: true, company: true } } },
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "project")) {
      searchOperations.push({
        type: "project",
        promise: db.project.findMany({
          where: {
            OR: [
              { projectNumber: { contains: searchQuery, mode: "insensitive" } },
              { title: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: { client: { select: { name: true, company: true } } },
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "client")) {
      searchOperations.push({
        type: "client",
        promise: db.client.findMany({
          where: {
            OR: [
              { clientNumber: { contains: searchQuery, mode: "insensitive" } },
              { name: { contains: searchQuery, mode: "insensitive" } },
              { email: { contains: searchQuery, mode: "insensitive" } },
              { company: { contains: searchQuery, mode: "insensitive" } },
              { phone: { contains: searchQuery, mode: "insensitive" } },
              { phone2: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "department")) {
      searchOperations.push({
        type: "department",
        promise: db.department.findMany({
          where: {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { code: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
              { location: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "employee")) {
      searchOperations.push({
        type: "employee",
        promise: db.employee.findMany({
          where: {
            OR: [
              {
                employeeNumber: { contains: searchQuery, mode: "insensitive" },
              },
              { firstName: { contains: searchQuery, mode: "insensitive" } },
              { lastName: { contains: searchQuery, mode: "insensitive" } },
              { email: { contains: searchQuery, mode: "insensitive" } },
              { phone: { contains: searchQuery, mode: "insensitive" } },
              { position: { contains: searchQuery, mode: "insensitive" } },
              { idNumber: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: { department: { select: { name: true } } },
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "freelancer")) {
      searchOperations.push({
        type: "freelancer",
        promise: db.freeLancer.findMany({
          where: {
            OR: [
              {
                freeLancerNumber: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              },
              { firstName: { contains: searchQuery, mode: "insensitive" } },
              { lastName: { contains: searchQuery, mode: "insensitive" } },
              { email: { contains: searchQuery, mode: "insensitive" } },
              { phone: { contains: searchQuery, mode: "insensitive" } },
              { position: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: { department: { select: { name: true } } },
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "transaction")) {
      searchOperations.push({
        type: "transaction",
        promise: db.transaction.findMany({
          where: {
            OR: [
              { description: { contains: searchQuery, mode: "insensitive" } },
              { reference: { contains: searchQuery, mode: "insensitive" } },
              { invoiceNumber: { contains: searchQuery, mode: "insensitive" } },
              { vendor: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: {
            client: { select: { name: true } },
            invoice: { select: { invoiceNumber: true } },
          },
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "leave")) {
      searchOperations.push({
        type: "leave",
        promise: db.leaveRequest.findMany({
          where: {
            OR: [
              { reason: { contains: searchQuery, mode: "insensitive" } },
              { comments: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                employeeNumber: true,
              },
            },
          },
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "tool")) {
      searchOperations.push({
        type: "tool",
        promise: db.tool.findMany({
          where: {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
              { category: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "vendor")) {
      searchOperations.push({
        type: "vendor",
        promise: db.vendor.findMany({
          where: {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { email: { contains: searchQuery, mode: "insensitive" } },
              { phone: { contains: searchQuery, mode: "insensitive" } },
              { taxNumber: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "expense")) {
      searchOperations.push({
        type: "expense",
        promise: db.expense.findMany({
          where: {
            OR: [
              { expenseNumber: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
              { vendorEmail: { contains: searchQuery, mode: "insensitive" } },
              { vendorPhone: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: {
            Project: { select: { title: true } },
            vendor: { select: { name: true } },
          },
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "recurring_invoice")) {
      searchOperations.push({
        type: "recurring_invoice",
        promise: db.recurringInvoice.findMany({
          where: {
            OR: [
              { description: { contains: searchQuery, mode: "insensitive" } },
              { notes: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: { client: { select: { name: true } } },
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "task")) {
      searchOperations.push({
        type: "task",
        promise: db.task.findMany({
          where: {
            OR: [
              { title: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
              { taskNumber: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: {
            project: { select: { title: true, projectNumber: true } },
          },
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "service")) {
      searchOperations.push({
        type: "service",
        promise: db.service.findMany({
          where: {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
              { category: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "product")) {
      searchOperations.push({
        type: "product",
        promise: db.shopProduct.findMany({
          where: {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
              { sku: { contains: searchQuery, mode: "insensitive" } },
              { brand: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "sale")) {
      searchOperations.push({
        type: "sale",
        promise: db.sale.findMany({
          where: {
            OR: [
              { saleNumber: { contains: searchQuery, mode: "insensitive" } },
              { customerName: { contains: searchQuery, mode: "insensitive" } },
              { customerPhone: { contains: searchQuery, mode: "insensitive" } },
              { customerEmail: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "order")) {
      searchOperations.push({
        type: "order",
        promise: db.order.findMany({
          where: {
            OR: [
              { orderNumber: { contains: searchQuery, mode: "insensitive" } },
              {
                trackingNumber: { contains: searchQuery, mode: "insensitive" },
              },
            ],
          },
          take: 5,
          include: {
            Customer: { select: { firstName: true, lastName: true } },
          },
        }),
      });
    }

    if (hasPermissionToView(userPermissions, "refund")) {
      searchOperations.push({
        type: "refund",
        promise: db.refund.findMany({
          where: {
            OR: [
              { refundNumber: { contains: searchQuery, mode: "insensitive" } },
              { reason: { contains: searchQuery, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: {
            sale: { select: { saleNumber: true } },
          },
        }),
      });
    }

    // Execute all search promises
    const searchResults = await Promise.allSettled(
      searchOperations.map((op) => op.promise)
    );

    // Process results
    const results: Array<{
      id: string;
      type: string;
      title: string;
      description?: string;
      href: string;
      metadata?: Record<string, any>;
    }> = [];

    // Process each search result type using the mapped operations
    searchResults.forEach((result, index) => {
      // Use the searchOperations array to get the correct type for this result index
      const operation = searchOperations[index];
      const type = operation.type;

      if (result.status === "fulfilled" && result.value) {
        const items = result.value;

        items.forEach((item: any) => {
          const baseResult = {
            id: item.id,
            type,
            href: getHrefForType(type, item),
          };

          switch (type) {
            case "quotation":
              results.push({
                ...baseResult,
                title: item.quotationNumber || "Untitled Quotation",
                description:
                  item.title ||
                  (item.client
                    ? `Quotation for ${item.client.name}`
                    : "Quotation"),
                metadata: { amount: item.amount, status: item.status },
              });
              break;

            case "invoice":
              results.push({
                ...baseResult,
                title: item.invoiceNumber || "Untitled Invoice",
                description:
                  item.description ||
                  (item.client ? `Invoice for ${item.client.name}` : "Invoice"),
                metadata: { amount: item.amount, status: item.status },
              });
              break;

            case "project":
              results.push({
                ...baseResult,
                title: item.title || "Untitled Project",
                description: item.projectNumber || `Project - ${item.status}`,
                metadata: {
                  status: item.status,
                  client: item.client?.name,
                  progress: item.progress,
                },
              });
              break;

            case "client":
              results.push({
                ...baseResult,
                title: item.name || "Unnamed Client",
                description:
                  item.company || item.email || item.phone || "Client",
                metadata: { status: item.status, type: item.type },
              });
              break;

            case "department":
              results.push({
                ...baseResult,
                title: item.name || "Unnamed Department",
                description: item.code || item.location || "Department",
                metadata: { status: item.status, currency: item.currency },
              });
              break;

            case "employee":
              results.push({
                ...baseResult,
                title:
                  `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
                  "Unnamed Employee",
                description: `${item.position || "Employee"}${item.department ? ` • ${item.department.name}` : ""}`,
                metadata: {
                  employeeNumber: item.employeeNumber,
                  department: item.department?.name,
                  status: item.status,
                },
              });
              break;

            case "freelancer":
              results.push({
                ...baseResult,
                title:
                  `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
                  "Unnamed Freelancer",
                description: `${item.position || "Freelancer"}${item.department ? ` • ${item.department.name}` : ""}`,
                metadata: {
                  freelancerNumber: item.freeLancerNumber,
                  department: item.department?.name,
                  status: item.status,
                },
              });
              break;

            case "transaction":
              results.push({
                ...baseResult,
                title:
                  item.reference || `Transaction ${item.id.substring(0, 8)}`,
                description: item.description || `${item.type} transaction`,
                metadata: {
                  amount: item.amount,
                  status: item.status,
                  date: item.date,
                },
              });
              break;

            case "leave":
              results.push({
                ...baseResult,
                title: `${item.employee?.firstName} ${item.employee?.lastName}'s Leave`,
                description: `${item.leaveType} • ${item.days} days • ${item.status}`,
                metadata: {
                  employeeNumber: item.employee?.employeeNumber,
                  status: item.status,
                  dates: `${item.startDate.toLocaleDateString()} - ${item.endDate.toLocaleDateString()}`,
                },
              });
              break;

            case "tool":
              results.push({
                ...baseResult,
                title: item.name || "Unnamed Tool",
                description: item.description || item.category || "Tool",
                metadata: {
                  status: item.status,
                  condition: item.condition,
                  rentalRate: item.rentalRateDaily,
                },
              });
              break;

            case "vendor":
              results.push({
                ...baseResult,
                title: item.name || "Unnamed Vendor",
                description: item.email || item.phone || "Vendor",
                metadata: { status: item.status },
              });
              break;

            case "expense":
              results.push({
                ...baseResult,
                title:
                  item.expenseNumber || `Expense ${item.id.substring(0, 8)}`,
                description:
                  item.description ||
                  (item.vendor ? `Expense for ${item.vendor.name}` : "Expense"),
                metadata: {
                  amount: item.totalAmount,
                  status: item.status,
                  project: item.project?.title,
                },
              });
              break;

            case "recurring_invoice":
              results.push({
                ...baseResult,
                title: `Recurring Invoice for ${item.client?.name}`,
                description: `${item.frequency} • Next: ${item.nextDate.toLocaleDateString()}`,
                metadata: {
                  frequency: item.frequency,
                  status: item.status,
                  nextDate: item.nextDate,
                },
              });
              break;

            case "task":
              results.push({
                ...baseResult,
                title: item.title || "Untitled Task",
                description: `${item.project?.title || "Task"} • ${item.status}`,
                metadata: {
                  taskNumber: item.taskNumber,
                  status: item.status,
                  project: item.project?.title,
                },
              });
              break;

            case "service":
              results.push({
                ...baseResult,
                title: item.name || "Unnamed Service",
                description: item.description || item.category || "Service",
                metadata: {
                  amount: item.amount,
                  status: item.status,
                  duration: item.duration,
                },
              });
              break;

            case "product":
              results.push({
                ...baseResult,
                title: item.name || "Unnamed Product",
                description: item.sku || item.category || "Product",
                metadata: {
                  price: item.price,
                  stock: item.stock,
                  status: item.status,
                },
              });
              break;

            case "sale":
              results.push({
                ...baseResult,
                title: item.saleNumber || `Sale ${item.id.substring(0, 8)}`,
                description: `${item.customerName || "Customer"} • ${item.total.toFixed(2)} ${item.paymentMethod}`,
                metadata: {
                  total: item.total,
                  status: item.status,
                  paymentMethod: item.paymentMethod,
                },
              });
              break;

            case "order":
              results.push({
                ...baseResult,
                title: item.orderNumber || `Order ${item.id.substring(0, 8)}`,
                description: `${item.customer?.firstName || "Customer"} • ${item.status}`,
                metadata: {
                  status: item.status,
                  deliveryDate: item.deliveryDate,
                  trackingNumber: item.trackingNumber,
                },
              });
              break;

            case "refund":
              results.push({
                ...baseResult,
                title: item.refundNumber || `Refund ${item.id.substring(0, 8)}`,
                description: `Refund for ${item.sale?.saleNumber || "sale"} • ${item.amount.toFixed(2)}`,
                metadata: {
                  amount: item.amount,
                  status: item.status,
                  method: item.method,
                },
              });
              break;
          }
        });
      }
    });

    // Sort results by relevance
    results.sort((a, b) => {
      // Simple relevance: exact matches in title first
      const aTitleMatch = a.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const bTitleMatch = b.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      return 0;
    });

    // Limit total results
    const limitedResults = results.slice(0, 50);

    return NextResponse.json({
      results: limitedResults,
      permissions: userPermissions,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error", results: [] },
      { status: 500 }
    );
  }
}

// Helper function to generate hrefs based on type
function getHrefForType(type: string, item: any): string {
  const basePaths: Record<string, string> = {
    quotation: "/dashboard/quotations",
    invoice: "/dashboard/invoices",
    project: "/dashboard/projects",
    client: "/dashboard/human-resources/clients",
    department: "/dashboard/human-resources/departments",
    employee: "/dashboard/human-resources/employees",
    freelancer: "/dashboard/human-resources/freelancers",
    transaction: "/dashboard/transactions",
    leave: "/dashboard/human-resources/leave-requests",
    tool: "/dashboard/tools",
    vendor: "/dashboard/vendors",
    expense: "/dashboard/expenses",
    recurring_invoice: "/dashboard/invoices/recurring",
    task: "/dashboard/projects",
    service: "/dashboard/services",
    product: "/dashboard/shop/products",
    sale: "/dashboard/shop/sales",
    order: "/dashboard/shop/orders",
    refund: "/dashboard/shop/refunds",
  };

  const basePath = basePaths[type] || "/dashboard";
  return `${basePath}/${item.id}`;
}
