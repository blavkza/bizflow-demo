"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart, RefreshCw } from "lucide-react";
import Link from "next/link";
import SalesExport from "./SalesExport";

interface SalesHeaderProps {
  onRefresh: () => void;
  searchTerm?: string;
  statusFilter?: string;
  paymentFilter?: string;
}

export default function SalesHeader({
  onRefresh,
  searchTerm = "",
  statusFilter = "All",
  paymentFilter = "All",
}: SalesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-3xl font-bold tracking-tight">Sales History</h2>
      <div className="flex items-center space-x-2">
        <Button variant="outline" asChild>
          <Link href="/dashboard/shop/pos">
            <ShoppingCart className="mr-2 h-4 w-4" />
            New Sale
          </Link>
        </Button>
        <SalesExport
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          paymentFilter={paymentFilter}
        />
      </div>
    </div>
  );
}
