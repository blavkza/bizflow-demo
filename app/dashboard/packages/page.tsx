"use client";

import { useState, useEffect } from "react";
import { FileDown, PackageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { PackageWithStats } from "@/types/package";
import { PackageCard } from "./components/package-card";
import { PackageDialog } from "./components/package-dialog";
import { PackagesSkeleton, StatsCardsSkeleton } from "./components/skeletons";
import { FiltersSection } from "./components/filters-section";
import { StatsCards } from "./components/stats-cards";
import { Package } from "@prisma/client";

async function fetchPackages() {
  const response = await fetch("/api/packages");

  if (!response.ok) {
    throw new Error("Failed to fetch packages");
  }

  return response.json();
}

async function deletePackage(id: string) {
  const response = await fetch(`/api/packages/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete package");
  }

  return response.json();
}

export default function PackagesPage() {
  const [allPackages, setAllPackages] = useState<PackageWithStats[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<PackageWithStats[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classificationFilter, setClassificationFilter] =
    useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [packages, setPackages] = useState<Package[]>([]);

  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  // Apply filters whenever filter states change
  useEffect(() => {
    applyFilters();
  }, [
    allPackages,
    searchQuery,
    statusFilter,
    classificationFilter,
    categoryFilter,
  ]);

  async function loadPackages() {
    setLoading(true);
    try {
      const packagesData = await fetchPackages();

      // Calculate stats for each package (frontend processing)
      const packagesWithStats = packagesData.map((pkg: any) => {
        const totalSales = pkg.salesCount;
        const averagePrice =
          pkg.subpackages.length > 0
            ? pkg.subpackages.reduce(
                (sum: number, sp: any) => sum + sp.price.toNumber(),
                0
              ) / pkg.subpackages.length
            : 0;

        return {
          ...pkg,
          totalSales,
          averagePrice,
          subpackageCount: pkg._count?.subpackages || 0,
        };
      });

      setAllPackages(packagesWithStats);
    } catch (error) {
      console.error("Error loading packages:", error);
      toast({
        title: "Error",
        description: "Failed to load packages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const applyFilters = () => {
    if (!allPackages.length) {
      setFilteredPackages([]);
      return;
    }

    const filtered = allPackages.filter((pkg) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "Active" && pkg.status === "ACTIVE") ||
        (statusFilter === "Draft" && pkg.status === "DRAFT") ||
        (statusFilter === "Inactive" && pkg.status === "INACTIVE");

      // Classification filter
      const matchesClassification =
        classificationFilter === "all" ||
        pkg.classification === classificationFilter;

      // Category filter
      const matchesCategory =
        categoryFilter === "all" || pkg.category?.name === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesClassification &&
        matchesCategory
      );
    });

    setFilteredPackages(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) {
      return;
    }

    setDeletingId(id);
    try {
      await deletePackage(id);
      toast({
        title: "Success",
        description: "Package deleted successfully",
      });
      loadPackages(); // Refresh data
    } catch (error) {
      console.error("Error deleting package:", error);
      toast({
        title: "Error",
        description: "Failed to delete package",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (pkg: PackageWithStats) => {
    setDuplicatingId(pkg.id);

    try {
      const response = await fetch(`/api/packages/${pkg.id}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to duplicate package");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: result.message,
      });

      loadPackages();
    } catch (error: any) {
      console.error("Error duplicating package:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate package",
        variant: "destructive",
      });
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleUpdate = () => {
    fetchPackages();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setClassificationFilter("all");
    setCategoryFilter("all");
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Package Management</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Manage product and service packages with classifications and
            subpackages
          </p>
          <div className="flex gap-2">
            <PackageDialog onSuccess={loadPackages} />
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <StatsCardsSkeleton />
        ) : (
          <StatsCards packages={allPackages} />
        )}

        {/* Filters Section */}
        <FiltersSection
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          classificationFilter={classificationFilter}
          categoryFilter={categoryFilter}
          filteredCount={filteredPackages.length}
          totalCount={allPackages.length}
          onSearchChange={setSearchQuery}
          onStatusChange={setStatusFilter}
          onClassificationChange={setClassificationFilter}
          onCategoryChange={setCategoryFilter}
          onClearFilters={clearFilters}
          packages={packages}
        />

        {/* Packages Grid */}
        {loading ? (
          <PackagesSkeleton />
        ) : filteredPackages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
            <div className="text-center space-y-4">
              {searchQuery ||
              statusFilter !== "all" ||
              classificationFilter !== "all" ||
              categoryFilter !== "all" ? (
                <>
                  <PackageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-semibold">
                    No packages match your filters
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                  <Button onClick={clearFilters}>Clear All Filters</Button>
                </>
              ) : (
                <>
                  <PackageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-semibold">No packages found</h3>
                  <p className="text-sm text-muted-foreground">
                    Get started by creating your first package
                  </p>
                  <PackageDialog
                    onSuccess={loadPackages}
                    trigger={<Button>Create Your First Package</Button>}
                  />
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                deletingId={deletingId}
                duplicatingId={duplicatingId}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </SidebarInset>
  );
}
