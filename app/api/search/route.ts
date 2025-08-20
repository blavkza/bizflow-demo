import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    // Search across multiple models
    const [quotations, invoices, projects, clients, departments, employees] =
      await Promise.all([
        // Search quotations
        db.quotation.findMany({
          where: {
            OR: [
              { quotationNumber: { contains: query, mode: "insensitive" } },
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: { client: true },
        }),

        // Search invoices
        db.invoice.findMany({
          where: {
            OR: [
              { invoiceNumber: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: { client: true },
        }),

        // Search projects
        db.project.findMany({
          where: {
            OR: [
              { projectNumber: { contains: query, mode: "insensitive" } },
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: { client: true },
        }),

        // Search clients
        db.client.findMany({
          where: {
            OR: [
              { clientNumber: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { company: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 5,
        }),

        // Search departments
        db.department.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { code: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 5,
        }),

        // Search employees
        db.employee.findMany({
          where: {
            OR: [
              { employeeNumber: { contains: query, mode: "insensitive" } },
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { position: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: { department: true },
        }),
      ]);

    // Format results for consistent response
    const results = [
      ...quotations.map((q: any) => ({
        id: q.id,
        type: "quotation",
        title: q.quotationNumber,
        description: q.title || `Quotation for ${q.client.name}`,
        href: `/dashboard/quotations/${q.id}`,
        metadata: { amount: q.amount, status: q.status },
      })),

      ...invoices.map((i: any) => ({
        id: i.id,
        type: "invoice",
        title: i.invoiceNumber,
        description: i.description || `Invoice for ${i.client.name}`,
        href: `/dashboard/invoices/${i.id}`,
        metadata: { amount: i.amount, status: i.status },
      })),

      ...projects.map((p: any) => ({
        id: p.id,
        type: "project",
        title: p.title,
        description: p.projectNumber,
        href: `/dashboard/projects/${p.id}`,
        metadata: { status: p.status, client: p.client?.name },
      })),

      ...clients.map((c: any) => ({
        id: c.id,
        type: "client",
        title: c.name,
        description: c.company || c.email,
        href: `/dashboard/human-resources/clients/${c.id}`,
        metadata: { status: c.status },
      })),

      ...departments.map((d: any) => ({
        id: d.id,
        type: "department",
        title: d.name,
        description: d.code,
        href: `/dashboard/human-resources/departments/${d.id}`,
        metadata: { status: d.status },
      })),

      ...employees.map((e: any) => ({
        id: e.id,
        type: "employee",
        title: `${e.firstName} ${e.lastName}`,
        description: e.position,
        href: `/dashboard/human-resources/employees/${e.id}`,
        metadata: { department: e.department?.name, status: e.status },
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
