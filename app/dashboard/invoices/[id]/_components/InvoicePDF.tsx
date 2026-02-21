import { InvoiceProps } from "@/types/invoice";

interface InvoicePDFProps {
  invoice: InvoiceProps;
  forwardedRef: React.RefObject<HTMLDivElement>;
}

export function InvoicePDF({ invoice, forwardedRef }: InvoicePDFProps) {
  const primaryColor = "#1F2937"; // Gray-800
  const secondaryColor = "#F3F4F6"; // Gray-100
  const accentColor = "#10B981"; // Emerald-500

  function toNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    return Number(value);
  }

  const subtotalGross = invoice.items.reduce(
    (sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice),
    0,
  );

  const totalItemDiscounts = invoice.items.reduce((sum, item) => {
    const qty = toNumber(item.quantity);
    const price = toNumber(item.unitPrice);
    const base = qty * price;
    const discVal = toNumber(item.itemDiscountAmount);
    let itemDisc = 0;
    if (item.itemDiscountType === "PERCENTAGE") {
      itemDisc = base * (discVal / 100);
    } else {
      itemDisc = discVal;
    }
    return sum + itemDisc;
  }, 0);

  const subtotalAfterItemDiscounts = subtotalGross - totalItemDiscounts;

  let globalDiscountMoney = 0;
  const globalDiscVal = toNumber(invoice.discountAmount);
  if (invoice.discountType === "PERCENTAGE") {
    globalDiscountMoney = subtotalAfterItemDiscounts * (globalDiscVal / 100);
  } else {
    globalDiscountMoney = globalDiscVal;
  }

  const taxAmount = toNumber(invoice.taxAmount);
  const interestAmount = toNumber(invoice.interestAmount);
  const total = toNumber(invoice.totalAmount);

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
                  <p className="font-medium">{item.description}</p>
                  {toNumber(item.itemDiscountAmount) > 0 && (
                    <p className="text-[10px] text-red-500">
                      Less Discount:{" "}
                      {item.itemDiscountType === "PERCENTAGE"
                        ? `${item.itemDiscountAmount}%`
                        : `R${toNumber(item.itemDiscountAmount).toFixed(2)}`}
                    </p>
                  )}
                </td>
                <td className="p-1 text-center border-t border-gray-200">
                  {toNumber(item.quantity)}
                </td>
                <td className="p-1 text-right border-t border-gray-200">
                  R{toNumber(item.unitPrice).toFixed(2)}
                </td>
                <td className="p-1 text-right border-t border-gray-200">
                  R
                  {(toNumber(item.quantity) * toNumber(item.unitPrice)).toFixed(
                    2,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-1/2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">Subtotal (Gross):</span>
              <span>R{subtotalGross.toFixed(2)}</span>
            </div>

            {totalItemDiscounts > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-200 text-red-600">
                <span>Item Discounts:</span>
                <span>-R{totalItemDiscounts.toFixed(2)}</span>
              </div>
            )}

            {globalDiscountMoney > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-200 text-red-600">
                <span>
                  Global Discount{" "}
                  {invoice.discountType === "PERCENTAGE"
                    ? `(${invoice.discountAmount}%)`
                    : ""}
                  :
                </span>
                <span>-R{globalDiscountMoney.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-gray-200 text-gray-600 font-medium">
              <span>Taxable Amount:</span>
              <span>
                R
                {(
                  subtotalGross -
                  totalItemDiscounts -
                  globalDiscountMoney
                ).toFixed(2)}
              </span>
            </div>

            {taxAmount > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span>Tax ({toNumber(invoice.taxRate)}%):</span>
                <span>R{taxAmount.toFixed(2)}</span>
              </div>
            )}

            {interestAmount > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-200 text-orange-600">
                <span>
                  Interest ({toNumber(invoice.interestRate).toFixed(2)}%):
                </span>
                <span>+R{interestAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between py-1 font-bold text-sm border-t border-gray-300 mt-1 pt-2">
              <span>TOTAL AMOUNT:</span>
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
