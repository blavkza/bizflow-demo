import Header from "./_components/Header";
import InvoiceHeader from "./_components/Invoice-Hesder";
import NoteTermsCard from "./_components/NoteTerms-Card";
import InvoiceItems from "./_components/Invoice-Items";
import InvoiceSummury from "./_components/Invoice-Summury";
import db from "@/lib/db";

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = await params.id;

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      items: true,
      creator: {
        select: {
          GeneralSetting: true,
          name: true,
        },
      },
    },
  });

  if (!invoice) {
    return <div>Invoice not found</div>;
  }

  // Convert Decimal values to numbers
  const serializableInvoice = {
    ...invoice,
    amount: invoice.amount?.toNumber() || 0,
    subtotal: invoice.totalAmount?.toNumber() || 0,
    tax: invoice.taxAmount?.toNumber() || 0,
    taxRate: invoice.taxRate || 0,
    items: invoice.items.map((item) => ({
      ...item,
      quantity: item.quantity?.toNumber() || 0,
      unitPrice: item.unitPrice?.toNumber() || 0,
      amount: item.amount?.toNumber() || 0,
      taxAmount: item.taxAmount?.toNumber() || 0,
    })),
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <Header invoice={serializableInvoice} />

      {/* Invoice Content */}
      <div className="grid gap-6">
        {/* Invoice Header */}
        <InvoiceHeader invoice={serializableInvoice} />

        {/* Invoice Items */}
        <InvoiceItems invoice={serializableInvoice} />

        {/* Notes and Terms */}
        <NoteTermsCard
          notes={serializableInvoice.notes}
          terms={serializableInvoice.paymentTerms}
        />

        {/* Invoice Summary */}
        <InvoiceSummury invoice={serializableInvoice} />
      </div>
    </div>
  );
}
