"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  MoreHorizontal,
  ImageIcon,
} from "lucide-react";
import {
  ToolRental,
  formatDecimal,
  getStatusColor,
  getPaymentStatusColor,
} from "../types";
import { PaginationControls } from "@/components/PaginationControls";
import { useRouter } from "next/navigation";

interface RentalsTableProps {
  rentals: ToolRental[];
  loading: boolean;
  onAcceptRental: (rentalId: string) => void;
}

export default function RentalsTable({
  rentals,
  loading,
  onAcceptRental,
}: RentalsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();

  const getToolImage = (rental: ToolRental) => {
    // Try to get image from tool data
    if (rental.tool.primaryImage) {
      return rental.tool.primaryImage;
    }
    if (rental.tool.images && typeof rental.tool.images === "string") {
      return rental.tool.images;
    }
    if (
      rental.tool.images &&
      Array.isArray(rental.tool.images) &&
      rental.tool.images.length > 0
    ) {
      return rental.tool.images[0];
    }
    return null;
  };

  // Calculate pagination
  const totalItems = rentals.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get current page items
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRentals = rentals.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (value: string) => {
    const itemsPerPage = parseInt(value, 10);
    setItemsPerPage(itemsPerPage);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading rentals...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rental History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool & Business</TableHead>
              <TableHead>Rental Period</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Rate/Day</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRentals.map((rental) => {
              const toolImage = getToolImage(rental);

              return (
                <TableRow key={rental.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {toolImage ? (
                        <img
                          src={toolImage}
                          alt={rental.tool.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{rental.tool.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {rental.businessName}
                        </div>
                        {rental.quotation?.client && (
                          <div className="text-xs text-muted-foreground">
                            Client: {rental.quotation.client.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>
                      {new Date(rental.rentalStartDate).toLocaleDateString()}
                    </div>
                    <div className="text-muted-foreground">
                      to {new Date(rental.rentalEndDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{rental.rentalDays || 0} days</TableCell>
                  <TableCell className="font-medium">
                    R{formatDecimal(rental.rentalRate).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    R{formatDecimal(rental.totalCost).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(rental.status)}>
                      {rental.status.charAt(0).toUpperCase() +
                        rental.status.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={getPaymentStatusColor(rental.paymentStatus)}
                    >
                      {rental.paymentStatus.charAt(0).toUpperCase() +
                        rental.paymentStatus.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() =>
                        router.push(`/dashboard/rentals/${rental.id}`)
                      }
                      variant={"ghost"}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="mt-6">
          <PaginationControls
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            totalPages={totalPages}
            onItemsPerPageChange={handleItemsPerPageChange}
            onPageChange={handlePageChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
