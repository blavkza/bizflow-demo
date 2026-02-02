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

interface CouponFiltersProps {
  searchTerm: string;
  statusFilter: string;
  typeFilter: string; // "all" | "PERCENTAGE" | "AMOUNT"
  sortOption: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onSortOptionChange: (value: string) => void;
}

export function CouponFilters({
  searchTerm,
  statusFilter,
  typeFilter,
  sortOption,
  onSearchChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onSortOptionChange,
}: CouponFiltersProps) {
  return (
    <div className="flex gap-2 my-4 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by code..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="PERCENTAGE">Percentage</SelectItem>
          <SelectItem value="AMOUNT">Fixed Amount</SelectItem>
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sortOption} onValueChange={onSortOptionChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
          <SelectItem value="usage-high">Usage: High</SelectItem>
          <SelectItem value="usage-low">Usage: Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
