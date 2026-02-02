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

interface LoanFiltersProps {
  searchTerm: string;
  statusFilter: string;
  sortOption: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSortOptionChange: (value: string) => void;
}

export function LoanFilters({
  searchTerm,
  statusFilter,
  sortOption,
  onSearchChange,
  onStatusFilterChange,
  onSortOptionChange,
}: LoanFiltersProps) {
  return (
    <div className="flex gap-2 my-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search loans..."
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
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="PAID_OFF">Paid Off</SelectItem>
          <SelectItem value="DEFAULTED">Defaulted</SelectItem>
          <SelectItem value="CLOSED">Closed</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sortOption} onValueChange={onSortOptionChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
          <SelectItem value="amount_high">Amount: High</SelectItem>
          <SelectItem value="amount_low">Amount: Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
