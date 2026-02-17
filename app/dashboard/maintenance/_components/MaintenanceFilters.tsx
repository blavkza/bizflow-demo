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
import { ServiceMaintenanceStatus, MaintenanceType } from "@prisma/client";

interface MaintenanceFiltersProps {
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
  sortOption: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  onSortOptionChange: (value: string) => void;
}

export function MaintenanceFilters({
  searchTerm,
  statusFilter,
  typeFilter,
  sortOption,
  onSearchChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onSortOptionChange,
}: MaintenanceFiltersProps) {
  return (
    <div className="flex gap-2 my-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search maintenance tasks or locations..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value={MaintenanceType.ONE_OFF}>One-off</SelectItem>
          <SelectItem value={MaintenanceType.ROUTINE}>Routine</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {Object.values(ServiceMaintenanceStatus).map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sortOption} onValueChange={onSortOptionChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
