"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceDocumentWithRelations } from "@/types/invoice-document";
import { DocumentStatus, InvoiceDocumentType } from "@prisma/client";
import {
  FileText,
  Truck,
  CreditCard,
  List,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
} from "lucide-react";

interface InvoiceDocumentStatsProps {
  documents: InvoiceDocumentWithRelations[];
  documentTypeFilter: string;
}

export function InvoiceDocumentStats({
  documents,
  documentTypeFilter,
}: InvoiceDocumentStatsProps) {
  // Filter documents by type if not "all"
  const filteredDocs =
    documentTypeFilter === "all"
      ? documents
      : documents.filter(
          (doc) => doc.invoiceDocumentType === documentTypeFilter
        );

  // Calculate statistics
  const total = filteredDocs.length;
  const totalAmount = filteredDocs.reduce(
    (sum, doc) => sum + Number(doc.totalAmount || 0),
    0
  );

  const drafts = filteredDocs.filter((doc) => doc.status === "DRAFT").length;
  const sent = filteredDocs.filter((doc) => doc.status === "SENT").length;
  const delivered = filteredDocs.filter(
    (doc) => doc.status === "DELIVERED"
  ).length;
  const paid = filteredDocs.filter((doc) => doc.status === "PAID").length;
  const overdue = filteredDocs.filter((doc) => doc.status === "OVERDUE").length;

  // Count by document type (only if showing all)
  const deliveryNotes = documents.filter(
    (doc) => doc.invoiceDocumentType === "DELIVERY_NOTE"
  ).length;
  const purchaseOrders = documents.filter(
    (doc) => doc.invoiceDocumentType === "PURCHASE_ORDER"
  ).length;
  const proFormaInvoices = documents.filter(
    (doc) => doc.invoiceDocumentType === "PRO_FORMA_INVOICE"
  ).length;
  const creditNotes = documents.filter(
    (doc) => doc.invoiceDocumentType === "CREDIT_NOTE"
  ).length;
  const supplierLists = documents.filter(
    (doc) => doc.invoiceDocumentType === "SUPPLIER_LIST"
  ).length;
  const invoices = documents.filter(
    (doc) => doc.invoiceDocumentType === "INVOICE"
  ).length;

  const stats = [
    {
      title: "Total Documents",
      value: total,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Amount",
      value: `R ${totalAmount.toLocaleString("en-ZA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Drafts",
      value: drafts,
      icon: FileText,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      title: "Sent",
      value: sent,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Delivered",
      value: delivered,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Paid",
      value: paid,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Overdue",
      value: overdue,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  const typeStats = [
    {
      title: "Delivery Notes",
      value: deliveryNotes,
      icon: Truck,
      color: "text-blue-600",
    },
    {
      title: "Purchase Orders",
      value: purchaseOrders,
      icon: FileText,
      color: "text-orange-600",
    },
    {
      title: "Pro Forma Invoices",
      value: proFormaInvoices,
      icon: FileText,
      color: "text-purple-600",
    },
    {
      title: "Credit Notes",
      value: creditNotes,
      icon: CreditCard,
      color: "text-red-600",
    },
    {
      title: "Supplier Lists",
      value: supplierLists,
      icon: List,
      color: "text-gray-600",
    },
    {
      title: "Invoices",
      value: invoices,
      icon: FileText,
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="grid gap-4">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.slice(0, 4).map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Document Type Stats (only show when viewing all) */}
      {documentTypeFilter === "all" && (
        <Card>
          <CardHeader>
            <CardTitle>Documents by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {typeStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div
                      className={`inline-flex items-center justify-center p-3 rounded-full ${stat.color.replace("text-", "bg-")} bg-opacity-10 mb-2`}
                    >
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <p className="text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
