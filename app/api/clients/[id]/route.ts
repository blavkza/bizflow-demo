import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    const client = await db.client.findUnique({
      where: {
        id,
      },
      include: {
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            clientId: true,
            totalAmount: true,
            status: true,
            issueDate: true,
            dueDate: true,
            payments: {
              select: {
                id: true,
                amount: true,
                method: true,
                paidAt: true,
              },
            },
          },
          where: {
            status: {
              not: "CANCELLED",
            },
          },
        },
        documents: true,
        projects: true,
        quotations: true,
        transactions: true,
        toolRentals: true,
        recurringInvoices: true,
        Note: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientWithNumbers = {
      ...client,
      creditLimit: client.creditLimit?.toNumber() || null,
      invoices: client.invoices.map((invoice) => ({
        ...invoice,
        totalAmount: invoice.totalAmount.toNumber(),
        payments: invoice.payments.map((payment) => ({
          ...payment,
          amount: payment.amount.toNumber(),
        })),
      })),
      transactions: client.transactions.map((transaction) => ({
        ...transaction,
        amount: transaction.amount.toNumber(),
      })),
    };

    return NextResponse.json(clientWithNumbers);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const body = await req.json();
    const {
      name,
      email,
      phone,
      phone2,
      type,
      status,
      // Personal Address
      address,
      country,
      province,
      town,
      village,
      street,
      // Company Information
      companyFullName,
      tradingName,
      registrationNumber,
      vatNumber,
      taxNumber,
      telNo1,
      telNo2,
      website,
      // Company Address
      companyCountry,
      companyProvince,
      companytown,
      companyvillage,
      companystreet,
      companyaddress,
      additionalInfo,
      // Financial Information
      creditLimit,
      paymentTerms,
      currency,
      // Additional Information
      assignedTo,
      source,
      notes,
    } = body;

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updater = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!updater) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedClient = await db.client.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        phone2,
        type,
        status,
        address,
        country,
        province,
        town,
        village,
        street,
        companyFullName,
        tradingName,
        registrationNumber,
        vatNumber,
        taxNumber,
        telNo1,
        telNo2,
        website,
        companyCountry,
        companyProvince,
        companytown,
        companyvillage,
        companystreet,
        companyaddress,
        additionalInfo,
        creditLimit: creditLimit ? parseFloat(creditLimit) : null,
        paymentTerms,
        currency,
        assignedTo,
        source,
        notes,
      },
    });

    await db.notification.create({
      data: {
        title: "Client Updated",
        message: `Client ${updatedClient.name} , client number : ${updatedClient.clientNumber} has been updated By ${updater.name}.`,
        type: "CLIENT",
        isRead: false,
        actionUrl: `/dashboard/human-resources/clients/${updatedClient.id}`,
        userId: updater.id,
      },
    });

    return NextResponse.json({ updatedClient });
  } catch (error) {
    console.error("Error updating Client:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleter = await db.user.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!deleter) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await db.client.findUnique({
      where: { id },
      select: {
        name: true,
        clientNumber: true,
      },
    });

    await db.client.delete({
      where: { id },
    });

    await db.notification.create({
      data: {
        title: "Client Deleted",
        message: `Client ${client?.name} , client number : ${client?.clientNumber} has been deleted By ${deleter.name}.`,
        type: "CLIENT",
        isRead: false,
        actionUrl: `/dashboard/human-resources/clients`,
        userId: deleter.id,
      },
    });

    return NextResponse.json({ message: "Client deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting Client:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
