"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  coupon: any; // We can improve type later
  onEdit: () => void;
  onDelete: () => void;
}

export default function Header({ coupon, onEdit, onDelete }: HeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{coupon.code}</h1>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant={coupon.isActive ? "default" : "secondary"}>
              {coupon.isActive ? "Active" : "Inactive"}
            </Badge>
            <span className="text-sm text-muted-foreground">
               {coupon.type === "PERCENTAGE" ? "Percentage Discount" : "Fixed Amount Discount"}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" onClick={onEdit}>
             <Pencil className="mr-2 h-4 w-4" /> Edit
        </Button>
        <Button variant="destructive" onClick={onDelete}>
             <Trash className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>
    </div>
  );
}
