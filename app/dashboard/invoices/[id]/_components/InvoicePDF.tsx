import { InvoiceProps } from "@/types/invoice";

interface InvoicePDFProps {
  invoice: InvoiceProps;
  forwardedRef: React.RefObject<HTMLDivElement>;
}

export function InvoicePDF({ invoice, forwardedRef }: InvoicePDFProps) {
  const primaryColor = "#1F2937"; // Gray-800
  const secondaryColor = "#F3F4F6"; // Gray-100
  const accentColor = "#10B981"; // Emerald-500

  const subtotal = invoice.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0
  );
  const taxAmount = Number(invoice.taxAmount) || 0;
  const discount = Number(invoice.discountAmount);
  const total = subtotal + taxAmount - discount;

  return (
    <div
      ref={forwardedRef}
      className="absolute top-[-10000px] left-[-10000px] bg-white px-8 py-4 w-[800px] shadow-lg rounded-md"
      style={{
        visibility: "hidden",
        fontFamily: "'Inter', sans-serif",
        color: primaryColor,
      }}
      aria-hidden="true"
    >
      {/* Watermark Logo Background */}
      {invoice.creator.GeneralSetting[0]?.logo && (
        <div
          className="absolute inset-0 opacity-5 z-0"
          style={{
            backgroundImage: `url(${invoice.creator.GeneralSetting[0].logo})`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "100%",
            filter: "grayscale(100%)",
            transform: "rotate(-10deg)",
            pointerEvents: "none",
          }}
        />
      )}

      <div className="relative z-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            {invoice.creator.GeneralSetting[0]?.logo && (
              <img
                src={invoice.creator.GeneralSetting[0].logo}
                alt="Company Logo"
                className="h-40 mb-4 object-contain"
                onError={(e) =>
                  ((e.target as HTMLImageElement).style.display = "none")
                }
              />
            )}
            <div className="text-sm text-gray-600">
              <p className="text-xl uppercase font-bold mb-2 text-gray-700">
                {invoice.creator.GeneralSetting[0]?.companyName}
              </p>
              <p>{invoice.creator.GeneralSetting[0]?.Address}</p>
              <p>
                {invoice.creator.GeneralSetting[0]?.city},{" "}
                {invoice.creator.GeneralSetting[0]?.province}{" "}
                {invoice.creator.GeneralSetting[0]?.postCode}
              </p>
              <p>
                {invoice.creator.GeneralSetting[0]?.email} |{" "}
                {invoice.creator.GeneralSetting[0]?.phone}
              </p>
              {invoice.creator.GeneralSetting[0]?.taxId && (
                <p className="text-sm text-gray-600">
                  {" "}
                  Tax Number: {invoice.creator.GeneralSetting[0]?.taxId}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-4xl font-bold" style={{ color: accentColor }}>
              INVOICE
            </h1>
            <div className="mt-4 bg-gray-100 p-4 rounded-md text-sm text-gray-700">
              <p className="font-semibold">#{invoice.invoiceNumber}</p>
              <p>
                <strong>Issued:</strong>{" "}
                {new Date(invoice.issueDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Due:</strong>{" "}
                {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Bill To + Status */}
        <div className="flex justify-between mb-8 gap-4">
          <div className="bg-gray-50 p-4 rounded-md w-1/2">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              BILL TO
            </h3>
            {invoice.client.company && (
              <p className="font-medium">{invoice.client.company}</p>
            )}
            <p className="font-medium">{invoice.client.name}</p>
            <p className="text-sm text-gray-600">{invoice.client.email}</p>
            <p className="text-sm text-gray-600">{invoice.client.phone}</p>
            {invoice.client.taxNumber && (
              <p className="text-sm text-gray-600">
                {" "}
                Tax Number: {invoice.client.taxNumber}
              </p>
            )}

            {invoice.client.address && (
              <p className="text-sm text-gray-600">{invoice.client.address}</p>
            )}
          </div>
          <div className="bg-gray-50 p-4 rounded-md w-1/2 text-right">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">STATUS</h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                invoice.status === "PAID"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {invoice.status}
            </span>
            {invoice.status === "PAID" && (
              <p className="text-xs mt-1 text-gray-600">
                Paid on {new Date(invoice.issueDate).toLocaleDateString()}
              </p>
            )}
            <div className="mt-12 text-sm border-t pt-4 border-gray-200">
              <div>
                <h4 className="font-semibold mb-1 text-gray-700">
                  Payment Terms
                </h4>

                {invoice.paymentTerms && (
                  <div className="mb-4">
                    <p className="text-gray-600">{invoice.paymentTerms}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-8 border border-gray-200 rounded-md overflow-hidden">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="text-left p-3">Description</th>
              <th className="text-center p-3">Qty</th>
              <th className="text-right p-3">Unit Price</th>
              <th className="text-right p-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="p-3 border-t border-gray-200">
                  {item.description}
                </td>
                <td className="p-3 text-center border-t border-gray-200">
                  {item.quantity}
                </td>
                <td className="p-3 text-right border-t border-gray-200">
                  R{Number(item.unitPrice).toFixed(2)}
                </td>
                <td className="p-3 text-right border-t border-gray-200">
                  R{(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-1/3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Subtotal:</span>
              <span>R{subtotal.toFixed(2)}</span>
            </div>

            {taxAmount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span>Tax ({((taxAmount / subtotal) * 100).toFixed(2)}%):</span>
                <span>R{taxAmount.toFixed(2)}</span>
              </div>
            )}

            {discount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span>Discount:</span>
                <span>R{discount}</span>
              </div>
            )}
            <div className="flex justify-between py-2 font-semibold text-lg">
              <span>Total Due:</span>
              <span style={{ color: accentColor }}>R{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes + Payment Info */}

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <p>{invoice.creator.GeneralSetting[0]?.website}</p>
          <p>Thank you for your business!</p>
          {invoice.note && (
            <p className="mt-1">
              <p>{invoice.note}</p>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
