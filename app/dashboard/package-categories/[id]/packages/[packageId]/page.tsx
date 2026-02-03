"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getPackage } from "./subpackages/[subpackageId]/actions";
import { PackageData } from "./types";
import PackageHeader from "./components/PackageHeader";
import PackageStatsCards from "./components/PackageStatsCards";
import PackageInfoCard from "./components/PackageInfoCard";
import SubpackagesTab from "./components/SubpackagesTab";
import ProductsTab from "./components/ProductsTab";
import ServicesTab from "./components/ServicesTab";
import { Skeleton } from "@/components/ui/skeleton";

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPackage();
  }, [params.packageId]);

  async function fetchPackage() {
    try {
      setLoading(true);
      const data = await getPackage(params.packageId as string);
      setPackageData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load package");
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold">Error loading package</h3>
            <p className="text-muted-foreground mt-2">{error}</p>
            <Button className="mt-4" onClick={() => router.back()}>
              Back to Packages
            </Button>
          </div>
        </div>
      </SidebarInset>
    );
  }

  if (loading || !packageData) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Skeleton className="h-9 w-32" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <Skeleton className="h-12 w-1/3" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Packages
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <PackageHeader packageData={packageData} onUpdate={fetchPackage} />

        <PackageStatsCards packageData={packageData} />

        <Tabs defaultValue="subpackages" className="w-full">
          <TabsList>
            <TabsTrigger value="subpackages">Subpackages</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="overview">Package Info</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <PackageInfoCard packageData={packageData} />
          </TabsContent>

          <TabsContent value="subpackages" className="space-y-4">
            <SubpackagesTab packageData={packageData} onUpdate={fetchPackage} />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <ProductsTab packageData={packageData} />
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <ServicesTab packageData={packageData} />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  );
}
