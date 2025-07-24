"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InvoiceFiltersProps {
  searchTerm: string;
  statusFilter: string;
  sortOption: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSortOptionChange: (value: string) => void;
}

export function InvoiceFilters({
  searchTerm,
  statusFilter,
  sortOption,
  onSearchChange,
  onStatusFilterChange,
  onSortOptionChange,
}: InvoiceFiltersProps) {
  return (
    <div className="flex gap-2 my-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="DRAFT">Draft</SelectItem>
          <SelectItem value="SENT">Sent</SelectItem>
          <SelectItem value="VIEWED">Viewed</SelectItem>
          <SelectItem value="PAID">Paid</SelectItem>
          <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
          <SelectItem value="OVERDUE">Overdue</SelectItem>
          <SelectItem value="CANCELLED">Cancelled</SelectItem>
          <SelectItem value="REFUNDED">Refunded</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sortOption} onValueChange={onSortOptionChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
          <SelectItem value="amount-high">Amount: High</SelectItem>
          <SelectItem value="amount-low">Amount: Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
