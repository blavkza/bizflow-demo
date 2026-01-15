"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Copy, Trash2, MoreHorizontal } from "lucide-react";
import { PackageData } from "../types";
import { useState } from "react";
import { deletePackage } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { PackageDialog } from "../../components/package-dialog";

interface PackageHeaderProps {
  packageData: PackageData;
  onUpdate: () => void;
}

export default function PackageHeader({
  packageData,
  onUpdate,
}: PackageHeaderProps) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getClassificationColor = (classification: string | null) => {
    switch (classification?.toUpperCase()) {
      case "CLASS_1_A":
        return "bg-purple-100 text-purple-800";
      case "CLASS_1_B":
        return "bg-blue-100 text-blue-800";
      case "CLASS_2_A":
        return "bg-orange-100 text-orange-800";
      case "CLASS_2_B":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      setIsDeleting(true);
      await deletePackage(packageData.id);
      toast({
        title: "Package deleted",
        description: "The package has been deleted successfully.",
      });
      router.push("/packages");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete package",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = () => {
    // Implement duplicate functionality
    toast({
      title: "Coming soon",
      description: "Duplicate functionality will be available soon.",
    });
  };

  return (
    <>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{packageData.name}</h1>

            <Badge className={getStatusColor(packageData.status)}>
              {packageData.status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleDuplicate} disabled={isDeleting}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Package
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Package
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {isEditDialogOpen && (
        <PackageDialog
          mode="edit"
          packageData={packageData}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={onUpdate}
        />
      )}
    </>
  );
}
