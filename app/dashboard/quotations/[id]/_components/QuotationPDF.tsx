"use client";

import { Decimal } from "@prisma/client/runtime/library";
import { format } from "date-fns";
import { QuotationWithRelations } from "@/types/quotation";

function toNumber(value: number | Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value);
}

interface QuotationPDFProps {
  quotation: QuotationWithRelations & {
    creator?: {
      GeneralSetting?: Array<{
        logo?: string;
        companyName?: string;
        Address?: string;
        city?: string;
        province?: string;
        postCode?: string;
        email?: string;
        phone?: string;
        website?: string;
        bankAccount?: string;
        taxId?: string;
      }>;
    };
  };
  forwardedRef: React.RefObject<HTMLDivElement>;
}

export function QuotationPDF({ quotation, forwardedRef }: QuotationPDFProps) {
  const primaryColor = "#1F2937";
  const accentColor = "#3B82F6";

  const creatorSettings = quotation.creator?.GeneralSetting?.[0] || {};

  const subtotal = quotation.items.reduce(
    (sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice),
    0
  );
  const taxAmount = toNumber(quotation.taxAmount);
  const discount = toNumber(quotation.discountAmount);
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
      {creatorSettings.logo && (
        <div
          className="absolute inset-0 opacity-5 z-0"
          style={{
            backgroundImage: `url(${creatorSettings.logo})`,
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
        <div className="flex justify-between items-start mb-8">
          <div>
            {creatorSettings.logo && (
              <img
                src={creatorSettings.logo}
                alt="Company Logo"
                className="h-40 mb-4 object-contain"
                onError={(e) =>
                  ((e.target as HTMLImageElement).style.display = "none")
                }
              />
            )}

            <div className="text-sm text-gray-600">
              {creatorSettings.companyName && (
                <p className="text-xl uppercase font-bold mb-2 text-gray-700">
                  {creatorSettings.companyName}
                </p>
              )}
              {creatorSettings.Address && <p>{creatorSettings.Address}</p>}
              {(creatorSettings.city ||
                creatorSettings.province ||
                creatorSettings.postCode) && (
                <p>
                  {creatorSettings.city && `${creatorSettings.city}, `}
                  {creatorSettings.province} {creatorSettings.postCode}
                </p>
              )}
              {(creatorSettings.email || creatorSettings.phone) && (
                <p>
                  {creatorSettings.email}
                  {creatorSettings.phone && ` | ${creatorSettings.phone}`}
                </p>
              )}
              {creatorSettings.taxId && (
                <p className="text-sm text-gray-600">
                  {" "}
                  Tax Number: {creatorSettings.taxId}
                </p>
              )}
            </div>
          </div>

          <div className="text-right">
            <h1 className="text-4xl font-bold" style={{ color: accentColor }}>
              QUOTATION
            </h1>
            <div className="mt-4 bg-gray-100 p-4 rounded-md text-sm text-gray-700">
              <p className="font-semibold">#{quotation.quotationNumber}</p>
              <p>
                <strong>Issued:</strong>{" "}
                {format(new Date(quotation.issueDate), "MMM d, yyyy")}
              </p>
              <p>
                <strong>Valid Until:</strong>{" "}
                {format(new Date(quotation.validUntil), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between mb-8 gap-4">
          <div className="bg-gray-50 p-4 rounded-md w-1/2">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              QUOTATION FOR
            </h3>
            {quotation.client.name && (
              <p className="font-medium">{quotation.client.name}</p>
            )}
            {quotation.client.email && (
              <p className="text-sm text-gray-600">{quotation.client.email}</p>
            )}
            {quotation.client.phone && (
              <p className="text-sm text-gray-600">{quotation.client.phone}</p>
            )}
            {quotation.client.address && (
              <p className="text-sm text-gray-600">
                {quotation.client.address}
              </p>
            )}
            {quotation.client.taxNumber && (
              <p className="text-sm text-gray-600">
                Tax Number: {quotation.client.taxNumber}
              </p>
            )}
          </div>
          <div className="bg-gray-50 p-4 rounded-md w-1/2 text-right">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">STATUS</h3>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                quotation.status === "CONVERTED"
                  ? "bg-emerald-100 text-emerald-800"
                  : quotation.status === "EXPIRED"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {quotation.status === "CONVERTED" ? "ACCEPTED" : quotation.status}
            </span>
            <div className="mt-12 text-sm border-t pt-4 border-gray-200">
              <div>
                <h4 className="font-semibold mb-1 text-gray-700">
                  Terms & Conditions
                </h4>
                <p className="text-gray-600">
                  {quotation.paymentTerms || "Standard payment terms apply"}
                </p>
              </div>
            </div>
          </div>
        </div>

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
            {quotation.items.map((item, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="p-3 border-t border-gray-200">
                  {item.description}
                </td>
                <td className="p-3 text-center border-t border-gray-200">
                  {toNumber(item.quantity)}
                </td>
                <td className="p-3 text-right border-t border-gray-200">
                  R{toNumber(item.unitPrice).toFixed(2)}
                </td>
                <td className="p-3 text-right border-t border-gray-200">
                  R
                  {(toNumber(item.quantity) * toNumber(item.unitPrice)).toFixed(
                    2
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
                <span>-R{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 font-semibold text-lg">
              <span>Total:</span>
              <span style={{ color: accentColor }}>R{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          {creatorSettings.website && <p>{creatorSettings.website}</p>}
          <p>
            This quotation is valid until{" "}
            {format(new Date(quotation.validUntil), "MMMM d, yyyy")}
          </p>
          <p className="mt-1">
            {creatorSettings.companyName || "Company Name"} • Thank you for your
            consideration!
          </p>
        </div>
      </div>
    </div>
  );
}
