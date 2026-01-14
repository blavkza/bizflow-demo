import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PackageCategoryWithStats } from "@/types/PackageCategory";
import { cn } from "@/lib/utils";

interface FiltersSectionProps {
  searchQuery: string;
  statusFilter: string;
  parentFilter: string;
  filteredCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onParentChange: (value: string) => void;
  onClearFilters: () => void;
  parentCategories: PackageCategoryWithStats[];
  viewType: "list" | "tree";
  onViewTypeChange: (type: "list" | "tree") => void;
}

export function FiltersSection({
  searchQuery,
  statusFilter,
  parentFilter,
  filteredCount,
  totalCount,
  onSearchChange,
  onStatusChange,
  onParentChange,
  onClearFilters,
  parentCategories,
  viewType,
  onViewTypeChange,
}: FiltersSectionProps) {
  const hasActiveFilters =
    searchQuery !== "" || statusFilter !== "all" || parentFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search categories by name or description..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => onSearchChange("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={parentFilter} onValueChange={onParentChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Parent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parents</SelectItem>
              <SelectItem value="root">Root Categories</SelectItem>
              <SelectItem value="nested">Sub Categories</SelectItem>
              {parentCategories.map((parent) => (
                <SelectItem key={parent.id} value={parent.id}>
                  {parent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={viewType === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => onViewTypeChange("list")}
            title="List View"
          >
            <Filter className="h-4 w-4" />
          </Button>

          <Button
            variant={viewType === "tree" ? "default" : "outline"}
            size="icon"
            onClick={() => onViewTypeChange("tree")}
            title="Tree View"
          >
            <Filter className="h-4 w-4 rotate-90" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredCount} of {totalCount} categories
          </Badge>

          {hasActiveFilters && (
            <>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchQuery}"
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 ml-1"
                    onClick={() => onSearchChange("")}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}

              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 ml-1"
                    onClick={() => onStatusChange("all")}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}

              {parentFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {parentFilter === "root"
                    ? "Root"
                    : parentFilter === "nested"
                      ? "Nested"
                      : "Parent"}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 ml-1"
                    onClick={() => onParentChange("all")}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
            </>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8"
          >
            <X className="mr-1 h-3 w-3" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
}
