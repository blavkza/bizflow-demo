"use client";

import { VendorSearch } from "./VendorSearch";
import { AddVendorDialog } from "./AddVendorDialog";

interface VendorActionBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onVendorAdded: () => void;
}

export function VendorActionBar({
  searchQuery,
  onSearchChange,
  onVendorAdded,
}: VendorActionBarProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 gap-2">
        <VendorSearch
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
      </div>
      <div className="flex gap-2">
        <AddVendorDialog onVendorAdded={onVendorAdded} />
      </div>
    </div>
  );
}
