"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Vendor } from "./type";
import { VendorActionBar } from "./components/VendorActionBar";
import { VendorTable } from "./components/VendorTable";
import { VendorStatsCard } from "./components/VendorStatsCard";
import { ProductCategory } from "@prisma/client";
import { PaginationControls } from "@/components/PaginationControls";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/vendors");
      if (!response.ok) throw new Error("Failed to fetch vendors");
      const data = await response.json();
      setVendors(data);
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  // Filter vendors based on search query
  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const nameMatch = vendor.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const emailMatch =
        vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false;

      let categoriesMatch = false;
      if (vendor.categories) {
        if (Array.isArray(vendor.categories)) {
          if (vendor.categories.length === 0) {
            categoriesMatch = false;
          } else if (typeof vendor.categories[0] === "string") {
            categoriesMatch = (vendor.categories as string[]).some((cat) =>
              cat.toLowerCase().includes(searchQuery.toLowerCase())
            );
          } else {
            categoriesMatch = (vendor.categories as ProductCategory[]).some(
              (cat) =>
                cat.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
        }
      }

      return nameMatch || emailMatch || categoriesMatch;
    });
  }, [vendors, searchQuery]);

  // Paginate filtered vendors
  const paginatedVendors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVendors.slice(startIndex, endIndex);
  }, [filteredVendors, currentPage, itemsPerPage]);

  // Calculate stats
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.status === "ACTIVE").length;
  const totalExpenses = vendors.reduce(
    (sum, vendor) => sum + (vendor._count?.expenses || 0),
    0
  );

  // Calculate unique categories count
  const allCategories = vendors.flatMap((v) => {
    if (!v.categories) return [];
    if (Array.isArray(v.categories)) {
      if (v.categories.length === 0) return [];
      if (typeof v.categories[0] === "string") {
        return v.categories as string[];
      } else {
        return (v.categories as ProductCategory[]).map((cat) => cat.name);
      }
    }
    return [];
  });
  const categoriesCount = new Set(allCategories).size;

  // Calculate pagination values
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change - accept string and convert to number
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = Number(value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div>
      <header className="mb-4 flex flex-col sm:flex-row sm:items-center sm:h-16 shrink-0 gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-auto">
        <div className="flex items-center gap-2 px-4 py-3 sm:py-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold">Suppliers Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage your vendors, suppliers, providers and their information in
              one place
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <VendorActionBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onVendorAdded={fetchVendors}
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <VendorStatsCard
            title="Total Vendors"
            value={totalVendors}
            description="All vendors and suppliers"
            icon="Users"
            trend={null}
          />
          <VendorStatsCard
            title="Active Vendors"
            value={activeVendors}
            description="Currently active"
            icon="CheckCircle"
            trend={
              totalVendors > 0
                ? ((activeVendors / totalVendors) * 100).toFixed(0) + "%"
                : "0%"
            }
          />
          <VendorStatsCard
            title="Total Expenses"
            value={totalExpenses}
            description="Linked expenses"
            icon="Receipt"
            trend={null}
          />
          <VendorStatsCard
            title="Categories"
            value={categoriesCount}
            description="Unique categories"
            icon="Tag"
            trend={null}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Vendors / Suppliers / Providers
            </CardTitle>
            <CardDescription>
              {loading
                ? "Loading vendors..."
                : `Showing ${paginatedVendors.length} of ${filteredVendors.length} filtered vendors (${totalVendors} total)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <VendorTable vendors={paginatedVendors} loading={loading} />

            {!loading && filteredVendors.length > 0 && (
              <div className="p-4 border-t">
                <PaginationControls
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
