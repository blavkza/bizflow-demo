"use client";

import { forwardRef } from "react";
import { TrainerWithDetails } from "../type";
import { format } from "date-fns";
import { PaymentStatus, PaymentType } from "@prisma/client";

interface PayslipPDFProps {
  trainer: TrainerWithDetails;
  payment: {
    id: string;
    amount: number;
    payDate: Date;
    type: PaymentType;
    status: PaymentStatus;
    description?: string | null;
  };
  companySettings: {
    companyName: string;
    logo?: string;
    address?: string;
    city?: string;
    province?: string;
    postCode?: string;
    phone?: string;
    email?: string;
    taxId?: string;
  };
}

export const PayslipPDF = forwardRef<HTMLDivElement, PayslipPDFProps>(
  ({ trainer, payment, companySettings }, ref) => {
    const primaryColor = "#1F2937";
    const accentColor = "#10B981";

    const formatPaymentType = (type: PaymentType) => {
      return type
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    return (
      <div
        ref={ref}
        className="absolute top-[-10000px] left-[-10000px] bg-white px-8 py-6 w-[800px] shadow-none"
        style={{
          visibility: "hidden",
          fontFamily: "'Inter', sans-serif",
          color: primaryColor,
          fontSize: "12px",
        }}
        aria-hidden="true"
      >
        {/* Watermark Background */}
        {companySettings.logo && (
          <div
            className="absolute inset-0 opacity-5 z-0"
            style={{
              backgroundImage: `url(${companySettings.logo})`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: "50%",
              filter: "grayscale(100%)",
              pointerEvents: "none",
            }}
          />
        )}

        <div className="relative z-10">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
            <div>
              {companySettings.logo && (
                <img
                  src={companySettings.logo}
                  alt="Company Logo"
                  className="h-14 mb-3"
                />
              )}
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight">
                  {companySettings.companyName}
                </h2>
                <div className="text-xs text-gray-600 space-y-0.5">
                  {companySettings.address && <p>{companySettings.address}</p>}
                  <p>
                    {companySettings.city && `${companySettings.city}, `}
                    {companySettings.province} {companySettings.postCode}
                  </p>
                  {companySettings.phone && <p>{companySettings.phone}</p>}
                  {companySettings.email && <p>{companySettings.email}</p>}
                  {companySettings.taxId && (
                    <p className="mt-1">Tax ID: {companySettings.taxId}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <h1
                className="text-3xl font-bold mb-2 tracking-tight"
                style={{ color: accentColor }}
              >
                PAYSLIP
              </h1>
              <div className="text-sm space-y-1">
                <p className="font-medium">
                  {format(new Date(payment.payDate), "MMMM yyyy")}
                </p>
                <p className="text-xs text-gray-600">
                  Issued: {format(new Date(), "dd MMM yyyy")}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Reference: {payment.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Trainer and Payment Details */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Trainer Details
              </h3>
              <div className="space-y-1.5">
                <p className="font-medium">
                  {trainer.lastName}, {trainer.firstName}
                </p>
                <p className="text-xs text-gray-600">
                  ID: {trainer.trainerNumber}
                </p>
                <p className="text-xs text-gray-600">{trainer.position}</p>
                {trainer.department && (
                  <p className="text-xs text-gray-600">
                    Department: {trainer.department.name}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Payment Details
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-gray-600">Payment Date:</span>
                <span className="font-medium">
                  {format(new Date(payment.payDate), "dd MMM yyyy")}
                </span>
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">
                  {formatPaymentType(payment.type)}
                </span>
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-1 ${
                      payment.status === "PAID"
                        ? "bg-green-500"
                        : payment.status === "PENDING"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  ></span>
                  {payment.status.toLowerCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Earnings Summary */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
              Earnings Summary
            </h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="text-right pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount (ZAR)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 text-sm">
                    {formatPaymentType(payment.type)}
                  </td>
                  <td className="py-3 text-right font-medium">
                    {payment.amount.toLocaleString("en-ZA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                {payment.description && (
                  <tr>
                    <td colSpan={2} className="pt-1 pb-3 text-xs text-gray-500">
                      Note: {payment.description}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-1/3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm border-t border-gray-200 pt-3">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-medium">
                    {payment.amount.toLocaleString("en-ZA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-3">
                  <span>Total Pay:</span>
                  <span style={{ color: accentColor }}>
                    ZAR{" "}
                    {payment.amount.toLocaleString("en-ZA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-4 border-t border-gray-100 text-xs text-center text-gray-400">
            <p>
              This is an automatically generated document. For any inquiries,
              please contact {companySettings.companyName} HR department.
            </p>
          </div>
        </div>
      </div>
    );
  },
);

PayslipPDF.displayName = "PayslipPDF";
