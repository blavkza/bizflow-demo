"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart, RefreshCw } from "lucide-react";
import Link from "next/link";
import SalesExport from "./SalesExport";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

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
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-4 py-4">
      {/* Left Side: Navigation, Title, and Description */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales History</h2>
          <p className="text-sm text-muted-foreground">
            Manage, track, and review your completed transactions.
          </p>
        </div>
      </div>

      {/* Right Side: Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          className="h-9 w-9"
          title="Refresh Sales"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

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
