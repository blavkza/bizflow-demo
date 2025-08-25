"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CategoryStatus, CategoryType } from "@prisma/client";
import { Edit, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import CategoryForm from "./category-Form";
import { Category } from "@/types/category";

interface CategoryListProps {
  hasFullAccess: boolean;
  fetchCategories: () => void;
  categories: Category[];
  canManageCategory: boolean;
}

export default function CategoryList({
  categories,
  fetchCategories,
  canManageCategory,
  hasFullAccess,
}: CategoryListProps) {
  const router = useRouter();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Categories</CardTitle>
        <CardDescription>Manage your transaction categories</CardDescription>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No categories found. Create one to get started.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Total Amount</TableHead>
                {(canManageCategory || hasFullAccess) && (
                  <TableHead>Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((category) => {
                return (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          `mt-1 text-white, ${category.type === CategoryType.INCOME ? "bg-green-500" : "bg-red-500"}`
                        )}
                      >
                        {category.type.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "bg-green-600/80 text-white",
                          category.status === "INACTIVE" && "bg-red-500"
                        )}
                      >
                        {category.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {category.description || "No description"}
                    </TableCell>
                    <TableCell>{category.transactionCount}</TableCell>
                    <TableCell
                      className={
                        category.type === "INCOME"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {category.type === "INCOME" ? "+" : "-"}R
                      {Math.abs(category.totalAmount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {(canManageCategory || hasFullAccess) && (
                          <Dialog
                            open={editingCategoryId === category.id}
                            onOpenChange={(open) => {
                              setEditingCategoryId(open ? category.id : null);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Edit Category</DialogTitle>
                                <DialogDescription>
                                  Update this category
                                </DialogDescription>
                              </DialogHeader>
                              <CategoryForm
                                type="update"
                                data={category}
                                onCancel={() => setEditingCategoryId(null)}
                                onSubmitSuccess={() => {
                                  setEditingCategoryId(null);
                                  if (fetchCategories) fetchCategories();
                                }}
                              />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
