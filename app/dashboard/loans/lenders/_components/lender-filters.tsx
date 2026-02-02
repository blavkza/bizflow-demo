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

interface LenderFiltersProps {
  searchTerm: string;
  sortOption: string;
  onSearchChange: (value: string) => void;
  onSortOptionChange: (value: string) => void;
}

export function LenderFilters({
  searchTerm,
  sortOption,
  onSearchChange,
  onSortOptionChange,
}: LenderFiltersProps) {
  return (
    <div className="flex gap-2 my-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search lenders by name or contact..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select value={sortOption} onValueChange={onSortOptionChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name_asc">Name: A-Z</SelectItem>
          <SelectItem value="name_desc">Name: Z-A</SelectItem>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="rate_high">Interest: High</SelectItem>
          <SelectItem value="rate_low">Interest: Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
