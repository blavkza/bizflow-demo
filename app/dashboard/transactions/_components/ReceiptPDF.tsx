"use client";

import { forwardRef } from "react";
import { format } from "date-fns";
import { PaymentMethod, TransactionType, TransferStatus } from "@prisma/client";

interface ReceiptPDFProps {
  transaction: {
    id: string;
    date: string;
    description: string;
    category?: { name: string } | null;
    type: TransactionType;
    amount: number;
    status: TransferStatus;
    method: PaymentMethod;
  };
  companySettings?: {
    companyName: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
  } | null;
}

export const ReceiptPDF = forwardRef<HTMLDivElement, ReceiptPDFProps>(
  ({ transaction, companySettings = null }, ref) => {
    // Updated color scheme for better visibility
    const primaryColor = "#111827"; // Darker gray for better contrast
    const incomeColor = "#059669"; // Green-600 for income
    const expenseColor = "#DC2626"; // Red-600 for expense
    const accentColor = "#2563EB"; // Blue-600 for headings (better visibility than green)

    if (!transaction) {
      return (
        <div ref={ref} className="absolute top-[-10000px] left-[-10000px]">
          Error: No transaction data provided
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className="absolute top-[-10000px] left-[-10000px] bg-white px-8 py-6 w-[800px]"
        style={{
          visibility: "hidden",
          fontFamily: "'Inter', sans-serif",
          fontSize: "12px",
          color: primaryColor, // Apply primary color to all text
        }}
        aria-hidden="true"
      >
        <div className="relative">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
            <div>
              {companySettings?.logo && (
                <img
                  src={companySettings.logo}
                  alt="Company Logo"
                  className="h-14 mb-3"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              )}
              <div className="space-y-1">
                <h2
                  className="text-xl font-bold tracking-tight"
                  style={{ color: primaryColor }}
                >
                  {companySettings?.companyName || "Company Name"}
                </h2>
                <div className="text-xs text-gray-600 space-y-0.5">
                  {companySettings?.address && <p>{companySettings.address}</p>}
                  {companySettings?.phone && <p>{companySettings.phone}</p>}
                  {companySettings?.email && <p>{companySettings.email}</p>}
                </div>
              </div>
            </div>

            <div className="text-right">
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: accentColor }}
              >
                RECEIPT
              </h1>
              <div className="text-sm space-y-1">
                <p className="font-medium">
                  {format(new Date(transaction.date), "MMMM yyyy")}
                </p>
                <p className="text-xs text-gray-600">
                  Issued: {format(new Date(), "dd MMM yyyy")}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Reference: {transaction.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <h3
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: primaryColor }}
              >
                Transaction Details
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {format(new Date(transaction.date), "dd MMM yyyy")}
                </span>
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{transaction.type}</span>
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-1 ${
                      transaction.status === "COMPLETED"
                        ? "bg-green-500"
                        : transaction.status === "PENDING"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  ></span>
                  {transaction.status.toLowerCase()}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h3
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: primaryColor }}
              >
                Payment Details
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-gray-600">Method:</span>
                <span className="font-medium">{transaction.method}</span>
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">
                  {transaction.category?.name || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Summary */}
          <div className="mb-8">
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-3"
              style={{ color: primaryColor }}
            >
              Transaction Summary
            </h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th
                    className="text-left pb-2 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: primaryColor }}
                  >
                    Description
                  </th>
                  <th
                    className="text-right pb-2 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: primaryColor }}
                  >
                    Amount (ZAR)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 text-sm">{transaction.description}</td>
                  <td
                    className="py-3 text-right font-medium"
                    style={{
                      color:
                        transaction.type === "INCOME"
                          ? incomeColor
                          : expenseColor,
                    }}
                  >
                    {transaction.type === "INCOME" ? "+" : "-"}R
                    {Math.abs(transaction.amount).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="">
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-3">
                  <span style={{ color: primaryColor, marginRight: "40px" }}>
                    Total Amount:
                  </span>
                  <span
                    style={{
                      color:
                        transaction.type === "INCOME"
                          ? incomeColor
                          : expenseColor,
                      fontWeight: "bold",
                    }}
                  >
                    {transaction.type === "INCOME" ? "+" : "-"}R
                    {Math.abs(transaction.amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="mt-12 pt-4 border-t border-gray-100 text-xs text-center"
            style={{ color: primaryColor }}
          >
            <p>
              This is an automatically generated receipt. For any inquiries,
              please contact {companySettings?.companyName || "the company"}.
            </p>
          </div>
        </div>
      </div>
    );
  }
);

ReceiptPDF.displayName = "ReceiptPDF";
