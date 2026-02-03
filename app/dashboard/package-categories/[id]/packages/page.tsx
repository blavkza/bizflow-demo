"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, FileDown, PackageIcon } from "lucide-react";
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

async function fetchCategoryPackages(categoryId?: string) {
  const url = categoryId
    ? `/api/packages?categoryId=${categoryId}`
    : "/api/packages";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch packages");
  }

  const data = await response.json();
  return data;
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

export default function CategoryPackagesPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<{
    id: string;
    name: string;
    description?: string;
  } | null>(null);
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

  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  useEffect(() => {
    if (categoryId) {
      loadData();
    }
  }, [categoryId]);

  // Apply filters whenever filter states change
  useEffect(() => {
    applyFilters();
  }, [allPackages, searchQuery, statusFilter, classificationFilter]);

  async function loadData() {
    setLoading(true);
    try {
      console.log("Loading packages for category ID:", categoryId);

      // Fetch packages and category info in ONE API call
      const data = await fetchCategoryPackages(categoryId);
      console.log("Loaded data:", data);

      // Set category info from API response
      if (data.category) {
        setCategory(data.category);
      } else {
        // Fallback if no category info
        setCategory({
          id: categoryId,
          name: "Category",
        });
      }

      // Set packages
      setAllPackages(data.packages || []);
      setFilteredPackages(data.packages || []);

      console.log(`Loaded ${data.packages?.length || 0} packages`);
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
        pkg.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "Active" && pkg.status === "ACTIVE") ||
        (statusFilter === "Draft" && pkg.status === "DRAFT") ||
        (statusFilter === "Inactive" && pkg.status === "INACTIVE");

      return matchesSearch && matchesStatus;
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
      loadData();
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

      loadData();
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
    loadData();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setClassificationFilter("all");
  };

  // Calculate category-specific stats from allPackages
  const categoryStats = {
    totalPackages: allPackages.length,
    activePackages: allPackages.filter((pkg) => pkg.status === "ACTIVE").length,
    draftPackages: allPackages.filter((pkg) => pkg.status === "DRAFT").length,
    totalRevenue: allPackages.reduce(
      (sum, pkg) => sum + (pkg.totalSales || 0),
      0
    ),
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to categories
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              {category ? `${category.name} Packages` : "Loading..."}
            </h1>
            {category?.description && (
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <PackageDialog categoryId={categoryId} onSuccess={loadData} />
          </div>
        </div>

        {/* Category-specific Stats */}
        {loading ? (
          <StatsCardsSkeleton />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex flex-col">
                <div className="text-2xl font-bold">
                  {categoryStats.totalPackages}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Packages
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex flex-col">
                <div className="text-2xl font-bold text-green-600">
                  {categoryStats.activePackages}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex flex-col">
                <div className="text-2xl font-bold text-yellow-600">
                  {categoryStats.draftPackages}
                </div>
                <div className="text-sm text-muted-foreground">Draft</div>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex flex-col">
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(categoryStats.totalRevenue)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Revenue
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <FiltersSection
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          classificationFilter={classificationFilter}
          categoryFilter={category?.name || "all"}
          filteredCount={filteredPackages.length}
          totalCount={allPackages.length}
          onSearchChange={setSearchQuery}
          onStatusChange={setStatusFilter}
          onClassificationChange={setClassificationFilter}
          onCategoryChange={() => {}} // No-op since we're in a specific category
          onClearFilters={clearFilters}
          packages={allPackages}
        />

        {/* Packages Grid */}
        {loading ? (
          <PackagesSkeleton />
        ) : filteredPackages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
            <div className="text-center space-y-4">
              {searchQuery ||
              statusFilter !== "all" ||
              classificationFilter !== "all" ? (
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
                  <h3 className="text-lg font-semibold">
                    No packages found in this category
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get started by creating your first package in this category
                  </p>
                  <PackageDialog
                    categoryId={categoryId}
                    onSuccess={loadData}
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
