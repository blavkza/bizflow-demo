"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { ChevronLeft, Package } from "lucide-react";
import Link from "next/link";
import {
  getSubpackage,
  deleteSubpackage,
  duplicateSubpackage,
} from "../../actions";
import { Subpackage } from "../../types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SubpackageForm from "../../components/subpackage-form";

// Import components
import SubpackageHeader from "./components/SubpackageHeader";
import SubpackageStatsCards from "./components/SubpackageStatsCards";
import SubpackageOverviewTab from "./components/SubpackageOverviewTab";
import SubpackageProductsTab from "./components/SubpackageProductsTab";
import SubpackageServicesTab from "./components/SubpackageServicesTab";
import SubpackageFeaturesTab from "./components/SubpackageFeaturesTab";
import SubpackageSettingsTab from "./components/SubpackageSettingsTab";

export default function SubpackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [subpackage, setSubpackage] = useState<Subpackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSubpackage, setEditingSubpackage] = useState<Subpackage | null>(
    null
  );

  useEffect(() => {
    fetchSubpackage();
  }, [params.subpackageId]);

  async function fetchSubpackage() {
    try {
      setLoading(true);
      const data = await getSubpackage(params.subpackageId as string);
      setSubpackage(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load subpackage"
      );
      toast({
        title: "Error",
        description: "Failed to load subpackage details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteSubpackage(params.subpackageId as string);

      toast({
        title: "Subpackage deleted",
        description: "The subpackage has been deleted successfully.",
      });

      router.back();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete subpackage",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      setIsDuplicating(true);
      if (!subpackage) return;

      const duplicateData = {
        name: `${subpackage.name} (Copy)`,
        description: subpackage.description || undefined,
        shortDescription: subpackage.shortDescription || undefined,
        price: subpackage.price,
        originalPrice: subpackage.originalPrice || undefined,
        discount: subpackage.discount || undefined,
        discountType: subpackage.discountType || undefined,
        duration: subpackage.duration || undefined,
        isDefault: false,
        sortOrder: (subpackage.sortOrder || 0) + 1,
        status: "DRAFT",
        features: subpackage.features || [],
        products:
          subpackage.products?.map((p) => ({
            id: p.id,
            quantity: p.quantity || 1,
            unitPrice: p.unitPrice || undefined,
          })) || [],
        services:
          subpackage.services?.map((s) => ({
            id: s.id,
            unitPrice: s.price || undefined,
          })) || [],
        packageId: subpackage.packageId,
      };

      await duplicateSubpackage(subpackage.id, duplicateData);

      toast({
        title: "Subpackage duplicated",
        description: "The subpackage has been duplicated successfully.",
      });

      fetchSubpackage();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate subpackage",
        variant: "destructive",
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleFormSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingSubpackage(null);
    fetchSubpackage();
  };

  const handleFormCancel = () => {
    setIsEditDialogOpen(false);
    setEditingSubpackage(null);
  };

  const handleEditClick = (subpackage: Subpackage) => {
    setEditingSubpackage(subpackage);
    setIsEditDialogOpen(true);
  };

  if (error) {
    return (
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <div className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Error loading subpackage</h3>
            <p className="text-muted-foreground mt-2">{error}</p>
            <Button className="mt-4" onClick={() => router.back()}>
              Back to Package
            </Button>
          </div>
        </div>
      </SidebarInset>
    );
  }

  if (loading || !subpackage) {
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

  const totalProducts = subpackage.products?.length || 0;
  const totalServices = subpackage.services?.length || 0;

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />

          <Button className="mt-4" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Package
          </Button>
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <SubpackageHeader
          subpackage={subpackage}
          onDuplicate={handleDuplicate}
          onEdit={() => handleEditClick(subpackage)}
          isDuplicating={isDuplicating}
          onDelete={() => setIsDeleteDialogOpen(true)}
          isDeleting={isDeleting}
          packageId={params.id as string}
          subpackageId={params.subpackageId as string}
        />

        <SubpackageStatsCards subpackage={subpackage} />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">
              Products ({totalProducts})
            </TabsTrigger>
            <TabsTrigger value="services">
              Services ({totalServices})
            </TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <SubpackageOverviewTab subpackage={subpackage} />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <SubpackageProductsTab
              subpackage={subpackage}
              packageId={params.id as string}
              subpackageId={params.subpackageId as string}
            />
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <SubpackageServicesTab
              subpackage={subpackage}
              packageId={params.id as string}
              subpackageId={params.subpackageId as string}
            />
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <SubpackageFeaturesTab subpackage={subpackage} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <SubpackageSettingsTab
              subpackage={subpackage}
              packageId={params.id as string}
              onDelete={() => setIsDeleteDialogOpen(true)}
              isDeleting={isDeleting}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Subpackage Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subpackage</DialogTitle>
            <DialogDescription>Update subpackage details.</DialogDescription>
          </DialogHeader>
          {editingSubpackage && (
            <SubpackageForm
              mode="edit"
              packageId={subpackage.packageId}
              subpackageData={editingSubpackage}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subpackage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{subpackage.name}"? This action
              cannot be undone. This will remove the subpackage from the package
              but will not delete the products or services.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Subpackage"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarInset>
  );
}
