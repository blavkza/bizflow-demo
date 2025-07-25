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
      className="absolute top-[-10000px] left-[-10000px] bg-white px-6 py-3 w-[800px] shadow-lg rounded-md"
      style={{
        visibility: "hidden",
        fontFamily: "'Inter', sans-serif",
        color: primaryColor,
        fontSize: "12px",
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
        {/* Header - Compact */}
        <div className="flex justify-between items-start mb-2">
          <div>
            {invoice.creator.GeneralSetting[0]?.logo && (
              <img
                src={invoice.creator.GeneralSetting[0].logo}
                alt="Company Logo"
                className="h-24 mb-2 object-contain"
                onError={(e) =>
                  ((e.target as HTMLImageElement).style.display = "none")
                }
              />
            )}
            <div className="text-xs text-gray-600">
              <p className="text-lg uppercase font-bold mb-1 text-gray-700">
                {invoice.creator.GeneralSetting[0]?.companyName}
              </p>
              <p>{invoice.creator.GeneralSetting[0]?.Address}</p>
              <p>
                {invoice.creator.GeneralSetting[0]?.city},{" "}
                {invoice.creator.GeneralSetting[0]?.province}{" "}
                {invoice.creator.GeneralSetting[0]?.postCode}
              </p>
              <p>{invoice.creator.GeneralSetting[0]?.email}</p>
              <p>
                {[
                  invoice.creator.GeneralSetting[0]?.phone,
                  invoice.creator.GeneralSetting[0]?.phone2,
                  invoice.creator.GeneralSetting[0]?.phone3,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {invoice.creator.GeneralSetting[0]?.taxId && (
                <p>VAT Number: {invoice.creator.GeneralSetting[0]?.taxId}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold" style={{ color: accentColor }}>
              INVOICE
            </h1>
            <div className="mt-2 bg-gray-100 p-2 rounded-md text-xs text-gray-700">
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

        {/* Bill To + Status - Compact */}
        <div className="flex justify-between mb-4 gap-3">
          <div className="bg-gray-50 p-2 rounded-md w-1/2">
            <h3 className="text-xs font-semibold mb-1 text-gray-700">
              INVOICE FOR
            </h3>
            {invoice.client.company && (
              <p className="font-medium">{invoice.client.company}</p>
            )}
            <p className="font-medium">{invoice.client.name}</p>
            <p className="text-xs text-gray-600">{invoice.client.email}</p>
            <p className="text-xs text-gray-600">{invoice.client.phone}</p>
            {invoice.client.taxNumber && (
              <p className="text-xs text-gray-600">
                VAT Number: {invoice.client.taxNumber}
              </p>
            )}
            {invoice.client.address && (
              <p className="text-xs text-gray-600">{invoice.client.address}</p>
            )}
          </div>
          <div className="bg-gray-50 p-2 rounded-md w-1/2 text-right">
            <h3 className="text-xs font-semibold mb-1 text-gray-700">STATUS</h3>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                invoice.status === "PAID"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {invoice.status}
            </span>
            {invoice.status === "PAID" && (
              <p className="text-xs mt-0.5 text-gray-600">
                Paid on {new Date(invoice.issueDate).toLocaleDateString()}
              </p>
            )}
            <div className="mt-4 text-xs border-t pt-2 border-gray-200">
              <div>
                <h4 className="font-semibold mb-0.5 text-gray-700">
                  Payment Terms
                </h4>
                {invoice.paymentTerms && (
                  <p className="text-gray-600 mb-1">{invoice.paymentTerms}</p>
                )}
                <div>
                  {invoice.creator.GeneralSetting[0]?.bankName && (
                    <strong>
                      {invoice.creator.GeneralSetting[0]?.bankName}
                    </strong>
                  )}
                  {invoice.creator.GeneralSetting[0]?.bankAccount && (
                    <p className="text-xs">
                      {invoice.creator.GeneralSetting[0]?.bankAccount || "N/A"}
                    </p>
                  )}
                </div>
                <div>
                  {invoice.creator.GeneralSetting[0]?.bankName2 && (
                    <strong>
                      {invoice.creator.GeneralSetting[0]?.bankName2}
                    </strong>
                  )}
                  {invoice.creator.GeneralSetting[0]?.bankAccount2 && (
                    <p className="text-xs">
                      {invoice.creator.GeneralSetting[0]?.bankAccount2 || "N/A"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table - Compact */}
        <table className="w-full text-xs mb-4 border border-gray-200 rounded-md overflow-hidden">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="text-left p-1">Description</th>
              <th className="text-center p-1">Qty</th>
              <th className="text-right p-1">Unit Price</th>
              <th className="text-right p-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="p-1 border-t border-gray-200">
                  {item.description}
                </td>
                <td className="p-1 text-center border-t border-gray-200">
                  {item.quantity}
                </td>
                <td className="p-1 text-right border-t border-gray-200">
                  R{Number(item.unitPrice).toFixed(2)}
                </td>
                <td className="p-1 text-right border-t border-gray-200">
                  R{(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals - Compact */}
        <div className="flex justify-end">
          <div className="w-1/3 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Subtotal:</span>
              <span>R{subtotal.toFixed(2)}</span>
            </div>

            {taxAmount > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span>Tax ({((taxAmount / subtotal) * 100).toFixed(2)}%):</span>
                <span>R{taxAmount.toFixed(2)}</span>
              </div>
            )}

            {discount > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span>Discount:</span>
                <span>R{discount}</span>
              </div>
            )}
            <div className="flex justify-between py-1 font-semibold text-sm">
              <span>Total Due:</span>
              <span style={{ color: accentColor }}>R{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer - Compact */}
        <div className="mt-4 text-center text-xs text-gray-400">
          <p>{invoice.creator.GeneralSetting[0]?.website}</p>
          <p>Thank you for your business!</p>
          {invoice.note && (
            <p className="mt-0.5 text-xs">
              <p>{invoice.note}</p>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
