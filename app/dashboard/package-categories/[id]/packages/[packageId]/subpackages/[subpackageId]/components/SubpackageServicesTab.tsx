"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Wrench } from "lucide-react";
import Link from "next/link";
import { Subpackage } from "../../../types";

interface SubpackageServicesTabProps {
  subpackage: Subpackage;
  packageId: string;
  subpackageId: string;
}

export default function SubpackageServicesTab({
  subpackage,
  packageId,
  subpackageId,
}: SubpackageServicesTabProps) {
  const totalServices = subpackage.services?.length || 0;

  if (totalServices === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No services found</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            This subpackage doesn't contain any services yet.
          </p>
          <Button asChild>
            <Link
              href={`/packages/${packageId}/subpackages/${subpackageId}/edit`}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Subpackage
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
        <CardDescription>
          {totalServices} services included in this subpackage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subpackage.services?.map((service, index) => {
              const price = service.amount || service.price || 0;

              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      {service.name}
                    </div>
                    {service.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {service.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{service.category || "Uncategorized"}</TableCell>
                  <TableCell>{service.duration || "N/A"}</TableCell>
                  <TableCell className="font-semibold">
                    R{price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {service.features && service.features.length > 0 ? (
                      <div className="max-w-xs">
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {service.features.slice(0, 3).join(", ")}
                          {service.features.length > 3 && "..."}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No features
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/services/${service.id}`}>
                      <Eye className="w-4 h-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
