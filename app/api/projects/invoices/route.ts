import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const creater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!creater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, invoiceId } = body;

    if (!projectId || !invoiceId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        items: true,
      },
    });

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    if (invoice.clientId !== project.clientId) {
      return new NextResponse("Invoice does not belong to the project client", {
        status: 400,
      });
    }

    const serviceItem = invoice.items.find((item) => item.serviceId);

    const projectInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        projectId,
      },
      include: {
        Project: true,
      },
    });

    if (serviceItem && serviceItem.serviceId) {
      await db.project.update({
        where: { id: projectId },
        data: {
          serviceId: serviceItem.serviceId,
        },
      });
    }

    await db.notification.create({
      data: {
        title: `New Invoice Added To Project ${project.title}`,
        message: `Invoice ${invoice.invoiceNumber}, has been added to project: ${project.title} By ${creater.name}.`,
        type: "PROJECT",
        isRead: false,
        actionUrl: `/dashboard/projects/${project.id}`,
        userId: creater.id,
      },
    });

    return NextResponse.json(projectInvoice);
  } catch (error) {
    console.error("[PROJECT_INVOICE_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
