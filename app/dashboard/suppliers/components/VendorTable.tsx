"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Globe, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { Vendor } from "../type";

interface VendorTableProps {
  vendors: Vendor[];
  loading: boolean;
}

export function VendorTable({ vendors, loading }: VendorTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vendor</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Expenses</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vendors.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="text-center py-8 text-muted-foreground"
            >
              {vendors.length === 0
                ? "No vendors found. Create your first vendor!"
                : "No vendors match your search."}
            </TableCell>
          </TableRow>
        ) : (
          vendors.map((vendor) => (
            <TableRow key={vendor.id}>
              <TableCell>
                <div className="font-medium">{vendor.name}</div>
                {vendor.taxNumber && (
                  <div className="text-sm text-muted-foreground">
                    Tax: {vendor.taxNumber}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {vendor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span className="text-sm">{vendor.email}</span>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span className="text-sm">{vendor.phone}</span>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      <span className="text-sm">{vendor.website}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {vendor.category && (
                  <Badge variant="outline">{vendor.category}</Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {vendor._count.expenses} expenses
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={vendor.status === "ACTIVE" ? "default" : "secondary"}
                >
                  {vendor.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/vendors/${vendor.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
