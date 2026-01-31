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
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
import { Edit, Trash2, ChevronRight, ChevronDown } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // When searching, show all matches in a flat list
  // When not searching, show hierarchy
  const displayCategories = (searchTerm 
    ? filteredCategories 
    : categories.filter(c => !c.parentId)
  ).sort((a, b) => a.name.localeCompare(b.name));

  const renderCategoryRow = (category: Category, level: number = 0) => {
    const hasChildren = categories.some(c => c.parentId === category.id);
    const isExpanded = expandedIds.has(category.id);
    const subCategories = categories
      .filter((c) => c.parentId === category.id)
      .sort((a, b) => a.name.localeCompare(b.name));

    return (
      <React.Fragment key={category.id}>
        <TableRow className={cn(level > 0 && "bg-zinc-200/20 dark:bg-zinc-900/20")}>
          <TableCell>
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              {!searchTerm && hasChildren && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 mr-1 p-0"
                  onClick={(e) => toggleExpand(category.id, e)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              {!searchTerm && !hasChildren && <div className="w-7" />}
              <span className="font-medium">{category.name}</span>
            </div>
          </TableCell>
          <TableCell>
            <Badge
              className={cn(
                "mt-1 text-white",
                category.type === CategoryType.INCOME ? "bg-green-500" : "bg-red-500"
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
        {!searchTerm && isExpanded && subCategories.map(sub => renderCategoryRow(sub, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>All Categories</CardTitle>
            <CardDescription>Manage your transaction categories</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? "No matching categories found." : "No categories found. Create one to get started."}
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
              {displayCategories.map((category) => renderCategoryRow(category))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
