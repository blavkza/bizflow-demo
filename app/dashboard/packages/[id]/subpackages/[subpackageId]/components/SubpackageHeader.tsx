"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Copy,
  Edit,
  MoreVertical,
  ShoppingCart,
  ArrowUpRight,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Subpackage } from "../../../types";
import { ConvertToQuotationDialog } from "./ConvertToQuotationDialog";

interface SubpackageHeaderProps {
  subpackage: Subpackage;
  onDuplicate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDuplicating: boolean;
  isDeleting: boolean;
  packageId: string;
  subpackageId: string;
}

export default function SubpackageHeader({
  subpackage,
  onDuplicate,
  onEdit,
  onDelete,
  isDuplicating,
  isDeleting,
  packageId,
  subpackageId,
}: SubpackageHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800";
    }
  };

  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            {subpackage.name}
          </h1>
          <div className="flex gap-2">
            <Badge className={getStatusColor(subpackage.status)}>
              {subpackage.status}
            </Badge>
            {subpackage.isDefault && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Default
              </Badge>
            )}
          </div>
        </div>
        <p className="text-muted-foreground mt-1">
          {subpackage.description || "No description available"}
        </p>
      </div>

      <div className="flex gap-2">
        <ConvertToQuotationDialog
          subpackageId={subpackageId}
          subpackageName={subpackage.name}
          packageId={packageId}
        />

        <Button variant="outline" onClick={onEdit} disabled={isDuplicating}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                href={`/packages/${packageId}/subpackages/${subpackageId}/orders`}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                View Orders
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/packages/${packageId}/subpackages/${subpackageId}/analytics`}
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDuplicate} disabled={isDuplicating}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate Subpackage
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={onDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Subpackage
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
