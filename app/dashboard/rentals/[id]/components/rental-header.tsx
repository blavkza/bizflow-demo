import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Download,
  Send,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { ToolRentalDetail } from "../types";
import { useRouter } from "next/navigation";

interface RentalHeaderProps {
  rental: ToolRentalDetail;
  onStatusDialogOpen: () => void;
}

export default function RentalHeader({
  rental,
  onStatusDialogOpen,
}: RentalHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center space-x-4">
        <Button onClick={() => router.back()} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {rental.tool.name}
          </h2>
          <p className="text-muted-foreground">
            Rented by {rental.businessName}
          </p>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem>
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Send className="h-4 w-4 mr-2" />
            Send Invoice
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onStatusDialogOpen}>
            <Edit className="h-4 w-4 mr-2" />
            Update Status
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Cancel Rental
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
