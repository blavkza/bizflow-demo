"use client";

import { Button } from "@/components/ui/button";
import { FilePlus } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  documentType?: string;
  canCreateDocuments?: boolean;
  hasFullAccess?: boolean;
}

export default function Header({
  documentType = "all",
  canCreateDocuments = false,
  hasFullAccess = false,
}: HeaderProps) {
  const getLabel = () => {
    if (documentType === "all") return "Documents";

    const labels: Record<string, string> = {
      DELIVERY_NOTE: "Delivery Notes",
      PURCHASE_ORDER: "Purchase Orders",
      PRO_FORMA_INVOICE: "Pro Forma Invoices",
      CREDIT_NOTE: "Credit Notes",
      SUPPLIER_LIST: "List to Supplier ",
      INVOICE: "Invoices",
    };

    return labels[documentType] ?? "Documents";
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">{getLabel()}</h1>
        <p className="text-muted-foreground">
          Manage all your {getLabel()} in one place
        </p>
      </div>
    </div>
  );
}
