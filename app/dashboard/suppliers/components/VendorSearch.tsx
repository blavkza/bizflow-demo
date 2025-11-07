"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface VendorSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function VendorSearch({
  searchQuery,
  onSearchChange,
}: VendorSearchProps) {
  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search vendors..."
        className="pl-8"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
