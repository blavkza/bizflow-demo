"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  Box,
  Wrench,
  Package,
} from "lucide-react";
import Link from "next/link";
import { PackageData, Subpackage } from "../types";
import { deleteSubpackage, duplicateSubpackage } from "../actions";
import { toast } from "@/components/ui/use-toast";
import { useParams } from "next/navigation";
import SubpackageForm from "./subpackage-form";

interface SubpackagesTabProps {
  packageData: PackageData;
  onUpdate: () => void;
}

export default function SubpackagesTab({
  packageData,
  onUpdate,
}: SubpackagesTabProps) {
  const params = useParams();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSubpackage, setEditingSubpackage] = useState<Subpackage | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = async (subpackageId: string) => {
    if (!confirm("Are you sure you want to delete this subpackage?")) return;

    try {
      setDeletingId(subpackageId);
      await deleteSubpackage(subpackageId);
      toast({
        title: "Subpackage deleted",
        description: "The subpackage has been deleted successfully.",
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete subpackage",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (subpackage: Subpackage) => {
    try {
      setDuplicatingId(subpackage.id);

      // Get products and services from the correct properties
      const subpackageProducts =
        (subpackage as any).subpackageProducts || subpackage.products || [];
      const subpackageServices =
        (subpackage as any).subpackageServices || subpackage.services || [];

      // Create duplicate data - convert null values to undefined
      const duplicateData = {
        name: `${subpackage.name} (Copy)`,
        description: subpackage.description || undefined,
        shortDescription: subpackage.shortDescription || undefined,
        price: Number(subpackage.price),
        originalPrice: subpackage.originalPrice
          ? Number(subpackage.originalPrice)
          : undefined,
        discount: subpackage.discount || undefined,
        discountType: subpackage.discountType || undefined,
        duration: subpackage.duration || undefined,
        isDefault: false,
        sortOrder: (subpackage.sortOrder || 0) + 1,
        status: "DRAFT",
        features: subpackage.features || [],
        products: subpackageProducts.map((p: any) => ({
          id: p.id,
          quantity: p.quantity || 1,
        })),
        services: subpackageServices.map((s: any) => ({ id: s.id })),
        packageId: subpackage.packageId,
      };

      await duplicateSubpackage(subpackage.id, duplicateData);

      toast({
        title: "Subpackage duplicated",
        description: "The subpackage has been duplicated successfully.",
      });

      onUpdate();
    } catch (error) {
      console.error("Error duplicating subpackage:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate subpackage",
        variant: "destructive",
      });
    } finally {
      setDuplicatingId(null);
    }
  };

  const calculateTotalProducts = (subpackage: Subpackage) => {
    // Check both possible property names to handle both API responses
    const products =
      (subpackage as any).subpackageProducts || subpackage.products;
    return products?.length || 0;
  };

  const calculateTotalServices = (subpackage: Subpackage) => {
    // Check both possible property names to handle both API responses
    const services =
      (subpackage as any).subpackageServices || subpackage.services;
    return services?.length || 0;
  };

  const handleEditClick = (subpackage: Subpackage) => {
    setEditingSubpackage(subpackage);
    setIsEditDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingSubpackage(null);
    onUpdate();
  };

  const handleFormCancel = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingSubpackage(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Subpackages</h3>
          <p className="text-sm text-muted-foreground">
            Pricing tiers and plan options for this package
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subpackage
        </Button>
      </div>

      {packageData.subpackages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No subpackages yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Create your first subpackage to start offering pricing tiers
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Subpackage
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packageData.subpackages.map((subpackage) => {
            const isDeleting = deletingId === subpackage.id;
            const isDuplicating = duplicatingId === subpackage.id;
            const totalProducts = calculateTotalProducts(subpackage);
            const totalServices = calculateTotalServices(subpackage);

            return (
              <Card key={subpackage.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">
                        {subpackage.name}
                      </CardTitle>
                      <CardDescription>
                        {subpackage.description || "No description"}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isDeleting || isDuplicating}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/packages/${params.id}/subpackages/${subpackage.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditClick(subpackage)}
                          disabled={isDuplicating}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(subpackage)}
                          disabled={isDuplicating || isDeleting}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          {isDuplicating ? "Duplicating..." : "Duplicate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(subpackage.id)}
                          disabled={isDeleting || isDuplicating}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isDeleting ? "Deleting..." : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getStatusColor(subpackage.status)}>
                      {subpackage.status}
                    </Badge>
                    {subpackage.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pricing */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      R{Number(subpackage.price).toLocaleString()}
                    </span>
                    {subpackage.originalPrice && (
                      <>
                        <span className="text-lg text-muted-foreground line-through">
                          R{Number(subpackage.originalPrice).toLocaleString()}
                        </span>
                        {subpackage.discount && (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            Save {subpackage.discount}%
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  {subpackage.duration && (
                    <div className="text-sm text-muted-foreground">
                      {subpackage.duration}
                    </div>
                  )}

                  {/* Notes */}
                  {subpackage.notes && (
                    <div className="bg-muted/50 p-3 rounded-lg text-sm">
                      <p className="text-muted-foreground leading-relaxed">
                        {subpackage.notes}
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Features */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Features</h4>
                    <div className="space-y-1.5">
                      {subpackage.features?.slice(0, 3).map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">
                            {feature}
                          </span>
                        </div>
                      ))}
                      {subpackage.features &&
                        subpackage.features.length > 3 && (
                          <p className="text-sm text-muted-foreground pl-6">
                            +{subpackage.features.length - 3} more features
                          </p>
                        )}
                    </div>
                  </div>

                  <Separator />

                  {/* Products & Services Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Box className="h-4 w-4" />
                        <span>Products</span>
                      </div>
                      <p className="text-sm font-medium">
                        {totalProducts} items
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wrench className="h-4 w-4" />
                        <span>Services</span>
                      </div>
                      <p className="text-sm font-medium">
                        {totalServices} items
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Sales Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Sales</p>
                      <p className="font-semibold">{subpackage.salesCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Revenue</p>
                      <p className="font-semibold">
                        R{Number(subpackage.revenue).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <Button className="w-full" asChild>
                    <Link
                      href={`/dashboard/packages/${params.id}/subpackages/${subpackage.id}`}
                    >
                      View Full Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Subpackage Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Subpackage</DialogTitle>
            <DialogDescription>
              Add a new pricing tier to this package.
            </DialogDescription>
          </DialogHeader>
          <SubpackageForm
            mode="create"
            packageId={packageData.id}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

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
              packageId={packageData.id}
              subpackageData={editingSubpackage}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
